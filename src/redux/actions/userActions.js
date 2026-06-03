import { createAsyncThunk } from "@reduxjs/toolkit";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";
import endPoints from "../../constants/endPoints";
import { getFcmRegistrationToken } from "../../push/fcmToken";
import apiRequest from "../../utils/apiRequest";
import {
  logMultipartTextParts,
  logOnboardingPayload,
  logOnboardingResponse,
} from "../../utils/onboardingApiDebug";
import {
  appendProfileFormFields,
  buildProfileMultipartParts,
  getFetchBlobHttpStatus,
  putProfileMultipart,
} from "../../utils/profileMultipartUpload";

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

function profileUploadUrl() {
  const base = String(endPoints.baseUrl || "").replace(/\/+$/, "");
  const path = String(endPoints.UpdateProfile || "");
  if (!path.startsWith("/")) return `${base}/${path}`;
  return `${base}${path}`;
}

/** Dev logs: last path segment only, no query tokens. */
function uploadAssetLabel(uri) {
  if (!uri) return null;
  try {
    const tail = decodeURIComponent(String(uri)).split("/").pop() || "?";
    return tail.length > 96 ? `${tail.slice(0, 96)}…` : tail;
  } catch {
    return "?";
  }
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
      deviceToken = await getFcmRegistrationToken();
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
      logOnboardingPayload("UpdateProfile PUT body (JSON)", params);
      let result = await apiRequest.put(endPoints.UpdateProfile, params);
      logOnboardingResponse("UpdateProfile PUT success", result.data, {
        httpStatus: result.status,
      });
      callback(result.data);
      /** Never force isFirstTime true from client — backend sets false when profile completes. */
      return result.data;
    } catch (error) {
      console.warn("updateProfile", error);
      let eRes = error?.response?.data;
      logOnboardingResponse("UpdateProfile PUT error", eRes || { message: error?.message }, {
        httpStatus: error?.response?.status,
      });
      const message =
        eRes?.message || error?.message || "Profile update failed";
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
      const failed = { success: false, message };
      if (typeof data.callback === "function") {
        data.callback(failed);
      }
      return failed;
    }
  }
);

const UpdateNotifications = createAsyncThunk(
  "user/updateNotifications",
  async (data, thunkAPI) => {
    try {
      let { callback, ...params } = data;
      let result = await apiRequest.put(endPoints.UpdateNotifications, params);
      callback(result.data);
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
      callback({ success: false });
    }
  }
);

async function runProfileMultipartUpload(data, fileOpts, thunkAPI) {
  const token = data?.token || thunkAPI.getState().user.token;
  const parts = await buildProfileMultipartParts(fileOpts);
  if (data?.formFields) {
    logOnboardingPayload("multipart PUT formFields (before append)", data.formFields);
    appendProfileFormFields(parts, data.formFields);
    logMultipartTextParts("multipart PUT parts", parts);
  }
  if (!parts.length) {
    const empty = { success: false, message: "Nothing to upload" };
    if (typeof data?.callback === "function") {
      data.callback(empty);
    }
    return empty;
  }
  const resp = await putProfileMultipart({
    url: profileUploadUrl(),
    token,
    parts,
    onProgress: data?.onProgress,
    timeoutMs: data?.timeoutMs || 300000,
  });
  const status = getFetchBlobHttpStatus(resp);
  const raw =
    typeof resp.text === "function" ? await resp.text() : resp.data;
  const parsed = parseUploadJsonBody(raw);
  if (status >= 400) {
    let message = parsed?.message || `Upload failed (HTTP ${status})`;
    if (status === 502 || status === 504) {
      message =
        "Server timed out (502). Large uploads can overload the server — wait a minute and check My Profile, or retry with fewer/smaller videos.";
    }
    const merged = {
      success: false,
      message,
      ...parsed,
    };
    logOnboardingResponse("multipart PUT error", merged, { httpStatus: status });
    if (typeof data?.callback === "function") {
      data.callback(merged);
    }
    Toast.show({
      type: "error",
      text1: "Upload failed",
      text2: merged.message,
    });
    return thunkAPI.rejectWithValue(merged);
  }
  logOnboardingResponse("multipart PUT success", parsed, { httpStatus: status });
  if (typeof data?.callback === "function") {
    data.callback(parsed);
  }
  return parsed;
}

const UploadVideo = createAsyncThunk(
  "user/uploadProfileVideo",
  async (data, thunkAPI) => {
    const uploadTag = "[uploadProfileVideo]";
    try {
      console.log(`${uploadTag} start`, {
        hasAvatar: Boolean(data.profileImage?.uri),
        hasVideo: Boolean(data.video?.uri),
        url: profileUploadUrl(),
      });
      return await runProfileMultipartUpload(
        data,
        {
          profileVideo: data?.video,
          profileImage: data?.profileImage,
        },
        thunkAPI,
      );
    } catch (error) {
      console.warn(`${uploadTag} error`, error?.message || error);
      const errRes = {
        success: false,
        message: error?.message || "Upload failed",
      };
      if (typeof data.callback === "function") {
        data.callback(errRes);
      }
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errRes.message,
      });
      return errRes;
    }
  },
);

const UploadProfileMedia = createAsyncThunk(
  "auth/UploadProfileMedia",
  async (data, thunkAPI) => {
    try {
      return await runProfileMultipartUpload(
        data,
        {
          galleryVideos: data?.video,
          previousVideos: data?.prevMedia,
        },
        thunkAPI,
      );
    } catch (error) {
      const errRes = {
        success: false,
        message: error?.message || "Upload failed",
      };
      if (typeof data.callback === "function") {
        data.callback(errRes);
      }
      Toast.show({
        type: "error",
        text1: "Error",
        text2: errRes.message,
      });
      return errRes;
    }
  },
);

/** Onboarding final step: all media + profile fields in one multipart PUT. */
const completeOnboardingUpload = createAsyncThunk(
  "user/completeOnboardingUpload",
  async (data, thunkAPI) => {
    const pending = data?.pending || {};
    return runProfileMultipartUpload(
      data,
      {
        profileVideo: pending.profileVideo,
        profileImage: pending.profileImage,
        galleryVideos: pending.galleryVideos || [],
      },
      thunkAPI,
    );
  },
);

/** Edit profile: new videos + optional profile video + JSON fields in one PUT. */
const saveProfileWithMedia = createAsyncThunk(
  "user/saveProfileWithMedia",
  async (data, thunkAPI) => {
    return runProfileMultipartUpload(
      data,
      {
        profileVideo: data?.profileVideo,
        profileImage: data?.profileImage,
        galleryVideos: data?.galleryVideos || [],
        previousVideos: data?.previousVideos,
      },
      thunkAPI,
    );
  },
);

/** POST receipt or (dev) productId — refreshes subscription on user after Apple verify. */
const VerifyIosSubscription = createAsyncThunk(
  "user/VerifyIosSubscription",
  async (payload, thunkAPI) => {
    try {
      const result = await apiRequest.post(endPoints.VerifyIosSubscription, {
        receiptData: payload?.receiptData,
        productId: payload?.productId,
      });
      return result.data;
    } catch (error) {
      const eRes = error?.response?.data;
      const msg =
        typeof eRes?.message === "string"
          ? eRes.message
          : eRes?.message?.message || eRes?.error || error.message;
      Toast.show({
        type: "error",
        text1: "Subscription",
        text2: msg,
      });
      return thunkAPI.rejectWithValue({ message: msg });
    }
  }
);

export default {
  SignIn,
  SignOut,
  GetMyProfile,
  VerifyOtp,
  UpdateProfile,
  UpdateNotifications,
  UploadVideo,
  UploadProfileMedia,
  completeOnboardingUpload,
  saveProfileWithMedia,
  VerifyIosSubscription,
};
