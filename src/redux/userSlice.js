import { createSlice } from "@reduxjs/toolkit";
import Toast from "react-native-toast-message";
import userActions from "./actions/userActions";
import globalActions from "./actions/globalActions";

const userSlice = createSlice({
  name: "user",
  initialState: {
    isLogin: false,
    isFirstTime: true,
    userData: {},
    userRegister: {},
    token: "",
    /** Latest FCM token after splash permission + registration (also stored on server when logged in). */
    fcmDeviceToken: "",
    /** Local picks during onboarding — one upload on final step. */
    pendingOnboardingMedia: null,
    /** False until Gesture Guide + Subscription finish after Create Account. */
    postSignupFlowComplete: false,
  },
  reducers: {
    setFcmDeviceToken(state, action) {
      state.fcmDeviceToken =
        typeof action.payload === "string" ? action.payload : "";
    },
    setFirstTime(state, action) {
      state.isFirstTime = action.payload;
    },
    setPostSignupFlowComplete(state, action) {
      state.postSignupFlowComplete = Boolean(action.payload);
    },
    setUser(state, action) {
      state.userRegister = {
        ...state.userRegister,
        ...action.payload,
      };
    },
    updateUserLikes(state, action) {
      const likedByMe = state?.userData?.likedByMe || [];
      const unLikedByMe = state?.userData?.unLikedByMe || [];
      if (action.payload.type === "like") {
        let arr = unLikedByMe.filter((i) => i !== action.payload.userId);
        state.userData = {
          ...state.userData,
          likedByMe: [...new Set([...likedByMe, action.payload.userId])],
          unLikedByMe: arr,
        };
      } else {
        let arr = likedByMe.filter((i) => i !== action.payload.userId);
        state.userData = {
          ...state.userData,
          unLikedByMe: [...new Set([...unLikedByMe, action.payload.userId])],
          likedByMe: arr,
        };
      }
    },
    logoutUser(state, action) {
      state.isFirstTime = true;
      state.postSignupFlowComplete = false;
      state.isLogin = false;
      state.userData = null;
      state.userRegister = null;
      state.token = "";
      state.fcmDeviceToken = "";
    },
    resetVerfiy(state, action) {
      state.userData = null;
      state.isLogin = false;
      state.isFirstTime = true;
      state.postSignupFlowComplete = false;
      state.token = "";
      state.fcmDeviceToken = "";
      state.pendingOnboardingMedia = null;
    },
    setPendingOnboardingMedia(state, action) {
      state.pendingOnboardingMedia = {
        ...(state.pendingOnboardingMedia || {}),
        ...action.payload,
      };
    },
    clearPendingOnboardingMedia(state) {
      state.pendingOnboardingMedia = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(userActions.SignIn.fulfilled, (state, action) => {
      if (action.payload) {
        if (action.payload.success) {
          // reserved
        }
      }
    });
    builder.addCase(userActions.SignIn.rejected, (state, action) => {
      Toast.show({
        text1: "Error",
        type: "error",
        text2: action.payload?.message,
      });
    });
    builder.addCase(userActions.SignOut.fulfilled, (state, action) => {
      if (action.payload) {
        if (action.payload.success) {
          // reserved
        }
      }
    });
    builder.addCase(userActions.SignOut.rejected, (state, action) => {
      Toast.show({
        text1: "Error",
        type: "error",
        text2: action.payload?.message,
      });
    });
    builder.addCase(userActions.GetMyProfile.fulfilled, (state, action) => {
      if (action.payload?.success && action.payload?.data) {
        state.userData = { ...state.userData, ...action.payload.data };
        if (
          action.payload.data.isFirstTime === false &&
          state.postSignupFlowComplete
        ) {
          state.isFirstTime = false;
        }
      }
    });
    builder.addCase(globalActions.likeUser.fulfilled, (state, action) => {
      if (action.payload?.success && action.payload?.data) {
        state.userData = { ...state.userData, ...action.payload.data };
      }
    });
    builder.addCase(userActions.VerifyIosSubscription.fulfilled, (state, action) => {
      if (action.payload?.success && action.payload?.data) {
        state.userData = { ...state.userData, ...action.payload.data };
      }
    });
    builder.addCase(userActions.VerifyOtp.fulfilled, (state, action) => {
      if (action.payload) {
        if (action.payload.success) {
          state.userData = action.payload.data;
          state.isLogin = true;
          /** API: `isFirstTime` on root and on `data` (JWT payload also includes it). */
          const d = action.payload.data;
          const root = action.payload.isFirstTime;
          state.isFirstTime =
            typeof root === "boolean"
              ? root
              : d && typeof d.isFirstTime === "boolean"
                ? d.isFirstTime
                : true;
          state.token = action.payload.token;
          /** New signups stay in onboarding stack until tutorial + subscription. */
          state.postSignupFlowComplete = state.isFirstTime === false;
        }
      }
    });
    builder.addCase(userActions.VerifyOtp.rejected, (state, action) => {
      Toast.show({
        text1: "Error",
        type: "error",
        text2: action.error.message,
      });
    });
    builder.addCase(userActions.UpdateProfile.fulfilled, (state, action) => {
      if (action.payload?.success && action.payload?.data) {
        state.userData = { ...state.userData, ...action.payload.data };
        if (
          action.payload.data.isFirstTime === false &&
          state.postSignupFlowComplete
        ) {
          state.isFirstTime = false;
        }
      }
    });
    builder.addCase(userActions.UpdateProfile.rejected, (state, action) => {
      Toast.show({
        text1: "Error",
        type: "error",
        text2: action.error.message,
      });
    });
    builder.addCase(userActions.UpdateNotifications.fulfilled, (state, action) => {
      if (action.payload) {
        if (action.payload.success) {
          state.userData = action.payload.data;
        }
      }
    });
    builder.addCase(userActions.UploadVideo.fulfilled, (state, action) => {
      const p = action.payload;
      if (p?.success && p?.data) {
        state.userData = { ...state.userData, ...p.data };
      }
    });
    builder.addCase(userActions.UploadProfileMedia.fulfilled, (state, action) => {
      if (action.payload) {
        if (action.payload.success) {
          state.userData = action.payload.data;
        }
      }
    });
    builder.addCase(userActions.UploadProfileMedia.rejected, (state, action) => {
      Toast.show({
        text1: "Error",
        type: "error",
        text2: action.error.message,
      });
    });
    builder.addCase(userActions.completeOnboardingUpload.fulfilled, (state, action) => {
      const p = action.payload;
      if (p?.success && p?.data) {
        const { isFirstTime: _serverFirstTime, ...restData } = p.data || {};
        state.userData = {
          ...state.userData,
          ...restData,
          mediaProcessing:
            p.mediaProcessing ?? p.data.mediaProcessing ?? state.userData?.mediaProcessing,
        };
        state.pendingOnboardingMedia = null;
      }
    });
    builder.addCase(userActions.saveProfileWithMedia.fulfilled, (state, action) => {
      const p = action.payload;
      if (p?.success && p?.data) {
        state.userData = p.data;
      }
    });
  },
});

export const {
  setUser,
  logoutUser,
  setFirstTime,
  setPostSignupFlowComplete,
  setFcmDeviceToken,
  updateUserLikes,
  resetVerfiy,
  setPendingOnboardingMedia,
  clearPendingOnboardingMedia,
} = userSlice.actions;
export default userSlice.reducer;
