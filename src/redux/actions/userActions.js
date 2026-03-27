import { Platform } from "react-native";
import Toast from "react-native-toast-message";
import RNFetchBlob from "react-native-blob-util";
import endPoints from "../../constants/endPoints";
import apiRequest from "../../utils/apiRequest";
import { compressVideoForUpload } from "../../utils/compressMedia";

const { createAsyncThunk } = require("@reduxjs/toolkit")
const { default: axios, AxiosError, Axios } = require("axios")

const SignIn = createAsyncThunk(
  'auth/Login',
  async (data, thunkAPI) => {
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

const SignOut = createAsyncThunk(
  'auth/Logout',
  async (data, thunkAPI) => {
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

const VerifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async (data, thunkAPI) => {
    try {
      let result = await apiRequest.put(endPoints.VerfiyOTP, {
        phoneNo: data.phone,
        otp: data.otp
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

const UpdateProfile = createAsyncThunk(
  'auth/updateProfile',
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
      return data.isFirstTime ? { ...result.data, isFirstTime: data.isFirstTime } : result.data;
    } catch (error) {
      console.warn("rerere", error)
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

const UploadVideo = createAsyncThunk(
  'auth/updateProfile',
  async (data, thunkAPI) => {
    try {
      const compressedUri = await compressVideoForUpload(data.video.uri);
      const uri = compressedUri || data.video.uri;
      const baseName = (uri && String(uri).split("/").pop()) || data.video.name || "profile.mp4";
      const filename = baseName.toLowerCase().endsWith(".mp4") ? baseName : `${baseName}.mp4`;
      let resp = await RNFetchBlob.fetch("PUT", endPoints.baseUrl + endPoints.UpdateProfile, {
        Authorization: `Bearer ${thunkAPI.getState().user.token}`,
        "Content-Type": "multipart/form-data",
      }, [
        {
          name: "profileVideo",
          filename,
          type: data.video.type || "video/mp4",
          data: Platform.OS == 'android' ? RNFetchBlob.wrap(decodeURIComponent(uri).replace("file://", "")) : RNFetchBlob.wrap(decodeURIComponent(uri).replace("file://", "")),
        },
      ]).uploadProgress((sent, total) => {
        data.onProgress({ sent, total })
      })
      data.callback(resp.data);
      if (data?.redirect)
        return JSON.parse(resp.data)
      else
        return {};

      // .then((resp) => {
      // }).catch((reason) => {
      //   Toast.show({
      //     type: "error",
      //     text1: "Error",
      //     text2: reason
      //   })
      // })
    } catch (error) {
      console.warn("rerere", error)
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

const UploadProfileMedia = createAsyncThunk(
  'auth/UploadProfileMedia',
  async (data, thunkAPI) => {

    const compressedList = await Promise.all(
      (data?.video || []).map(async (vid) => {
        const outUri = await compressVideoForUpload(vid.uri);
        return { ...vid, uri: outUri || vid.uri };
      })
    );

    let params = [...compressedList.map((vid) => {
      const uri = vid.uri;
      const baseName = (uri && String(uri).split("/").pop()) || vid.name || vid.fileName || "clip.mp4";
      const filename = baseName.toLowerCase().endsWith(".mp4") ? baseName : `${baseName}.mp4`;
      return {
        name: "videos",
        filename,
        type: vid.type || "video/mp4",
        data: Platform.OS == 'android' ? RNFetchBlob.wrap(decodeURIComponent(uri).replace("file://", "")) : RNFetchBlob.wrap(decodeURIComponent(uri).replace("file://", "")),
      }
    })];
    if (data?.prevMedia && data?.prevMedia?.length) {
      params.push({
        name: "previousVideos",
        data: JSON.stringify(data?.prevMedia)
      })
    }
    try {
      return await RNFetchBlob.fetch("PUT", endPoints.baseUrl + endPoints.UpdateProfile, {
        Authorization: `Bearer ${thunkAPI.getState().user.token}`,
        "Content-Type": "multipart/form-data",
      },
        params
      ).uploadProgress((sent, total) => {
        data.onProgress({ sent, total })
      }).then((resp) => {
        data.callback(resp.data);
        return resp.data
      }).catch((reason) => {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: reason
        })
      })
    } catch (error) {
      console.warn("rerere", error)
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
  SignIn,
  SignOut,
  VerifyOtp,
  UpdateProfile,
  UploadVideo,
  UploadProfileMedia,
}