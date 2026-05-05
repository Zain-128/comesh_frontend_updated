import { createAsyncThunk } from "@reduxjs/toolkit";
import Toast from "react-native-toast-message";
import endPoints from "../../constants/endPoints";
import apiRequest from "../../utils/apiRequest";
import { compressImageForUpload, compressVideoForUpload } from "../../utils/compressMedia";

const DashboardListing = createAsyncThunk(
  "general/Dashboard",
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.post(
        endPoints.Dashboard + `?page=${data?.page}`,
        {
          ...data.params,
        }
      );
      data.callback(result.data);
      return result.data;
    } catch (error) {
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
        });
      }
    }
  }
);

const GetOthersProfile = createAsyncThunk(
  "general/GetOthersProfile",
  async (data, thunkAPI) => {
    try {
      if (!data?.userId) {
        return thunkAPI.rejectWithValue({ message: "Missing user id" });
      }
      let result = await apiRequest.get(endPoints.OthersProfile + data.userId);
      data.callback?.(result.data);
      return result.data;
    } catch (error) {
      const eRes = error?.response?.data;
      const msg = eRes?.message || error?.message || "Failed to load profile";
      return thunkAPI.rejectWithValue({
        message: msg,
        error: eRes?.error,
      });
    }
  }
);

const blockUser = createAsyncThunk("general/blockUser", async (data, thunkAPI) => {
  try {
    let result = await apiRequest.post(endPoints.Block, {
      userToBlock: data.userId,
      reason: data?.reason,
    });
    data.callback(result.data);
    return { userId: data.userId, ...result.data };
  } catch (error) {
    let eRes = error?.response?.data;
    if (eRes) {
      Toast.show({
        type: "error",
        text1: eRes.error,
        text2: eRes.message,
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
      });
    }
  }
});

const reportUser = createAsyncThunk("general/reportUser", async (data, thunkAPI) => {
  try {
    let result = await apiRequest.post(endPoints.Report, {
      reportOf: data?.userId,
      reason: data?.reason,
    });
    data.callback(result.data);
    return { userId: data.userId, ...result.data };
  } catch (error) {
    let eRes = error?.response?.data;
    if (eRes) {
      Toast.show({
        type: "error",
        text1: eRes.error,
        text2: eRes.message,
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
      });
    }
  }
});

const SuperLikeUser = createAsyncThunk(
  "general/SuperLikeUser",
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.post(endPoints.superLike, {
        userSuperLikedByMe: data.userId,
      });
      data.callback(result.data);
      return { userId: data.userId, ...result.data };
    } catch (error) {
      let eRes = error?.response?.data;
      const msg =
        typeof eRes?.message === "string"
          ? eRes.message
          : eRes?.message?.message || eRes?.error || error.message;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: "Super like",
          text2: msg,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
        });
      }
    }
  }
);

const likeUser = createAsyncThunk("general/likeUser", async (data, thunkAPI) => {
  try {
    let result = await apiRequest.post(endPoints.Like, {
      userLikedByMe: data.userId,
    });
    data.callback(result.data);
    return { userId: data.userId, ...result.data };
  } catch (error) {
    let eRes = error?.response?.data;
    const msg =
      typeof eRes?.message === "string"
        ? eRes.message
        : eRes?.message?.message || eRes?.error || error.message;
    if (eRes) {
      Toast.show({
        type: "error",
        text1: "Limit",
        text2: msg,
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
      });
    }
  }
});

const unLikeUser = createAsyncThunk("general/unLikeUser", async (data, thunkAPI) => {
  try {
    let result = await apiRequest.post(endPoints.Unlike, {
      userUnLikedByMe: data.userId,
    });
    data.callback(result.data);
    return { userId: data.userId, ...result.data };
  } catch (error) {
    let eRes = error?.response?.data;
    if (eRes) {
      Toast.show({
        type: "error",
        text1: eRes.error,
        text2: eRes.message,
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
      });
    }
  }
});

const getStaticContent = createAsyncThunk(
  "general/getStaticContent",
  async (data, thunkAPI) => {
    try {
      const type = typeof data === "string" ? data : data?.type;
      let result = await apiRequest.get(endPoints.StaticContent(type));
      return result.data;
    } catch (error) {
      console.warn(error);
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
        });
      }
    }
  }
);

const DeactivateAccount = createAsyncThunk(
  "general/DeactivateAccount",
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.post(endPoints.DeactiveAccount, data.params);
      Toast.show({
        text1: result.data.success ? "Success" : "Error",
        text2: result.data.success
          ? "User Deactivated successfully"
          : result.data.message,
        type: result.data.success ? "success" : "error",
      });
      data.callback();
      return result.data;
    } catch (error) {
      console.warn(error);
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
        });
      }
    }
  }
);

const GetChats = createAsyncThunk("general/GetChats", async (data, thunkAPI) => {
  try {
    let result = await apiRequest.get(
      endPoints.GetChats + "?page=1&order=desc&sort=updatedAt"
    );
    data.callback();
    return result.data;
  } catch (error) {
    console.warn(error.message);
    let eRes = error?.response?.data;
    if (eRes) {
      Toast.show({
        type: "error",
        text1: eRes.error,
        text2: eRes.message,
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.message,
      });
    }
  }
});

const GetMoreChats = createAsyncThunk(
  "general/GetMoreChats",
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.get(
        endPoints.GetChats + "?page=" + data.page
      );
      data.callback();
      return result.data;
    } catch (error) {
      console.warn(error);
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
        });
      }
    }
  }
);

const GetMessages = createAsyncThunk(
  "general/GetMessages",
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.get(
        endPoints.GetMessages +
          `?chat=${data.chat}&page=1&sort=createdAt&order=desc`
      );
      return result.data;
    } catch (error) {
      console.warn(error);
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
        });
      }
    } finally {
      data.callback?.();
    }
  }
);

const GetMoreMessages = createAsyncThunk(
  "general/GetMoreMessages",
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.get(
        endPoints.GetMessages +
          `?chat=${data.chat}&page=${data.page}&sort=createdAt&order=desc`
      );
      return result.data;
    } catch (error) {
      console.warn(error);
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
        });
      }
    } finally {
      data.callback?.();
    }
  }
);

const SendMessage = createAsyncThunk(
  "general/SendMessage",
  async (data, thunkAPI) => {
    try {
      const msgType = data.messageType || (data.media?.uri ? "BOTH" : "TEXT");
      const hasMedia = Boolean(data.media?.uri);
      const token = thunkAPI.getState()?.user?.token;
      const base = String(endPoints.baseUrl || "")
        .trim()
        .replace(/\/$/, "");
      const messagesPath = String(endPoints.GetMessages || "/messages").trim();
      const messagesUrl = messagesPath.startsWith("/")
        ? `${base}${messagesPath}`
        : `${base}/${messagesPath}`;

      /** Text-only: JSON POST — avoids Android Network Error with axios+multipart. */
      if (!hasMedia) {
        const textBody = {
          to: data.to,
          from: data.from,
          message: data.message ?? " ",
          chatId: data.chat,
          messageType: msgType,
          ...(data.replyToMessageId
            ? { replyToMessageId: String(data.replyToMessageId) }
            : {}),
        };
        let result = await apiRequest.post(
          endPoints.SendMessageText,
          textBody,
          { timeout: 30000 }
        );
        data.callback?.();
        thunkAPI.dispatch(GetChats({ callback: () => {} }));
        return result.data;
      }

      const formData = new FormData();
      formData.append("to", data.to);
      formData.append("from", data.from);
      formData.append("message", data.message ?? " ");
      formData.append("chatId", data.chat);
      formData.append("messageType", msgType);
      if (data.replyToMessageId) {
        formData.append("replyToMessageId", String(data.replyToMessageId));
      }
      const originalUri = data.media.uri;
      const mime = data.media.type || "image/jpeg";
      const uri = mime.startsWith("video")
        ? await compressVideoForUpload(originalUri)
        : await compressImageForUpload(originalUri);
      let baseName =
        data.media.fileName ||
        data.media.name ||
        (typeof originalUri === "string" && originalUri.includes("/")
          ? decodeURIComponent(originalUri.split("/").pop() || "").split("?")[0]
          : "") ||
        (mime.startsWith("video") ? "upload.mp4" : "upload.jpg");
      if (!/\.[a-z0-9]{2,4}$/i.test(baseName)) {
        baseName += mime.startsWith("video") ? ".mp4" : ".jpg";
      }
      formData.append("mediaFile", {
        uri,
        type: mime,
        name: baseName,
      });

      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(String(base).includes("ngrok")
          ? { "ngrok-skip-browser-warning": "true" }
          : {}),
      };

      const res = await fetch(messagesUrl, {
        method: "POST",
        headers,
        body: formData,
      });
      const raw = await res.text();
      let json;
      try {
        json = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error(raw || `HTTP ${res.status}`);
      }
      if (!res.ok) {
        Toast.show({
          type: "error",
          text1: json?.error || "Error",
          text2: json?.message || res.statusText || "Upload failed",
        });
        throw new Error(json?.message || "Upload failed");
      }
      data.callback?.();
      thunkAPI.dispatch(GetChats({ callback: () => {} }));
      return json;
    } catch (error) {
      console.warn(error);
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
        });
      }
    }
  }
);

const getNotifications = createAsyncThunk(
  "general/getNotifications",
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.get(endPoints.GetNotifications);
      data.callback();
      return result.data;
    } catch (error) {
      console.warn(error);
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
        });
      }
    }
  }
);

const GetSingleChat = createAsyncThunk(
  "general/GetSingleChat",
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.get(
        `${endPoints.GetSingleChat}?chatId=${data.chat}`
      );
      data.callback?.(result.data);
      return result.data;
    } catch (error) {
      console.warn(error);
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
        });
      }
    }
  }
);

const UpdateChatSession = createAsyncThunk(
  "general/UpdateChatSession",
  async (data, thunkAPI) => {
    try {
      let { callback, ...rest } = data;
      let result = await apiRequest.patch(endPoints.UpdateChatSession, {
        ...rest,
      });
      callback?.(result.data);
      return result.data;
    } catch (error) {
      console.warn(error);
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
        });
      }
    }
  }
);

const ReadMessages = createAsyncThunk(
  "general/ReadMessages",
  async (data, thunkAPI) => {
    try {
      let { callback, ...rest } = data;
      let result = await apiRequest.patch(endPoints.GetChats, {
        ...rest,
      });
      callback?.(result.data);
      thunkAPI.dispatch(GetChats({ callback: () => {} }));
      return result.data;
    } catch (error) {
      console.warn(error);
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
        });
      }
    }
  }
);

const getLikesUsers = createAsyncThunk(
  "general/getLikesUsers",
  async (data, thunkAPI) => {
    try {
      let { callback } = data;
      let result = await apiRequest.get(endPoints.GetAllLikesUsers);
      callback?.(result.data);
      return result.data;
    } catch (error) {
      console.warn(error);
      let eRes = error?.response?.data;
      const msg =
        typeof eRes?.message === "string"
          ? eRes.message
          : eRes?.message?.message || eRes?.error || error.message;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: "Likes",
          text2: msg,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
        });
      }
      callback?.({ success: false, data: null });
    }
  }
);

const RateSendFeedback = createAsyncThunk(
  "general/RateSendFeedback",
  async (data, thunkAPI) => {
    try {
      let { callback, ...rest } = data;
      let result = await apiRequest.post(endPoints.RatingAndFeedback, {
        ...rest,
      });
      callback?.(result.data);
      return result.data;
    } catch (error) {
      let eRes = error?.response?.data;
      if (eRes) {
        Toast.show({
          type: "error",
          text1: eRes.error,
          text2: eRes.message,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: error.message,
        });
      }
    }
  }
);

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
  RateSendFeedback,
};
