import { useFocusEffect, useNavigation } from "@react-navigation/native";
import moment from "moment";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { widthPercentageToDP } from "react-native-responsive-screen";
import { useDispatch, useSelector } from "react-redux";
import Text from "../../../components/Text";
import { Typography } from "../../../components/Typography";
import { AppContainer } from '../../../components/layouts/AppContainer';
import colors from "../../../constants/colors";
import { IMAGES } from "../../../constants/images";
import Actions from "../../../redux/actions/globalActions";
import chatSocket from "../../../utils/chatSocket";
import helper from "../../../utils/helper";
import { parseLikedBySomeoneResponse } from "../../../utils/matchHelpers";
import Header from "./Header";

const SectionLoader = () => (
  <View style={styles.sectionLoader}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={styles.loaderHint}>Loading…</Text>
  </View>
);

const EmptyHint = ({ children }) => (
  <View style={styles.emptyHint}>
    <Text style={styles.emptyHintText}>{children}</Text>
  </View>
);

/** Shape expected by `Messages` — use when navigating: `navigation.navigate('Messages', { item: DUMMY_MESSAGES_CHAT_ITEM })` */
export const DUMMY_MESSAGES_CHAT_ITEM = {
  _id: "000000000000000000000001",
  latestMessage: "Hey! This is a preview chat.",
  createdAt: new Date().toISOString(),
  usersData: [
    { _id: "000000000000000000000002", firstName: "Demo", lastName: "User" },
  ],
  unReadMessage: { unReadMessageCount: 0, userId: null },
};

function unreadCountForUser(chat, userId) {
  if (!chat?.unReadMessage || userId == null) return 0;
  const rows = Array.isArray(chat.unReadMessage)
    ? chat.unReadMessage
    : [chat.unReadMessage];
  const row = rows.find((u) => String(u?.userId) === String(userId));
  return Math.max(0, Number(row?.unReadMessageCount) || 0);
}

const Chat = (props) => {


  const [chatsLoading, setChatsLoading] = useState(true);
  const [likesLoading, setLikesLoading] = useState(true);
  const [chatsLoadingMore, setChatsLoadingMore] = useState(false);
  const [refreshingChats, setRefreshingChats] = useState(false);
  const [refreshingLikes, setRefreshingLikes] = useState(false);
  const [likeUsers, setLikeUsers] = useState([]);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { chats } = useSelector(state => state.globalState);
  const { token, userData } = useSelector(state => state.user);

  const fetchLikes = React.useCallback((opts = {}) => {
    const { refresh = false } = opts;
    if (refresh) setRefreshingLikes(true);
    else setLikesLoading(true);

    dispatch(
      Actions.getLikesUsers({
        callback: (data) => {
          if (refresh) setRefreshingLikes(false);
          else setLikesLoading(false);
          if (data?.success) {
            setLikeUsers(parseLikedBySomeoneResponse(data));
          }
        },
      })
    );
  }, [dispatch]);

  const fetchChats = React.useCallback((opts = {}) => {
    const { refresh = false } = opts;
    if (refresh) setRefreshingChats(true);
    else setChatsLoading(true);

    const done = () => {
      if (refresh) setRefreshingChats(false);
      else setChatsLoading(false);
    };

    dispatch(Actions.GetChats({ callback: done }));
  }, [dispatch]);

  useFocusEffect(
    React.useCallback(() => {
      fetchLikes();
      fetchChats();
    }, [fetchLikes, fetchChats])
  );

  useEffect(() => {
    if (!token || !userData?._id) return;

    chatSocket.connect({
      token,
      userId: userData._id,
    });

    const offChatUpdated = chatSocket.on("chat-updated", () => {
      fetchChats({ refresh: true });
    });

    return () => {
      offChatUpdated?.();
    };
  }, [token, userData?._id, fetchChats]);

  const _onEndReached = () => {
    if (!chats?.pagination?.hasNext || chatsLoadingMore) return;
    setChatsLoadingMore(true);
    dispatch(
      Actions.GetMoreChats({
        page: chats.pagination.current + 1,
        callback: () => setChatsLoadingMore(false),
      })
    );
  };

  const likesCount =
    likeUsers?.length > 0
      ? likeUsers.length
      : Array.isArray(userData?.likedBySomeone)
        ? userData.likedBySomeone.length
        : 0;

  return (
    <AppContainer>
      <Header {...props} />
      <View style={{ gap: 20, flex: 1 }}>
        <View style={{}}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10 }}>
            <Text style={{ fontWeight: "500", fontSize: 20, }}>
              Likes
            </Text>
            {likesCount > 0 ? (
              <View style={styles.likesBadge}>
                <Text style={{ color: "#fff" }}>{likesCount}</Text>
              </View>
            ) : null}
          </View>
          {likesLoading ? (
            <SectionLoader />
          ) : (
            <FlatList
              onRefresh={() => fetchLikes({ refresh: true })}
              refreshing={refreshingLikes}
              horizontal
              showsHorizontalScrollIndicator={false}
              data={likeUsers}
              keyExtractor={(item, index) =>
                String(item?._id ?? item?.id ?? index)
              }
              style={{ marginHorizontal: 10, marginTop: 10 }}
              contentContainerStyle={[
                { gap: 10, paddingBottom: 8 },
                likeUsers.length === 0 && styles.likesListEmptyGrow,
              ]}
              ListEmptyComponent={
                <EmptyHint>
                  No likes yet — keep swiping and people who like you will show here.
                </EmptyHint>
              }
              renderItem={({ item }) => {
                const userId = item?._id ?? item?.id;
                const displayName = helper.getUserDisplayName(item, "User");
                const fallbackAvatar = IMAGES.profileIcon;
                const avatarSource =
                  helper.getMediaSource(
                    item?.profileVideoThumbnail ||
                      item?.profileImage ||
                      item?.profileVideo
                  ) || fallbackAvatar;

                return (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => {
                      if (userId == null) return;
                      props.navigation.navigate("UserProfile", {
                        userID: userId,
                        prefillName: displayName,
                      });
                    }}
                    style={styles.likeCard}
                  >
                    <ImageBackground
                      style={styles.likeCardFrame}
                      resizeMode="stretch"
                      source={require("../../../assets/images/likeBorder.png")}
                    >
                      <View style={styles.likeCardImageWrap}>
                        <Image
                          source={avatarSource}
                          resizeMode="cover"
                          style={styles.likeCardImage}
                        />
                      </View>
                    </ImageBackground>
                    <Image
                      style={styles.likeCardBadge}
                      resizeMode="contain"
                      source={require("../../../assets/images/likebtn.png")}
                    />
                    <Text style={styles.likeCardName} numberOfLines={1}>
                      {displayName}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
        <View style={{ gap: 10, flex: 1 }}>
          <Text style={{ fontWeight: "500", fontSize: 20, paddingHorizontal: 20 }}>
            All Messages
          </Text>
          {chatsLoading ? (
            <SectionLoader />
          ) : (
            <FlatList
              style={{ flex: 1 }}
              onRefresh={() => fetchChats({ refresh: true })}
              refreshing={refreshingChats}
              data={chats?.data ?? []}
              keyExtractor={(item, index) => String(item?._id ?? index)}
              contentContainerStyle={[
                { paddingHorizontal: 20, flexGrow: 1 },
                !(chats?.data?.length) && styles.messagesListEmptyGrow,
              ]}
              ListEmptyComponent={
                <EmptyHint>No conversations yet. Match with someone to start chatting!</EmptyHint>
              }
              renderItem={(i) => <ListItem {...i} {...props} userData={userData} />}
              onEndReached={_onEndReached}
              onEndReachedThreshold={0.1}
              ListFooterComponent={
                chatsLoadingMore ? (
                  <View style={styles.listFooterLoader}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : null
              }
            />
          )}
        </View>
      </View>
    </AppContainer>
  );
};

const ListItem = ({ item, index, navigation, userData }) => {
  const peer = item.usersData?.[0];
  const [rowAvatarFail, setRowAvatarFail] = useState(false);
  useEffect(() => {
    setRowAvatarFail(false);
  }, [
    item?._id,
    peer?._id,
    peer?.profileImage,
    peer?.profileVideoThumbnail,
    peer?.profileVideo,
  ]);
  const rowAvatar =
    peer &&
    helper.getMediaSource(
      peer.profileVideoThumbnail || peer.profileImage || peer.profileVideo,
    );
  
  const isFemale = peer?.gender?.toLowerCase() === 'female';
  const fallbackAvatar = IMAGES.profileIcon;

  const unread = unreadCountForUser(item, userData?._id);
  const listTime =
    item?.latestMessageTime ||
    item?.updatedAt ||
    item?.createdAt;
  return (
    <TouchableOpacity style={styles.itemView} onPress={() => navigation.navigate('Messages', { item })}>
      <Image
        source={rowAvatar && !rowAvatarFail ? rowAvatar : fallbackAvatar}
        onError={() => setRowAvatarFail(true)}
        style={styles.itemImage}
      />
      <View style={styles.itemContent}>
        <View style={{ flex: 1 }}>
          <Typography children={helper.getUserDisplayName(item.usersData?.[0], "No name available")} size={15} />
          <Typography
            children={item.latestMessage ? item.latestMessage : "Start a new conversation"}
            size={12}
            textType={"light"}
            color={"#999B9F"}
            numberOfLines={2}
          />
        </View>
        <View style={{ alignItems: "center" }}>
          <Typography
            children={listTime ? moment(listTime).fromNow() : ""}
            color={"#999B9F"}
            textType={"light"}
            size={10}
          />
          {unread > 0 ? (
            <View style={styles.unreadCount}>
              <Typography children={String(unread > 99 ? "99+" : unread)} color={"#fff"} size={12} />
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  sectionLoader: {
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
  },
  loaderHint: {
    marginTop: 10,
    color: "#999B9F",
    fontSize: 14,
  },
  emptyHint: {
    minHeight: 100,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  emptyHintText: {
    textAlign: "center",
    color: "#999B9F",
    fontSize: 14,
    lineHeight: 20,
  },
  likesBadge: {
    backgroundColor: "red",
    width: 25,
    height: 25,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  likesListEmptyGrow: {
    flexGrow: 1,
    minWidth: "100%",
  },
  messagesListEmptyGrow: {
    flexGrow: 1,
    justifyContent: "center",
  },
  listFooterLoader: {
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  likeCard: {
    width: widthPercentageToDP(26),
    marginBottom: 4,
    alignItems: "center",
  },
  likeCardFrame: {
    width: widthPercentageToDP(25),
    height: widthPercentageToDP(30),
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  likeCardImageWrap: {
    borderRadius: 15,
    overflow: "hidden",
    width: widthPercentageToDP(23.3),
    height: widthPercentageToDP(28.5),
  },
  likeCardImage: {
    width: widthPercentageToDP(23.3),
    height: widthPercentageToDP(28.5),
  },
  likeCardBadge: {
    width: 35,
    height: 35,
    position: "absolute",
    bottom: 22,
    alignSelf: "center",
  },
  likeCardName: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    maxWidth: widthPercentageToDP(24),
    textAlign: "center",
  },
  itemView: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  itemImage: {
    width: 50,
    height: 50,
    marginRight: 5,
    borderRadius: 25,
  },
  itemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  unreadCount: {
    borderRadius: 20,
    backgroundColor: "red",
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
});

export default Chat;

const MESSAGES = [
  {
    id: 1,
    image: IMAGES.men,
    name: "Jessica Strike",
    last_message: "Thank you for your attention",
    unread: 2,
  },
  {
    id: 2,
    image: IMAGES.men,
    name: "Jeremy Zucker William",
    last_message: "Thank you bro for a order",
    unread: 2,
  },
  {
    id: 3,
    image: IMAGES.men,
    name: "Stephanie Angeline",
    last_message: "I am waiting for you sir",
    unread: 2,
  },
];
