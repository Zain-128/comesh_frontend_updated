import moment from "moment";
import React, { createRef, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Typography } from "../../../components/Typography";
import { AppContainer } from "../../../components/layouts/AppContainer";
import colors from "../../../constants/colors";
import { fontsFamily } from "../../../constants/fonts";
import { IMAGES } from "../../../constants/images";
import Actions from "../../../redux/actions/globalActions";
import { AppendNewMessage } from "../../../redux/globalSlice";
import chatSocket from "../../../utils/chatSocket";

let typingTimeout = null;
let typingEmitTimeout = null;

const Messages = (props) => {
  const [value, setValue] = useState("");
  const msgListRef = createRef();

  const [loading, setLoading] = useState(true);
  const [typing, setTypingStatus] = useState(false);
  const dispatch = useDispatch();
  const { messages } = useSelector(state => state.globalState);
  const { userData, token } = useSelector(state => state.user);
  const params = props.route.params;
  const otherUser = params?.item?.usersData?.[0];

  function receivedNewMessage(payload) {
    if (!payload) return;
    const payloadChatId = String(payload?.chatId ?? payload?.chat?._id ?? payload?.conversationId ?? "");
    if (payloadChatId && payloadChatId !== String(params?.item?._id)) return;
    const IsItMe = payload?.sender?._id == userData?._id;
    const from = IsItMe ? userData?._id : otherUser?._id;
    const to = !IsItMe ? userData?._id : otherUser?._id;

    const newMsg = {
      _id: payload?._id ?? null,
      chatId: params?.item?._id,
      from,
      to,
      message: payload?.content ?? payload?.message ?? payload?.text ?? "",
      messageType: "TEXT",
      createdAt: payload?.createdAt ?? new Date().toISOString(),
      updatedAt: payload?.updatedAt ?? new Date().toISOString()
    }

    dispatch(AppendNewMessage(newMsg))
    if (!IsItMe) {
      dispatch(Actions.ReadMessages({
        chatId: params?.item?._id,
        callback: () => {
          emitReadReceipt();
        },
      }));
    }
  }

  // function messageStatusHandler(event) {
  //   console.warn("MESSAGE STATUS", event)
  //   // handle message status change
  // }

  // function systemMessageHandler(event) {
  //   // handle system message
  // }

  function userTypingHandler(payload = {}) {
    const payloadChatId = String(payload?.chatId ?? payload?.conversationId ?? "");
    if (payloadChatId && payloadChatId !== String(params?.item?._id)) return;
    if (payload?.userId && payload?.userId === userData?._id) return;
    setTypingStatus(payload?.isTyping !== false)
    if (typingTimeout) {
      clearTimeout(typingTimeout)
      typingTimeout = null
    }
    typingTimeout = setTimeout(() => {
      setTypingStatus(false)
    }, 1500)
  }

  function messageReadHandler(payload = {}) {
    const payloadChatId = String(payload?.chatId ?? payload?.conversationId ?? "");
    if (payloadChatId && payloadChatId !== String(params?.item?._id)) return;
    dispatch(Actions.GetChats({ callback: () => { } }));
  }

  const emitReadReceipt = () => {
    chatSocket.markMessageRead({
      chatId: params?.item?._id,
      userId: userData?._id,
    });
  };

  useEffect(() => {
    chatSocket.connect({
      token,
      userId: userData?._id,
    });
    chatSocket.joinChat(params?.item?._id);
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
      chatSocket.leaveChat(params?.item?._id);
      if (typingTimeout) {
        clearTimeout(typingTimeout)
        typingTimeout = null
      }
      if (typingEmitTimeout) {
        clearTimeout(typingEmitTimeout)
        typingEmitTimeout = null
      }
    }

  }, [])

  const getMessages = () => {
    dispatch(Actions.GetMessages({
      chat: params?.item?._id,
      callback: () => {
        if (userData._id == params?.item?.unReadMessage?.userId)
          dispatch(Actions.ReadMessages({
            chatId: params?.item?._id,
            callback: () => {
              emitReadReceipt();
            }
          }))
        else emitReadReceipt();
        setLoading(false);
      }
    }));
  }

  const _onEndReached = () => {
    if (messages?.pagination?.hasNext) {
      setLoading(true)
      dispatch(Actions.GetMoreMessages({
        page: messages?.pagination?.current + 1,
        chat: params.item._id,
        callback: () => {
          setLoading(false)
        }
      }));
    }
  }

  const onSend = () => {
    if (!value.length) return;
    chatSocket.sendTypingStop({
      chatId: params?.item?._id,
      userId: userData?._id,
      receiverId: otherUser?._id,
    });
    if (typingEmitTimeout) {
      clearTimeout(typingEmitTimeout);
      typingEmitTimeout = null;
    }
    chatSocket.sendMessage({
      chatId: params?.item?._id,
      content: value,
      messageType: "text",
      senderId: userData?._id,
      receiverId: otherUser?._id,
    });
    dispatch(Actions.SendMessage({
      to: otherUser?._id,
      from: userData?._id,
      chat: params?.item?._id,
      message: value,
      media: "",
      callback: () => {

      }
    }))
    setValue("");
  };

  const RenderHeader = () => (
    <View style={styles.headerBar}>
      <TouchableOpacity onPress={() => props.navigation.goBack()}>
        <Image source={IMAGES.backBtnDark} style={{ width: 25, height: 25 }} />
      </TouchableOpacity>
      <View
        style={{ flexDirection: "row", alignItems: "center", marginLeft: 20 }}
      >
        <Image
          source={{ uri: "https://cdn-icons-png.flaticon.com/512/6596/6596121.png" }}
          style={{ width: 40, height: 40, borderRadius: 20, marginRight: 10 }}
        />
        <View>
          <Typography children={params?.item.usersData.length > 0 ? params?.item.usersData[0].firstName + " " + params?.item.usersData[0].lastName : "No name available"} size={16} />
          {
            typing == true &&
            <Typography
              children={typing == true ? params?.item.usersData.length > 0 ? params?.item.usersData[0].firstName + " is typing" : "typing" : ""}
              size={12}
              textType={"light"}
            />
          }
        </View>
      </View>
    </View>
  );

  const messageInput = () => {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS == "ios" ? "padding" : undefined}
      >
        <View style={styles.chatKeyboard}>
          <TextInput
            style={styles.input}
            onSubmitEditing={() => {
              Keyboard.dismiss();
            }}
            autoCapitalize="none"
            blurOnSubmit={true}
            value={value}
            onChangeText={(text) => {
              setValue(text)
              chatSocket.sendTypingStart({
                chatId: params?.item?._id,
                userId: userData?._id,
                receiverId: otherUser?._id,
              });
              if (typingEmitTimeout) clearTimeout(typingEmitTimeout);
              typingEmitTimeout = setTimeout(() => {
                chatSocket.sendTypingStop({
                  chatId: params?.item?._id,
                  userId: userData?._id,
                  receiverId: otherUser?._id,
                });
              }, 1200);
            }}
            returnKeyType="done"
            multiline={true}
            placeholder="Type your message...."
            keyboardType="default"
          />
          <TouchableOpacity
            onPress={() => onSend()}
            activeOpacity={0.8}
            style={{
              paddingVertical: 5,
              alignSelf: "flex-end",
            }}
          >
            <Image source={IMAGES.sendIcon} style={{ width: 30, height: 30 }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  const chatBubble = ({ item }) => {
    if (!item?.from)
      return < View />
    else {
      const mine = item?.from == userData._id;
      return (
        <View
          key={item?._id}
          style={{
            marginVertical: 12,
          }}>
          <View
            key={item?.id}
            style={[
              styles.msgView,
              mine
                ? {
                  borderBottomRightRadius: 0,
                  backgroundColor: "#ED01FF",
                  alignSelf: "flex-end",
                }
                : {
                  borderBottomLeftRadius: 0,
                  backgroundColor: "#ECF2FF",
                  alignSelf: "flex-start",
                },
            ]}
          >
            <Typography color={!mine ? colors.black : "#fff"} textType={"light"}>
              {item?.message}
            </Typography>
          </View>
          <Typography
            key={item?._id}
            textType="light"
            size={9}
            color={"#000"}
            style={{
              alignSelf: !mine ? "flex-start" : 'flex-end',
            }}
          >
            {moment(item?.createdAt).fromNow()}
          </Typography>
        </View>
      );
    }
  };


  return (
    <AppContainer safeArea={true} mode="light">
      <RenderHeader />

      <FlatList
        style={{ paddingHorizontal: 20, flex: 1 }}
        data={messages?.data}
        keyExtractor={(item, index) => index + "/" + (Math.random() * 1000)}
        renderItem={chatBubble}
        ref={msgListRef}
        showsVerticalScrollIndicator={false}
        inverted
        onEndReached={_onEndReached}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          loading &&
          <ActivityIndicator size={"large"} color={colors.primary} />
        }
      />
      {messageInput()}
    </AppContainer>
  );
};

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 60,
  },
  msgView: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    maxWidth: "80%",
  },
  chatKeyboard: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 0.5,
    marginTop: 10,
    borderTopColor: "#E8E8E8",
  },
  inputView: {
    flex: 1,
    paddingHorizontal: 10,
    fontFamily: fontsFamily.regular,
    textTransform: "capitalize",
    borderColor: "gray",
    justifyContent: "center",
    maxHeight: 150,
  },
  input: {
    fontFamily: fontsFamily.regular,
    flex: 1,
  },
});
export default Messages;

const MESSAGS = [
  {
    id: 4,
    message: "Hmm, everything is fine",
    created_at: "14:02",
    mine: true,
  },
  {
    id: 3,
    message: "I am doing great! How are you today?",
    created_at: "14:02",
  },
  {
    id: 2,
    message: "Hello! Castro",
    created_at: "14:02",
  },
  {
    id: 1,
    message: "Hello! What’s up?",
    created_at: "14:02",
    mine: true,
  },
];
