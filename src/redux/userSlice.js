import { createSlice } from '@reduxjs/toolkit';
import Toast from "react-native-toast-message";
import userActions from "./actions/userActions";

const userSlice = createSlice({
  name: 'user',
  initialState: { isLogin: false, isFirstTime: true, userData: {}, userRegister: {}, token: "" },
  reducers: {
    setFirstTime(state, action) {
      state.isFirstTime = action.payload;
    },
    setUser(state, action) {
      state.userRegister = {
        ...state.userRegister, ...action.payload
      };
    },
    updateUserLikes(state, action) {
      const likedByMe = state?.userData?.likedByMe || [];
      const unLikedByMe = state?.userData?.unLikedByMe || [];
      if (action.payload.type == "like") {
        let arr = unLikedByMe.filter((i) => i !== action.payload.userId);
        state.userData = {
          ...state.userData,
          likedByMe: [...new Set([...likedByMe, action.payload.userId])],
          unLikedByMe: arr
        };
      }
      else {
        let arr = likedByMe.filter((i) => i !== action.payload.userId);
        state.userData = {
          ...state.userData,
          unLikedByMe: [...new Set([...unLikedByMe, action.payload.userId])],
          likedByMe: arr
        };
      }

    },
    logoutUser(state, action) {
      state.isFirstTime = true;
      state.isLogin = false;
      state.userData = null;
      state.userRegister = null;
      state.token = "";
    },
    resetVerfiy(state, action) {
      state.userData = null;
      state.isLogin = false;
      state.isFirstTime = true;
      state.token = "";
    }
  },
  extraReducers: (builder) => {
    builder.addCase(userActions.SignIn.fulfilled, (state, action) => {
      // Add user to the state array
      if (action.payload) {
        if (action.payload.success) {
          // console.log(action.payload.data);
          // console.log(action.payload.success, 'Logged In');
        }
      }
    }),
      builder.addCase(userActions.SignIn.rejected, (state, action) => {
        // Add user to the state array
        Toast.show({
          text1: "Error",
          type: "error",
          text2: action.payload.message
        })

      }),
      builder.addCase(userActions.SignOut.fulfilled, (state, action) => {
        // Add user to the state array
        if (action.payload) {
          if (action.payload.success) {
            // Toast.show({
            //   text1: "Success",
            //   type: "success",
            //   text2: action.payload.message
            // })
          }
        }
      }),
      builder.addCase(userActions.SignOut.rejected, (state, action) => {
        // Add user to the state array
        Toast.show({
          text1: "Error",
          type: "error",
          text2: action.payload.message
        })

      }),
      builder.addCase(userActions.VerifyOtp.fulfilled, (state, action) => {
        // Add user to the state array
        if (action.payload) {
          if (action.payload.success) {
            state.userData = action.payload.data;
            state.isLogin = true;
            state.isFirstTime = action.payload.data.isFirstTime;
            state.token = action.payload.token;
          }
        }
      }),
      builder.addCase(userActions.VerifyOtp.rejected, (state, action) => {
        // Add user to the state array
        Toast.show({
          text1: "Error",
          type: "error",
          text2: action.error.message
        })

      }),
      builder.addCase(userActions.UpdateProfile.fulfilled, (state, action) => {
        // Add user to the state array
        if (action.payload) {
          if (action.payload.success) {
            state.userData = action.payload.data;
            state.isFirstTime = action.payload?.isFirstTime ? action.payload?.isFirstTime : false;
          }
        }
      }),
      builder.addCase(userActions.UpdateProfile.rejected, (state, action) => {
        // Add user to the state array
        Toast.show({
          text1: "Error",
          type: "error",
          text2: action.error.message
        })

      }),
      builder.addCase(userActions.UploadProfileMedia.fulfilled, (state, action) => {
        // Add user to the state array
        if (action.payload) {
          if (action.payload.success) {
            state.userData = action.payload.data;
          }
        }
      }),
      builder.addCase(userActions.UploadProfileMedia.rejected, (state, action) => {
        // Add user to the state array
        Toast.show({
          text1: "Error",
          type: "error",
          text2: action.error.message
        })

      })
  }

});

export const { setUser, logoutUser, setFirstTime, updateUserLikes, resetVerfiy } = userSlice.actions;
export default userSlice.reducer;
