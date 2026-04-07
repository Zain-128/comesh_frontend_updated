import { createAsyncThunk } from "@reduxjs/toolkit";
import messaging from "@react-native-firebase/messaging";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";
import RNFetchBlob from "react-native-blob-util";
import endPoints from "../../constants/endPoints";
import apiRequest from "../../utils/apiRequest";
import { compressImageForUpload, compressVideoForUpload } from "../../utils/compressMedia";

/** RNFetchBlob returns body as string; proxies/nginx may return HTML on 413/502 — JSON.parse throws on `<`. */
function parseUploadJsonBody(raw) {
  if (raw == null || raw === "") {
    return { success: false, message: "Empty response from server" };
  }
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    return raw;
  }
  const s = String(raw).trim();
  if (s.startsWith("<")) {
    return {
      success: false,
      message:
        "Server did not return JSON (often file too large, timeout, or gateway error). Try a shorter/smaller video.",
    };
  }
  try {
    return JSON.parse(s);
  } catch {
    return {
      success: false,
      message: s.length > 180 ? `${s.slice(0, 180)}…` : s || "Invalid response",
    };
  }
}

function getFetchBlobHttpStatus(resp) {
  try {
    const i = typeof resp.info === "function" ? resp.info() : resp.respInfo;
    const n = Number(i?.status ?? i?.statusCode ?? 0);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

function profileUploadUrl() {
  const base = String(endPoints.baseUrl || "").replace(/\/+$/, "");
  const path = String(endPoints.UpdateProfile || "");
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}

/** GET `/users/by-id/:id` — fresh profile for My Profile screen. */
const GetMyProfile = createAsyncThunk(
  "user/GetMyProfile",
  async (userId, thunkAPI) => {
    if (!userId) {
      return thunkAPI.rejectWithValue({ message: "Missing user id" });
    }
    try {
      const result = await apiRequest.get(endPoints.UserById(userId));
      return result.data;
    } catch (error) {
      const eRes = error?.response?.data;
      Toast.show({
        type: "error",
        text1: eRes?.error || "Error",
        text2: eRes?.message || error.message,
      });
      return thunkAPI.rejectWithValue({
        message: eRes?.message || error.message,
      });
    }
  }
);

const SignIn = createAsyncThunk("auth/Login", async (data, thunkAPI) => {
  try {
    let result = await apiRequest.post(endPoints.Login, {
      phoneNo: data.phone,
      pushNotification: true,
      deviceToken: data?.token,
    });
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
});

const SignOut = createAsyncThunk("auth/Logout", async (data, thunkAPI) => {
  try {
    let result = await apiRequest.post(endPoints.Logout);
    data.callback();
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
});

const VerifyOtp = createAsyncThunk("auth/verifyOtp", async (data, thunkAPI) => {
  try {
    let deviceToken;
    try {
      deviceToken = await messaging().getToken();
    } catch {
      deviceToken = undefined;
    }
    let result = await apiRequest.put(endPoints.VerfiyOTP, {
      phoneNo: data.phone,
      otp: data.otp,
      ...(deviceToken ? { deviceToken } : {}),
    });
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
});

const UpdateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (data, thunkAPI) => {
    try {
      let { callback, ...rest } = data;
      let params = {
        ...rest,
      };
      let result = await apiRequest.put(endPoints.UpdateProfile, params, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      callback(result.data);
      return data.isFirstTime
        ? { ...result.data, isFirstTime: data.isFirstTime }
        : result.data;
    } catch (error) {
      console.warn("rerere", error);
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

const UploadVideo = createAsyncThunk(
  "auth/updateProfile",
  async (data, thunkAPI) => {
    try {
      const compressedUri = await compressVideoForUpload(data.video.uri);
      const uri = compressedUri || data.video.uri;
      const baseName =
        (uri && String(uri).split("/").pop()) || data.video.name || "profile.mp4";
      const filename = baseName.toLowerCase().endsWith(".mp4")
        ? baseName
        : `${baseName}.mp4`;

      const wrapLocalFile = (fileUri) =>
        RNFetchBlob.wrap(decodeURIComponent(String(fileUri)).replace("file://", ""));

      const parts = [];

      if (data.profileImage?.uri) {
        const imgCompressed = await compressImageForUpload(data.profileImage.uri);
        const imgUri = imgCompressed || data.profileImage.uri;
        const rawName =
          (imgUri && String(imgUri).split("/").pop()) ||
          data.profileImage.name ||
          data.profileImage.fileName ||
          "avatar.jpg";
        const imgFilename = /\.(jpe?g|png|gif|webp)$/i.test(rawName)
          ? rawName
          : `${rawName.replace(/\.[^/.]+$/, "") || "avatar"}.jpg`;
        parts.push({
          name: "profileImage",
          filename: imgFilename,
          type: data.profileImage.type || "image/jpeg",
          data: wrapLocalFile(imgUri),
        });
      }

      parts.push({
        name: "profileVideo",
        filename,
        type: data.video.type || "video/mp4",
        data: wrapLocalFile(uri),
      });

      let resp = await RNFetchBlob.fetch(
        "PUT",
        profileUploadUrl(),
        {
          Authorization: `Bearer ${thunkAPI.getState().user.token}`,
          "Content-Type": "multipart/form-data",
        },
        parts
      ).uploadProgress((sent, total) => {
        data.onProgress({ sent, total });
      });
      const status = getFetchBlobHttpStatus(resp);
      const parsed = parseUploadJsonBody(resp.data);
      if (status >= 400) {
        const merged = {
          success: false,
          message: parsed?.message || `Upload failed (HTTP ${status})`,
          ...parsed,
        };
        data.callback(merged);
        Toast.show({
          type: "error",
          text1: "Upload failed",
          text2: merged.message,
        });
        return {};
      }
      data.callback(parsed);
      if (data?.redirect) return parsed;
      return {};
    } catch (error) {
      console.warn("rerere", error);
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

const UploadProfileMedia = createAsyncThunk(
  "auth/UploadProfileMedia",
  async (data, thunkAPI) => {
    const compressedList = await Promise.all(
      (data?.video || []).map(async (vid) => {
        const outUri = await compressVideoForUpload(vid.uri);
        return { ...vid, uri: outUri || vid.uri };
      })
    );

    let params = [
      ...compressedList.map((vid) => {
        const uri = vid.uri;
        const baseName =
          (uri && String(uri).split("/").pop()) ||
          vid.name ||
          vid.fileName ||
          "clip.mp4";
        const filename = baseName.toLowerCase().endsWith(".mp4")
          ? baseName
          : `${baseName}.mp4`;
        return {
          name: "videos",
          filename,
          type: vid.type || "video/mp4",
          data:
            Platform.OS === "android"
              ? RNFetchBlob.wrap(
                  decodeURIComponent(uri).replace("file://", "")
                )
              : RNFetchBlob.wrap(decodeURIComponent(uri).replace("file://", "")),
        };
      }),
    ];
    if (data?.prevMedia && data?.prevMedia?.length) {
      params.push({
        name: "previousVideos",
        data: JSON.stringify(data?.prevMedia),
      });
    }
    try {
      return await RNFetchBlob.fetch(
        "PUT",
        profileUploadUrl(),
        {
          Authorization: `Bearer ${thunkAPI.getState().user.token}`,
          "Content-Type": "multipart/form-data",
        },
        params
      )
        .uploadProgress((sent, total) => {
          data.onProgress({ sent, total });
        })
        .then((resp) => {
          const status = getFetchBlobHttpStatus(resp);
          const parsed = parseUploadJsonBody(resp.data);
          if (status >= 400) {
            const merged = {
              success: false,
              message: parsed?.message || `Upload failed (HTTP ${status})`,
              ...parsed,
            };
            data.callback(merged);
            Toast.show({
              type: "error",
              text1: "Upload failed",
              text2: merged.message,
            });
            return merged;
          }
          data.callback(parsed);
          return parsed;
        })
        .catch((reason) => {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: reason,
          });
        });
    } catch (error) {
      console.warn("rerere", error);
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
  SignIn,
  SignOut,
  GetMyProfile,
  VerifyOtp,
  UpdateProfile,
  UploadVideo,
  UploadProfileMedia,
};
