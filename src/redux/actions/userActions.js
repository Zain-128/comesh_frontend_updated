import { Platform } from "react-native";
import Toast from "react-native-toast-message";
import RNFetchBlob from "rn-fetch-blob";
import endPoints from "../../constants/endPoints";
import apiRequest from "../../utils/apiRequest";

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
      let resp = await RNFetchBlob.fetch("PUT", endPoints.baseUrl + endPoints.UpdateProfile, {
        Authorization: `Bearer ${thunkAPI.getState().user.token}`,
        "Content-Type": "multipart/form-data",
      }, [
        {
          name: "profileVideo",
          filename: data.video.name,
          type: data.video.type,
          data: Platform.OS == 'android' ? RNFetchBlob.wrap(decodeURIComponent(data.video.uri).replace("file://", "")) : RNFetchBlob.wrap(decodeURIComponent(data.video.uri)).replace("file://", ""),
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

    let params = [...data?.video.map((vid) => {
      return {
        name: "videos",
        filename: vid.name ? vid.name : vid.fileName,
        type: vid.type,
        data: Platform.OS == 'android' ? RNFetchBlob.wrap(decodeURIComponent(vid.uri).replace("file://", "")) : RNFetchBlob.wrap(decodeURIComponent(vid.uri)).replace("file://", ""),
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