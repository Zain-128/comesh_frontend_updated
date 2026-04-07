import { BlurView } from "@react-native-community/blur";
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
import Header from "./Header";

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


  const [loading, setLoading] = useState(true);
  const [loadingLikes, setLoadingLikes] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likeUsers, setLikeUsers] = useState([]);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { chats } = useSelector(state => state.globalState);
  const { token, userData } = useSelector(state => state.user);

  useFocusEffect(React.useCallback(() => {
    dispatch(Actions.GetChats({
      callback: () => {
        setLoading(false);
      }
    }));
  }, []))

  useEffect(() => {
    // const createUserParams = {
    //   fullName: "jacksparrow",
    //   login: 'jack',
    //   password: "jackpassword"
    // };
    // id:"139459918"

    chatSocket.connect({
      token,
      userId: userData?._id,
    });

    const offChatUpdated = chatSocket.on("chat-updated", () => {
      dispatch(Actions.GetChats({
        callback: () => { },
      }));
    });

    dispatch(Actions.getLikesUsers({
      callback: (data) => {
        console.warn(data)
        setLoadingLikes(false)
        if (data.success)
          setLikeUsers(data.data?.likedBySomeone)
      }
    }))

    dispatch(Actions.GetChats({
      callback: () => {
        setLoading(false);
      }
    }));

    return () => {
      offChatUpdated?.();
    };
  }, [token, userData?._id])


  const _onEndReached = () => {
    if (chats?.pagination?.hasNext) {
      setLoading(true)
      dispatch(Actions.GetMoreChats({
        page: chats?.pagination?.current + 1,
        callback: () => {
          setLoading(false)
        }
      }));
    }
  }



  return (
    <AppContainer>
      <Header {...props} />
      <View style={{ gap: 20, flex: 1 }}>
        <View style={{}}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 10 }}>
            <Text style={{ fontWeight: "500", fontSize: 20, }}>
              Likes
            </Text>
            {
              likeUsers?.length > 0 &&
              <View style={{ backgroundColor: "red", width: 25, height: 25, borderRadius: 100, gap: 10, justifyContent: "center", alignItems: 'center', }}>
                <Text style={{ color: "#fff" }}>
                  {likeUsers?.length}
                </Text>
              </View>
            }
          </View>
          <FlatList
            onRefresh={() => {
              dispatch(Actions.getLikesUsers({
                callback: (data) => {
                  if (data.success)
                    setLikeUsers(data.data?.likedBySomeone)
                }
              }))
            }}
            refreshing={false}
            horizontal
            data={likeUsers}
            style={{ marginHorizontal: 10, marginTop: 10 }}
            contentContainerStyle={{ gap: 10 }}
            renderItem={({ item }) => {
              return (
                <TouchableOpacity onPress={() => props.navigation.navigate('UserProfile', { userID: item?._id })} style={{ width: widthPercentageToDP(25), height: widthPercentageToDP(30), marginBottom: 12 }}>
                  <ImageBackground style={{ flex: 1, overflow: "hidden", alignItems: 'center', justifyContent: "center" }} resizeMode="stretch" source={require("../../../assets/images/likeBorder.png")}>
                    <View style={{ borderRadius: 15, overflow: 'hidden', width: widthPercentageToDP(23.3), height: widthPercentageToDP(28.5) }}>
                      <Image
                        source={
                          helper.getMediaSource(
                            item?.profileVideoThumbnail || item?.profileImage || item?.profileVideo
                          ) || IMAGES.men
                        }
                        resizeMode="cover"
                        style={{ width: widthPercentageToDP(23.3), height: widthPercentageToDP(28.5) }}
                      />
                      <BlurView
                        style={{ ...StyleSheet.absoluteFill }}
                        blurType="light"
                        blurAmount={20}
                        blurRadius={20}
                        reducedTransparencyFallbackColor="black"
                      />
                    </View>
                  </ImageBackground>
                  <Image style={{ width: 35, height: 35, position: "absolute", bottom: -12, alignSelf: 'center', }} resizeMode="contain" source={require("../../../assets/images/likebtn.png")} />
                </TouchableOpacity>
              )
            }
            }
            ListFooterComponent={
              loadingLikes &&
              <View style={{ justifyContent: "center", alignItems: 'center', padding: 10 }}>
                <ActivityIndicator size={"large"} color={colors.primary} />
              </View>
            }
          />
        </View>
        <View style={{ gap: 10, flex: 1 }}>
          <Text style={{ fontWeight: "500", fontSize: 20, paddingHorizontal: 20 }}>
            All Messages
          </Text>
          <FlatList
            style={{ flex: 1 }}
            onRefresh={() => {
              setRefreshing(true)
              dispatch(Actions.GetChats({
                callback: () => {
                  setRefreshing(false);
                }
              }));
            }}
            refreshing={refreshing}
            data={chats?.data}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            renderItem={(i) => <ListItem {...i} {...props} userData={userData} />}
            onEndReached={_onEndReached}
            onEndReachedThreshold={0.1}
            ListFooterComponent={
              loading &&
              <View style={{ justifyContent: "center", alignItems: 'center', padding: 10 }}>
                <ActivityIndicator size={"large"} color={colors.primary} />
              </View>
            }
          />
        </View>
      </View>
    </AppContainer>
  );
};

const ListItem = ({ item, index, navigation, userData }) => {
  const unread = unreadCountForUser(item, userData?._id);
  const listTime =
    item?.latestMessageTime ||
    item?.updatedAt ||
    item?.createdAt;
  const peer = item?.usersData?.[0];
  const avatarSource =
    helper.getMediaSourceOrUri(peer?.profileImage || peer?.profileVideoThumbnail) ?? IMAGES.men;
  return (
    <TouchableOpacity style={styles.itemView} onPress={() => navigation.navigate('Messages', { item })}>
      <Image source={avatarSource} style={styles.itemImage} />
      <View style={styles.itemContent}>
        <View style={{ flex: 1 }}>
          <Typography children={item.usersData.length > 0 ? item.usersData[0].firstName + " " + item.usersData[0].lastName : "No name available"} size={15} />
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
