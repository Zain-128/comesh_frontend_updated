import moment from "moment";
import QB from "quickblox-react-native-sdk";
import React, { createRef, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  LogBox,
  NativeEventEmitter,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";
import { Typography } from "../../../components/Typography";
import { AppContainer } from "../../../components/layouts/AppContainer";
import colors from "../../../constants/colors";
import { fontsFamily } from "../../../constants/fonts";
import { IMAGES } from "../../../constants/images";
import Actions from "../../../redux/actions/globalActions";
import { AppendNewMessage } from "../../../redux/globalSlice";

LogBox.ignoreLogs(["new NativeEventEmitter()"])

let Revent = null;
let Tevent = null;
let TSevent = null;
let typingTimeout = null;

const Messages = (props) => {
  const [value, setValue] = useState("");
  const msgListRef = createRef();

  const [loading, setLoading] = useState(true);
  const [dialogID, setDialogID] = useState(null);
  const [typing, setTypingStatus] = useState(false);
  const dispatch = useDispatch();
  const { messages } = useSelector(state => state.globalState);
  const { userData } = useSelector(state => state.user);
  const params = props.route.params;
  const emitter = new NativeEventEmitter(QB.chat);

  function receivedNewMessage(event) {
    const { type, payload } = event;

    const IsItMe = payload?.senderId == userData.quickBloxId;
    const from = IsItMe ? userData?._id : params?.item?.usersData[0]._id;
    const to = !IsItMe ? userData?._id : params?.item?.usersData[0]._id;

    const newMsg = {
      _id: null,
      chatId: params?.item?._id,
      from,
      to,
      message: payload?.body,
      messageType: "TEXT",
      createdAt: moment(payload.dateSent).toISOString(),
      updatedAt: moment(payload.dateSent).toISOString()
    }

    dispatch(AppendNewMessage(newMsg))
  }

  // function messageStatusHandler(event) {
  //   console.warn("MESSAGE STATUS", event)
  //   // handle message status change
  // }

  // function systemMessageHandler(event) {
  //   // handle system message
  // }

  function userTypingHandler(event) {
    console.warn("Typing Status", event);
    // handle user typing / stopped typing event
    if (event.payload.userId == params?.item?.usersData[0].quickBloxId) {
      if (event.type = "@QB/USER_IS_TYPING")
        setTypingStatus(true)
      if (event.type == "@QB/USER_STOPPED_TYPING") {
        setTypingStatus(false)
      }
      if (typingTimeout) {
        clearTimeout(typingTimeout)
        typingTimeout = null
      }

      typingTimeout = setTimeout(() => {
        setTypingStatus(false)
      }, 1500)
    }
  }

  useEffect(() => {

    checkCurrentSession();

    return () => {
      if (Revent)
        Revent.remove();
      if (Tevent)
        Tevent.remove();
      if (TSevent)
        TSevent.remove();
    }

  }, [])

  const checkCurrentSession = () => {
    dispatch(Actions.GetSingleChat({
      chat: params?.item?._id,
      callback: (data) => {
        if (!data.success) {
          Toast.show({
            text1: "Error",
            type: "error",
            text2: data.message
          })
          return;
        }
        console.warn("SESSION JOINING", data.data)
        if (data.data.isChatSession) {
          getMessages(data.data.chatSessionId);
          setDialogID(data.data.chatSessionId);

          Revent = emitter.addListener(QB.chat.EVENT_TYPE.RECEIVED_NEW_MESSAGE, receivedNewMessage);

          Tevent = emitter.addListener(QB.chat.EVENT_TYPE.USER_IS_TYPING, userTypingHandler);

          TSevent = emitter.addListener(QB.chat.EVENT_TYPE.USER_STOPPED_TYPING, userTypingHandler);

          // }).catch((e) => {
          //   console.warn("ERROR joinning dialog", e)
          // })
        }
        else {
          updateCurrentSession();
        }
      }
    }))
  }

  const updateCurrentSession = () => {
    const createDialogParam = {
      type: QB.chat.DIALOG_TYPE.CHAT,
      occupantsIds: [
        //"139459918",
        userData.quickBloxId,
        params?.item?.usersData[0].quickBloxId]
    };
    QB.chat
      .createDialog(createDialogParam)
      .then(function (dialog) {
        dispatch(Actions.UpdateChatSession({
          chatId: params?.item?._id,
          isChatSession: true,
          chatSessionId: dialog.id,
          callback: (data) => {
            console.warn("SESSION UPDATED", data)
          }
        }))
        getMessages(dialog.id);
        setDialogID(dialog.id);
        console.warn("Dialog Created", dialog.id, dialog.occupantsIds)
        // handle as neccessary, i.e.
        // subscribe to chat events, typing events, etc.

        // emitter.addListener(QB.chat.EVENT_TYPE.MESSAGE_DELIVERED, messageStatusHandler);
        // emitter.addListener(QB.chat.EVENT_TYPE.MESSAGE_READ, messageStatusHandler);
        // emitter.addListener(QB.chat.EVENT_TYPE.RECEIVED_SYSTEM_MESSAGE, systemMessageHandler);

        Revent = emitter.addListener(QB.chat.EVENT_TYPE.RECEIVED_NEW_MESSAGE, receivedNewMessage);

        Tevent = emitter.addListener(QB.chat.EVENT_TYPE.USER_IS_TYPING, userTypingHandler);

        TSevent = emitter.addListener(QB.chat.EVENT_TYPE.USER_STOPPED_TYPING, userTypingHandler);
      })
      .catch(function (e) {
        setLoading(false)
        console.warn("Error while creating dialog", e)
        // handle error
      });

  }

  const getMessages = (sessionId) => {
    try {
      QB.chat.getDialogMessages({
        dialogId: sessionId,
      })
    } catch (error) {

    }
    dispatch(Actions.GetMessages({
      chat: params?.item?._id,
      callback: () => {
        if (userData._id == params?.item?.unReadMessage?.userId)
          dispatch(Actions.ReadMessages({
            chatId: params?.item?._id,
            callback: () => {

            }
          }))
        setLoading(false);
      }
    }));
  }

  const _onEndReached = () => {
    if (messages?.pagination?.hasNext) {
      setLoading(true)
      dispatch(Actions.GetMoreMessages({
        page: messages?.pagintaion?.current + 1,
        chat: params.item._id,
        callback: () => {
          setLoading(false)
        }
      }));
    }
  }

  const onSend = () => {
    if (!value.length) return;
    QB.chat.sendMessage({
      dialogId: dialogID,
      body: value,
      // properties: {
      //   _id: null,
      //   chatId: params?.item?._id,
      //   from: userData?._id,
      //   message: value,
      //   messageType: "TEXT",
      //   to: params?.item?.usersData[0]._id,
      //   createdAt: new Date().toISOString(),
      //   updatedAt: new Date().toISOString()
      // },
    }).then((v) => {
      console.warn("QB sent", v)
    }).catch((e) => {
      console.warn("Message not sent", e)
    })
    dispatch(Actions.SendMessage({
      to: params?.item?.usersData[0]._id,
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
              QB.chat.sendIsTyping({ dialogId: dialogID })
                .then((v) => console.warn("Success sending typing event"))
                .catch((e) => console.warn("Error sending typing event", e))

              // if (typingTimeout) {
              //   clearTimeout(typingTimeout)
              //   typingTimeout = null
              // }

              // typingTimeout = setTimeout(() => {
              //   QB.chat.sendStoppedTyping({ dialogId: dialogID })
              //     .then((v) => console.warn("Success sending typing stop event"))
              // }, 3000)



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
