import moment from "moment";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useImagePickerLock } from "../../../utils/imagePickerSafe";
import Video from "react-native-video";
import { useDispatch, useSelector } from "react-redux";
import { Typography } from "../../../components/Typography";
import { AppContainer } from "../../../components/layouts/AppContainer";
import colors from "../../../constants/colors";
import { fontsFamily } from "../../../constants/fonts";
import { IMAGES } from "../../../constants/images";
import Actions from "../../../redux/actions/globalActions";
import { AppendNewMessage } from "../../../redux/globalSlice";
import helper from "../../../utils/helper";
import { compressImageForUpload } from "../../../utils/compressMedia";
import chatSocket from "../../../utils/chatSocket";

const androidOsRelease = Platform.OS === "android" ? Number(Platform.constants?.Release) || 0 : 99;

let typingTimeout = null;
let typingEmitTimeout = null;

const isVideoMedia = (item) => {
  const t = String(item?.mediaFile?.type || item?.mediaFile?.mimetype || "").toUpperCase();
  const u = String(item?.mediaFile?.url || "").toLowerCase();
  return (
    t === "VIDEO" ||
    t.includes("VIDEO") ||
    /video\//i.test(String(item?.mediaFile?.mimetype || "")) ||
    /\.(mp4|mov|m4v|webm)(\?|$)/i.test(u)
  );
};

const getReplySnippet = (reply) => {
  if (!reply) return "";
  const raw = String(reply.message || "").trim();
  if (raw.length) return raw.length > 100 ? `${raw.slice(0, 97)}…` : raw;
  if (reply.mediaFile?.url) {
    const t = String(reply.mediaFile?.type || "").toUpperCase();
    return t.includes("VIDEO") ? "Video" : "Photo";
  }
  return "Message";
};

const replyAuthorLabel = (reply, userData, otherUser) => {
  const fid = reply?.from?._id != null ? reply.from._id : reply?.from;
  if (fid != null && String(fid) === String(userData?._id)) return "You";
  const n = [otherUser?.firstName, otherUser?.lastName].filter(Boolean).join(" ").trim();
  return n || "User";
};

const Messages = (props) => {
  const [value, setValue] = useState("");
  const msgListRef = useRef(null);
  const typingStopRef = useRef({
    chatId: undefined,
    userId: undefined,
    receiverId: undefined,
  });

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [typing, setTypingStatus] = useState(false);
  const [preview, setPreview] = useState(null);
  const [sendingMedia, setSendingMedia] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  /** WhatsApp-style reply target (long-press a bubble). */
  const [replyingTo, setReplyingTo] = useState(null);
  const { bottom: insetBottom } = useSafeAreaInsets();
  const { launchImageLibrary, launchCamera } = useImagePickerLock();
  const dispatch = useDispatch();
  const { messages } = useSelector((state) => state.globalState);
  const { userData, token } = useSelector((state) => state.user);
  const params = props.route?.params;
  const routeItem = params?.item;
  const chatId = routeItem?._id;
  const otherUser = routeItem?.usersData?.[0];

  const scrollToQuoted = useCallback(
    (reply) => {
      const id = reply?._id;
      if (id == null) return;
      const list = messages?.data ?? [];
      const idx = list.findIndex((m) => String(m?._id) === String(id));
      if (idx < 0 || !msgListRef.current) return;
      requestAnimationFrame(() => {
        try {
          msgListRef.current.scrollToIndex({
            index: idx,
            animated: true,
            viewPosition: 0.45,
          });
        } catch {
          /* list not measured */
        }
      });
    },
    [messages?.data]
  );

  function receivedNewMessage(payload) {
    if (!payload || !chatId) return;
    const payloadChatId = String(payload?.chatId ?? payload?.chat?._id ?? payload?.conversationId ?? "");
    if (payloadChatId && payloadChatId !== String(chatId)) return;

    const senderRaw =
      payload?.sender?._id ??
      payload?.sender ??
      payload?.from?._id ??
      payload?.from ??
      payload?.senderId;
    const senderId = senderRaw != null ? String(senderRaw) : "";
    const IsItMe = senderId && String(userData?._id) === senderId;

    const fromId =
      payload?.from != null
        ? String(payload.from?._id ?? payload.from)
        : IsItMe
          ? userData?._id
          : otherUser?._id;
    const toId =
      payload?.to != null
        ? String(payload.to?._id ?? payload.to)
        : IsItMe
          ? otherUser?._id
          : userData?._id;

    const newMsg = {
      _id: payload?._id ?? null,
      chatId,
      from: fromId,
      to: toId,
      message: payload?.content ?? payload?.message ?? payload?.text ?? "",
      messageType: payload?.messageType ?? payload?.type ?? "TEXT",
      mediaFile: payload?.mediaFile ?? payload?.media ?? null,
      replyTo: payload?.replyTo ?? null,
      createdAt: payload?.createdAt ?? new Date().toISOString(),
      updatedAt: payload?.updatedAt ?? new Date().toISOString(),
    };

    dispatch(AppendNewMessage(newMsg));
    if (!IsItMe) {
      dispatch(
        Actions.ReadMessages({
          chatId,
          callback: () => {
            emitReadReceipt();
          },
        })
      );
    }
  }

  function userTypingHandler(payload = {}) {
    const payloadChatId = String(payload?.chatId ?? payload?.conversationId ?? "");
    if (payloadChatId && payloadChatId !== String(chatId)) return;
    if (payload?.userId && payload?.userId === userData?._id) return;
    setTypingStatus(payload?.isTyping !== false);
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      typingTimeout = null;
    }
    typingTimeout = setTimeout(() => {
      setTypingStatus(false);
    }, 1500);
  }

  function messageReadHandler(payload = {}) {
    const payloadChatId = String(payload?.chatId ?? payload?.conversationId ?? "");
    if (payloadChatId && payloadChatId !== String(chatId)) return;
    dispatch(Actions.GetChats({ callback: () => {} }));
  }

  const emitReadReceipt = () => {
    chatSocket.markMessageRead({
      chatId,
      userId: userData?._id,
    });
  };

  typingStopRef.current = {
    chatId,
    userId: userData?._id,
    receiverId: otherUser?._id,
  };

  /** Keyboard height for shell `paddingBottom` (ChatDetail / Go_Live style). */
  useEffect(() => {
    const onShow = (e) => {
      const h = e?.endCoordinates?.height ?? 0;
      setKeyboardHeight(
        Platform.OS === "ios" ? Math.max(0, h - (insetBottom ?? 0)) : h
      );
    };
    const onHide = () => {
      setKeyboardHeight(0);
      const { chatId, userId, receiverId } = typingStopRef.current;
      if (chatId && userId) {
        chatSocket.sendTypingStop({ chatId, userId, receiverId });
      }
      if (typingEmitTimeout) {
        clearTimeout(typingEmitTimeout);
        typingEmitTimeout = null;
      }
    };
    const subShow = Keyboard.addListener("keyboardDidShow", onShow);
    const subHide = Keyboard.addListener("keyboardDidHide", onHide);
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, [insetBottom]);

  useEffect(() => {
    const evt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const sub = Keyboard.addListener(evt, () => {
      setTimeout(() => {
        msgListRef.current?.scrollToOffset?.({ offset: 0, animated: true });
      }, 80);
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ref stable; mount-only listener
  }, []);

  useEffect(() => {
    if (!chatId) {
      setLoading(false);
      return;
    }

    let sock;
    const joinRoom = () => chatSocket.joinChat(chatId);
    if (token && userData?._id) {
      sock = chatSocket.connect({
        token,
        userId: userData._id,
      });
      joinRoom();
      sock.on("connect", joinRoom);
    }

    getMessages();
    emitReadReceipt();

    const offNewMessage = chatSocket.on("new-message", receivedNewMessage);
    const offReceiveMessage = chatSocket.on("receiveMessage", receivedNewMessage);
    const offNewMessageSnake = chatSocket.on("new_message", receivedNewMessage);
    const offReceiveMessageSnake = chatSocket.on("receive_message", receivedNewMessage);
    const offTypingLegacy = chatSocket.on("user-typing", userTypingHandler);
    const offTypingSnake = chatSocket.on("user_typing", userTypingHandler);
    const offTypingStart = chatSocket.on("typing_start", userTypingHandler);
    const offTypingStartDash = chatSocket.on("typing-start", userTypingHandler);
    const offMessageRead = chatSocket.on("message-read", messageReadHandler);
    const offMessageReadSnake = chatSocket.on("message_read", messageReadHandler);
    const offChatUpdated = chatSocket.on("chat-updated", messageReadHandler);

    return () => {
      if (sock) sock.off("connect", joinRoom);
      offNewMessage?.();
      offReceiveMessage?.();
      offNewMessageSnake?.();
      offReceiveMessageSnake?.();
      offTypingLegacy?.();
      offTypingSnake?.();
      offTypingStart?.();
      offTypingStartDash?.();
      offMessageRead?.();
      offMessageReadSnake?.();
      offChatUpdated?.();
      chatSocket.leaveChat(chatId);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        typingTimeout = null;
      }
      if (typingEmitTimeout) {
        clearTimeout(typingEmitTimeout);
        typingEmitTimeout = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers close over chatId/userData; re-subscribe when auth or chat changes
  }, [chatId, token, userData?._id]);

  const getMessages = () => {
    dispatch(
      Actions.GetMessages({
        chat: chatId,
        callback: () => {
          const unread = routeItem?.unReadMessage;
          const unreadUid = Array.isArray(unread)
            ? unread.find((u) => (u?.unReadMessageCount ?? 0) > 0)?.userId
            : unread?.userId;
          if (userData?._id && String(userData._id) === String(unreadUid)) {
            dispatch(
              Actions.ReadMessages({
                chatId,
                callback: () => {
                  emitReadReceipt();
                },
              })
            );
          } else emitReadReceipt();
          setLoading(false);
        },
      })
    );
  };

  const _onEndReached = () => {
    if (messages?.pagination?.hasNext) {
      setLoadingMore(true);
      dispatch(
        Actions.GetMoreMessages({
          page: messages?.pagination?.current + 1,
          chat: chatId,
          callback: () => {
            setLoadingMore(false);
          },
        })
      );
    }
  };

  const sendMedia = async (asset) => {
    if (!asset?.uri || !otherUser?._id || !userData?._id) return;
    const mime = String(asset.type || "");
    if (mime.startsWith("video") || mime === "video/mp4") return;
    Keyboard.dismiss();
    setSendingMedia(true);
    const caption = value.trim() || "Photo";
    let uploadUri = asset.uri;
    try {
      uploadUri = await compressImageForUpload(asset.uri);
      if (
        Platform.OS === "android" &&
        uploadUri &&
        !uploadUri.startsWith("file://") &&
        !uploadUri.startsWith("content://")
      ) {
        uploadUri = `file://${uploadUri}`;
      }
    } catch {
      uploadUri = asset.uri;
    }
    const safeName = (() => {
      const n = asset.fileName || asset.uri?.split("/").pop() || "chat.jpg";
      return String(n).replace(/\.[^.]+$/i, ".jpg");
    })();
    try {
      await dispatch(
        Actions.SendMessage({
          to: otherUser._id,
          from: userData?._id,
          chat: chatId,
          message: caption,
          messageType: "BOTH",
          replyToMessageId: replyingTo?._id,
          media: {
            uri: uploadUri,
            type: "image/jpeg",
            fileName: safeName,
          },
          callback: () => {},
        })
      ).unwrap();
      setValue("");
      setReplyingTo(null);
    } catch {
      /* toast already in thunk */
    } finally {
      setSendingMedia(false);
    }
  };

  const onPickedAsset = (res) => {
    if (res?.didCancel || res?.errorCode) return;
    const a = res?.assets?.[0];
    if (a) {
      setShowAttachmentOptions(false);
      sendMedia(a);
    }
  };

  const pickerPhotoOptions = {
    mediaType: "photo",
    selectionLimit: 1,
    maxWidth: 2048,
    maxHeight: 2048,
    quality: 0.8,
  };

  const pickGalleryPhoto = () => {
    launchImageLibrary(pickerPhotoOptions, onPickedAsset);
  };
  const takeCameraPhoto = () => {
    launchCamera(
      {
        mediaType: "photo",
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.8,
        saveToPhotos: false,
      },
      onPickedAsset
    );
  };
  const openAttachmentSheet = () => {
    Keyboard.dismiss();
    setShowAttachmentOptions(true);
  };

  const onSend = () => {
    if (!value.length) return;
    chatSocket.sendTypingStop({
      chatId,
      userId: userData?._id,
      receiverId: otherUser?._id,
    });
    if (typingEmitTimeout) {
      clearTimeout(typingEmitTimeout);
      typingEmitTimeout = null;
    }
    // Text: only REST — backend emits to socket after save. Socket `sendMessage` would create a second DB row.
    void dispatch(
      Actions.SendMessage({
        to: otherUser?._id,
        from: userData?._id,
        chat: chatId,
        message: value,
        messageType: "TEXT",
        replyToMessageId: replyingTo?._id,
        callback: () => {},
      })
    )
      .unwrap()
      .then(() => {
        setValue("");
        setReplyingTo(null);
      })
      .catch(() => {});
    Keyboard.dismiss();
  };

  const goProfile = () => {
    Keyboard.dismiss();
    if (otherUser?._id) props.navigation.navigate("UserProfile", { userID: otherUser._id });
  };

  const shellPaddingBottom =
    Platform.OS === "ios"
      ? Math.max(0, keyboardHeight)
      : androidOsRelease < 15
        ? 0
        : Math.max(0, keyboardHeight);

  // eslint-disable-next-line react/no-unstable-nested-components -- small header; avoids prop drilling
  const RenderHeader = () => (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.headerBar}>
      <TouchableOpacity onPress={() => props.navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Image source={IMAGES.backBtnDark} style={styles.backIcon} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerUser} onPress={goProfile} activeOpacity={0.85}>
        <Image
          source={
            helper.getMediaSourceOrUri(
              otherUser?.profileImage || otherUser?.profileVideoThumbnail
            ) ?? IMAGES.men
          }
          style={styles.headerAvatar}
        />
        <View style={styles.flex1}>
          <Typography
            children={
              routeItem?.usersData?.length > 0
                ? `${routeItem.usersData[0].firstName} ${routeItem.usersData[0].lastName}`
                : "Chat"
            }
            size={16}
            textType="semiBold"
          />
          {typing ? (
            <Typography size={12} textType="light" color={colors.primary} children="typing…" />
          ) : null}
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.viewPill} onPress={goProfile} activeOpacity={0.85}>
        <Text style={styles.viewPillText}>View</Text>
      </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );

  const messageInput = () => (
    <View style={styles.inputWrap}>
      {replyingTo ? (
        <View style={styles.replyBanner}>
          <View style={styles.replyBannerAccent} />
          <View style={styles.replyBannerBody}>
            <Text style={styles.replyBannerTitle} numberOfLines={1}>
              {`Replying to ${replyAuthorLabel(replyingTo, userData, otherUser)}`}
            </Text>
            <Text style={styles.replyBannerSnippet} numberOfLines={2}>
              {getReplySnippet(replyingTo)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setReplyingTo(null)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Cancel reply"
          >
            <Ionicons name="close" size={22} color="#666" />
          </TouchableOpacity>
        </View>
      ) : null}
      <View
        style={[
          styles.inputBar,
          { paddingBottom: Math.max(insetBottom, 10) },
        ]}
      >
      <TouchableOpacity
        style={styles.attachBtn}
        onPress={openAttachmentSheet}
        disabled={sendingMedia}
        hitSlop={{ top: 8, bottom: 8 }}
      >
        {sendingMedia ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Ionicons name="add" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        onSubmitEditing={() => Keyboard.dismiss()}
        blurOnSubmit={false}
        autoCapitalize="sentences"
        autoCorrect={false}
        spellCheck={false}
        autoComplete="off"
        {...(Platform.OS === "android" ? { importantForAutofill: "no" } : {})}
        value={value}
        onChangeText={(text) => {
          setValue(text);
          chatSocket.sendTypingStart({
            chatId,
            userId: userData?._id,
            receiverId: otherUser?._id,
          });
          if (typingEmitTimeout) clearTimeout(typingEmitTimeout);
          typingEmitTimeout = setTimeout(() => {
            chatSocket.sendTypingStop({
              chatId,
              userId: userData?._id,
              receiverId: otherUser?._id,
            });
          }, 1200);
        }}
        onFocus={() => {
          setShowAttachmentOptions(false);
        }}
        returnKeyType="default"
        multiline
        placeholder="Type a message…"
        placeholderTextColor="#9aa0a6"
        keyboardType="default"
      />
      <TouchableOpacity onPress={onSend} activeOpacity={0.8} style={styles.sendBtn}>
        <Image source={IMAGES.sendIcon} style={styles.sendIconImg} />
      </TouchableOpacity>
      </View>
    </View>
  );

  const chatBubble = ({ item }) => {
    const fromRaw = item?.from?._id != null ? item.from._id : item?.from;
    if (fromRaw == null && item?.from == null) return <View />;
    const mine = String(fromRaw ?? "") === String(userData?._id ?? "");
    const mediaUrl = item?.mediaFile?.url ? helper.resolveMediaUrl(item.mediaFile.url) : null;
    const hasMedia = Boolean(mediaUrl);
    const video = hasMedia && isVideoMedia(item);
    const mediaSource = mediaUrl
      ? helper.getMediaSource(item.mediaFile.url) || { uri: mediaUrl }
      : null;
    const reply = item?.replyTo;

    return (
      <View style={styles.bubbleWrap}>
        <Pressable
          onLongPress={() => {
            Keyboard.dismiss();
            setReplyingTo({
              _id: item._id,
              message: item.message,
              messageType: item.messageType,
              from: item.from,
              mediaFile: item.mediaFile,
            });
          }}
          delayLongPress={380}
        >
          <View style={[styles.msgView, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
            {reply ? (
              <Pressable
                onPress={() => scrollToQuoted(reply)}
                style={[styles.replyQuote, mine ? styles.replyQuoteMine : styles.replyQuoteTheirs]}
              >
                <View style={styles.replyTextCol}>
                  <Text style={[styles.replyAuthor, mine && styles.replyAuthorMine]} numberOfLines={1}>
                    {replyAuthorLabel(reply, userData, otherUser)}
                  </Text>
                  <Text style={[styles.replySnippet, mine && styles.replySnippetMine]} numberOfLines={2}>
                    {getReplySnippet(reply)}
                  </Text>
                </View>
              </Pressable>
            ) : null}
            {hasMedia && mediaSource ? (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  Keyboard.dismiss();
                  setPreview({
                    ...mediaSource,
                    video,
                  });
                }}
              >
                {video ? (
                  <Video
                    source={mediaSource}
                    style={styles.mediaThumb}
                    resizeMode="cover"
                    paused
                    muted
                  />
                ) : (
                  <Image
                    source={mediaSource}
                    style={styles.mediaThumb}
                    resizeMode="cover"
                    {...(Platform.OS === "android" ? { resizeMethod: "resize" } : {})}
                  />
                )}
                <View style={styles.viewBadge}>
                  <Text style={styles.viewBadgeText}>Tap to view</Text>
                </View>
              </TouchableOpacity>
            ) : null}
            {item?.message && String(item.message).trim().length > 0 && (
              <Typography
                size={15}
                color={!mine ? colors.black : "#fff"}
                textType="light"
                style={hasMedia || reply ? styles.msgTextAfterMedia : undefined}
              >
                {item.message}
              </Typography>
            )}
          </View>
        </Pressable>
        <Typography textType="light" size={9} color="#888" style={mine ? styles.timeRowMine : styles.timeRowTheirs}>
          {moment(item?.createdAt).fromNow()}
        </Typography>
      </View>
    );
  };

  if (!chatId || !routeItem) {
    return (
      <AppContainer>
        <View style={styles.missingChat}>
          <Text style={styles.missingChatText}>This chat could not be opened.</Text>
          <TouchableOpacity
            onPress={() => props.navigation.goBack()}
            style={styles.missingChatBtn}
            activeOpacity={0.85}
          >
            <Text style={styles.missingChatBtnText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </AppContainer>
    );
  }

  return (
    <AppContainer safeArea={true} mode="light">
      <View style={styles.screenRoot}>
        <RenderHeader />
        <View style={[styles.flex1, { paddingBottom: shellPaddingBottom }]}>
          {loading ? (
            <View style={styles.fullLoader}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <>
              <FlatList
                style={styles.msgList}
                data={messages?.data ?? []}
                keyExtractor={(item, index) => String(item?._id ?? index)}
                contentContainerStyle={styles.msgListContent}
                renderItem={chatBubble}
                ref={msgListRef}
                showsVerticalScrollIndicator={false}
                inverted
                onScrollToIndexFailed={(info) => {
                  setTimeout(() => {
                    try {
                      msgListRef.current?.scrollToIndex({
                        index: info.index,
                        animated: true,
                        viewPosition: 0.45,
                      });
                    } catch {
                      /* ignore */
                    }
                  }, 300);
                }}
                onEndReached={_onEndReached}
                onEndReachedThreshold={0.1}
                onScrollBeginDrag={Keyboard.dismiss}
                keyboardShouldPersistTaps="always"
                keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                {...(Platform.OS === "ios" ? { contentInsetAdjustmentBehavior: "never" } : {})}
                ListFooterComponent={
                  loadingMore ? (
                    <ActivityIndicator size="large" color={colors.primary} style={styles.listFooterLoader} />
                  ) : null
                }
                ListEmptyComponent={
                  <View style={styles.empty}>
                    <Typography
                      textType="medium"
                      size={14}
                      color="#aaa"
                      align="center"
                      children="No messages yet. Say hi!"
                    />
                  </View>
                }
              />
              {messageInput()}
            </>
          )}
        </View>

        {showAttachmentOptions ? (
        <Pressable style={styles.attachmentOverlay} onPress={() => setShowAttachmentOptions(false)}>
          <Pressable style={styles.attachmentSheet} onPress={() => {}}>
            <TouchableOpacity style={styles.attachmentOption} onPress={pickGalleryPhoto}>
              <View style={[styles.attachmentIconBg, styles.attachmentIconGallery]}>
                <Ionicons name="image-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.attachmentLabel}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.attachmentOption} onPress={takeCameraPhoto}>
              <View style={[styles.attachmentIconBg, styles.attachmentIconCamera]}>
                <Ionicons name="camera-outline" size={24} color="#fff" />
              </View>
              <Text style={styles.attachmentLabel}>Camera</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      ) : null}

        <Modal visible={!!preview} transparent animationType="fade" onRequestClose={() => setPreview(null)}>
          <View style={styles.previewModal}>
            <TouchableOpacity style={styles.previewClose} onPress={() => setPreview(null)}>
              <Text style={styles.previewCloseText}>Close</Text>
            </TouchableOpacity>
            {preview?.video ? (
              <Video
                source={
                  preview.uri
                    ? helper.getMediaSource(preview.uri) || { uri: preview.uri }
                    : undefined
                }
                style={styles.previewFull}
                resizeMode="contain"
                controls
                repeat={false}
              />
            ) : preview?.uri ? (
              <Image
                source={helper.getMediaSource(preview.uri) || { uri: preview.uri }}
                style={styles.previewFull}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </Modal>
      </View>
    </AppContainer>
  );
};

const styles = StyleSheet.create({
  missingChat: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  missingChatText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  missingChatBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 10,
  },
  missingChatBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  screenRoot: { flex: 1, position: "relative" },
  flex1: { flex: 1 },
  fullLoader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFC",
  },
  backIcon: { width: 25, height: 25 },
  sendIconImg: { width: 20, height: 20 },
  listFooterLoader: { marginVertical: 24 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 56,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5ea",
  },
  headerUser: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
    marginRight: 8,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#eee",
  },
  viewPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F2F2F7",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  viewPillText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  msgList: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "#FAFAFC",
  },
  msgListContent: {
    flexGrow: 1,
  },
  empty: {
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  bubbleWrap: {
    marginVertical: 8,
  },
  msgView: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 16,
    maxWidth: "82%",
    overflow: "hidden",
  },
  bubbleMine: {
    borderBottomRightRadius: 4,
    backgroundColor: colors.primary,
    alignSelf: "flex-end",
  },
  bubbleTheirs: {
    borderBottomLeftRadius: 4,
    backgroundColor: "#EEF0F6",
    alignSelf: "flex-start",
  },
  msgTextAfterMedia: { marginTop: 8 },
  timeRowMine: { alignSelf: "flex-end", marginTop: 4 },
  timeRowTheirs: { alignSelf: "flex-start", marginTop: 4 },
  mediaThumb: {
    width: 220,
    height: 160,
    borderRadius: 12,
    backgroundColor: "#000",
  },
  viewBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  viewBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  inputWrap: {
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E4E6EB",
  },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    paddingRight: 8,
    backgroundColor: "#F0F2F5",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E4E6EB",
  },
  replyBannerAccent: {
    width: 4,
    alignSelf: "stretch",
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginRight: 10,
  },
  replyBannerBody: { flex: 1, minWidth: 0 },
  replyBannerTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 2,
  },
  replyBannerSnippet: {
    fontSize: 13,
    color: "#65676B",
  },
  replyQuote: {
    flexDirection: "row",
    borderLeftWidth: 3,
    paddingLeft: 8,
    marginBottom: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: "hidden",
  },
  replyQuoteMine: {
    borderLeftColor: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  replyQuoteTheirs: {
    borderLeftColor: colors.primary,
    backgroundColor: "rgba(4, 42, 255, 0.06)",
  },
  replyTextCol: { flex: 1, minWidth: 0 },
  replyAuthor: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 2,
  },
  replyAuthorMine: { color: "rgba(255,255,255,0.95)" },
  replySnippet: {
    fontSize: 13,
    color: "#444",
  },
  replySnippetMine: { color: "rgba(255,255,255,0.88)" },
  /** Aligned with Go_Live `msg.jsx` inputArea — border top, iOS bottom 30, gap 10, Android uses `insets.bottom`. */
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    paddingHorizontal: 15,
    // paddingBottom: Platform.OS === "ios" ? 30 : 10,
    backgroundColor: "#fff",
    gap: 10,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F0F2F5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E4E6EB",
  },
  attachmentOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    zIndex: 1000,
  },
  attachmentSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
  },
  attachmentOption: {
    alignItems: "center",
    marginVertical: 8,
    width: 72,
  },
  attachmentIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  attachmentIconGallery: { backgroundColor: "#00897B" },
  attachmentIconCamera: { backgroundColor: "#7CB342" },
  attachmentLabel: {
    fontSize: 12,
    color: "#5a6c7c",
    textAlign: "center",
  },
  input: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderColor: "#E4E6EB",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: fontsFamily.regular,
    color: "#000",
    maxHeight: 100,
    backgroundColor: "#F0F2F5",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  previewModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
  },
  previewClose: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 40,
    right: 16,
    zIndex: 2,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 20,
  },
  previewCloseText: {
    fontWeight: "700",
    color: "#111",
    fontSize: 16,
  },
  previewFull: {
    width: "100%",
    height: "100%",
  },
});

export default Messages;
