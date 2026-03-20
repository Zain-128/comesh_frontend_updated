import Toast from "react-native-toast-message";
import endPoints from "../../constants/endPoints";
import apiRequest from "../../utils/apiRequest";

const { createAsyncThunk } = require("@reduxjs/toolkit")
const { default: axios, AxiosError, Axios } = require("axios")

const DashboardListing = createAsyncThunk(
  'general/Dashboard',
  async (data, thunkAPI) => {
    try {
      console.warn(data.params)
      let result = await apiRequest.post(endPoints.Dashboard + `?page=${data?.page}`, {
        ...data.params
      });
      data.callback(result.data);
      return result.data;
    } catch (error) {
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)
const GetOthersProfile = createAsyncThunk(
  'general/GetOthersProfile',
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.get(endPoints.OthersProfile + data.userId);
      data.callback(result.data);
      return result.data;
    } catch (error) {
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)

const blockUser = createAsyncThunk(
  'general/blockUser',
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.post(endPoints.Block, {
        userToBlock: data.userId,
        reason: data?.reason
      });
      data.callback(result.data);
      return { userId: data.userId, ...result.data };
    } catch (error) {
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)

const reportUser = createAsyncThunk(
  'general/reportUser',
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.post(endPoints.Report, {
        reportOf: data?.userId,
        reason: data?.reason
      });
      data.callback(result.data);
      return { userId: data.userId, ...result.data };
    } catch (error) {
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)

const SuperLikeUser = createAsyncThunk(
  'general/SuperLikeUser',
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.post(endPoints.superLike, {
        userSuperLikedByMe: data.userId
      });
      data.callback(result.data);
      return { userId: data.userId, ...result.data };
    } catch (error) {
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)
const likeUser = createAsyncThunk(
  'general/likeUser',
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.post(endPoints.Like, {
        userLikedByMe: data.userId
      });
      data.callback(result.data);
      return { userId: data.userId, ...result.data };
    } catch (error) {
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)

const unLikeUser = createAsyncThunk(
  'general/unLikeUser',
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.post(endPoints.Unlike, {
        userUnLikedByMe: data.userId
      });
      data.callback(result.data);
      return { userId: data.userId, ...result.data };
    } catch (error) {
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)

const getStaticContent = createAsyncThunk(
  'general/getStaticContent',
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.get(endPoints.StaticContent(data.type));
      return result.data;
    } catch (error) {
      console.warn(error)
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)

const DeactivateAccount = createAsyncThunk(
  'general/DeactivateAccount',
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.post(endPoints.DeactiveAccount, data.params);
      Toast.show({
        text1: result.data.success ? "Success" : "Error",
        text2: result.data.success ? "User Deactivated successfully" : result.data.message,
        type: result.data.success ? "success" : "error"
      })
      data.callback()
      return result.data;
    } catch (error) {
      console.warn(error)
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)

const GetChats = createAsyncThunk(
  'general/GetChats',
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.get(endPoints.GetChats + "?page=1&order=desc&sort=updatedAt");
      data.callback()
      return result.data;
    } catch (error) {
      console.warn(error.message)
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)
const GetMoreChats = createAsyncThunk(
  'general/GetMoreChats',
  async (data, thunkAPI) => {
    try {
      console.warn(endPoints.GetChats + "?page=" + data.page)
      let result = await apiRequest.get(endPoints.GetChats + "?page=" + data.page);
      data.callback()
      return result.data;
    } catch (error) {
      console.warn(error)
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)

const GetMessages = createAsyncThunk(
  'general/GetMessages',
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.get(endPoints.GetMessages + `?chat=${data.chat}&page=1&sort=createdAt&order=desc`);
      data.callback()
      return result.data;
    } catch (error) {
      console.warn(error)
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)
const GetMoreMessages = createAsyncThunk(
  'general/GetMoreMessages',
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.get(endPoints.GetMessages + `?chat=${data.chat}&page=${data.page}&sort=createdAt&order=desc`);
      data.callback()
      return result.data;
    } catch (error) {
      console.warn(error)
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)
const SendMessage = createAsyncThunk(
  'general/SendMessage',
  async (data, thunkAPI) => {
    try {
      let formData = new FormData();
      formData.append("to", data.to)
      formData.append("from", data.from)
      formData.append("message", data.message)
      formData.append("mediaFile", data.media)
      formData.append("messageType", "BOTH")
      formData.append("chatId", data.chat)
      let result = await apiRequest.post(endPoints.GetMessages, formData);
      data.callback()
      return result.data;
    } catch (error) {
      console.warn(error)
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)

const getNotifications = createAsyncThunk(
  'general/getNotifications',
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.get(endPoints.GetNotifications);
      data.callback()
      return result.data;
    } catch (error) {
      console.warn(error)
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)
const GetSingleChat = createAsyncThunk(
  'general/GetSingleChat',
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.get(`${endPoints.GetSingleChat}?chatId=${data.chat}`);
      data.callback(result.data);
      return result.data;
    } catch (error) {
      console.warn(error)
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)
const UpdateChatSession = createAsyncThunk(
  'general/UpdateChatSession',
  async (data, thunkAPI) => {
    try {
      let { callback, ...rest } = data;
      let result = await apiRequest.patch(endPoints.UpdateChatSession, {
        ...rest
      });
      callback(result.data)
      return result.data;
    } catch (error) {
      console.warn(error)
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)

const ReadMessages = createAsyncThunk(
  'general/ReadMessages',
  async (data, thunkAPI) => {
    try {
      let { callback, ...rest } = data;
      let result = await apiRequest.patch(endPoints.GetChats, {
        ...rest
      });
      callback(result.data)
      return result.data;
    } catch (error) {
      console.warn(error)
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)

const getLikesUsers = createAsyncThunk(
  'general/getLikesUsers',
  async (data, thunkAPI) => {
    try {
      let { callback, ...rest } = data;
      let result = await apiRequest.get(endPoints.GetAllLikesUsers);
      callback(result.data)
      return result.data;
    } catch (error) {
      console.warn(error)
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)

const RateSendFeedback = createAsyncThunk(
  'general/RateSendFeedback',
  async (data, thunkAPI) => {
    try {
      let { callback, ...rest } = data;
      let result = await apiRequest.post(endPoints.RatingAndFeedback, {
        ...rest
      });
      callback(result.data)
      return result.data;
    } catch (error) {
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message
        })
      }
      else
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message
        })
    }
  },
)

export default {
  DashboardListing,
  GetOthersProfile,
  blockUser,
  reportUser,
  likeUser,
  unLikeUser,
  getStaticContent,
  DeactivateAccount,
  GetChats,
  GetMoreChats,
  GetMessages,
  GetMoreMessages,
  SendMessage,
  getNotifications,
  GetSingleChat,
  UpdateChatSession,
  ReadMessages,
  getLikesUsers,
  SuperLikeUser,
  RateSendFeedback
}