import { createSlice } from "@reduxjs/toolkit";
import Toast from "react-native-toast-message";
import globalActions from "./actions/globalActions";

/** First occurrence wins — avoids duplicates when REST + socket + optimistic send overlap. */
function dedupeMessagesById(list) {
  if (!Array.isArray(list)) return list;
  const seen = new Set();
  const out = [];
  for (const m of list) {
    const id = m?._id != null ? String(m._id) : null;
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    out.push(m);
  }
  return out;
}

const globalSlice = createSlice({
  name: "global",
  initialState: {
    isLoader: false,
    dashboard: {
      data: [],
    },
    dashLoading: false,
    othersProfile: null,
    staticContent: null,
    chats: null,
    messages: null,
    notifications: [],
  },
  reducers: {
    setLoader(state, action) {
      state.isLoader = action.payload;
    },
    setDashLoader(state, action) {
      state.dashLoading = action.payload;
    },
    emptyDashData(state, action) {
      state.dashboard = { data: [] };
    },
    AppendNewMessage(state, action) {
      const prev = state.messages?.data ?? [];
      const incoming = action.payload;
      const id = incoming?._id != null ? String(incoming._id) : null;
      if (id && prev.some((m) => String(m?._id) === id)) return;
      state.messages = {
        ...(state.messages || {}),
        data: [incoming, ...prev],
      };
    },
  },
  extraReducers: (builder) => {
    builder.addCase(globalActions.DashboardListing.fulfilled, (state, action) => {
      if (action.payload) {
        if (action.payload.success) {
          let { data, ...rest } = action.payload.data;
          if (rest.pagination.current === 1)
            state.dashboard = {
              data,
              ...rest,
            };
          else
            state.dashboard = {
              data: [...state.dashboard.data, ...data],
              ...rest,
            };
        }
      }
    });
    builder.addCase(globalActions.DashboardListing.rejected, (state, action) => {
      Toast.show({
        text1: "Error",
        type: "error",
        text2: action.payload?.message,
      });
    });

    builder.addCase(globalActions.GetOthersProfile.fulfilled, (state, action) => {
      if (action.payload) {
        if (action.payload.success) {
          state.othersProfile = action.payload.data;
        }
      }
    });
    builder.addCase(globalActions.GetOthersProfile.rejected, (state, action) => {
      Toast.show({
        text1: "Error",
        type: "error",
        text2:
          action.payload?.message ||
          action.error?.message ||
          "Could not load profile",
      });
    });
    builder.addCase(globalActions.blockUser.fulfilled, (state, action) => {
      if (action.payload) {
        if (action.payload.success) {
          state.dashboard = {
            ...state.dashboard,
            data: state.dashboard.data.filter(
              (item) => item._id !== action.payload.userId
            ),
          };
        }
      }
    });
    builder.addCase(globalActions.blockUser.rejected, (state, action) => {
      Toast.show({
        text1: "Error",
        type: "error",
        text2: action.payload?.message,
      });
    });
    builder.addCase(globalActions.reportUser.fulfilled, (state, action) => {
      if (action.payload) {
        if (action.payload.success) {
          state.dashboard = {
            ...state.dashboard,
            data: state.dashboard.data.filter(
              (item) => item._id !== action.payload.userId
            ),
          };
        }
      }
    });
    builder.addCase(globalActions.reportUser.rejected, (state, action) => {
      Toast.show({
        text1: "Error",
        type: "error",
        text2: action.payload?.message,
      });
    });
    builder.addCase(globalActions.likeUser.fulfilled, (state, action) => {
      if (action.payload) {
        if (action.payload.success) {
          // reserved
        }
      }
    });
    builder.addCase(globalActions.likeUser.rejected, (state, action) => {
      Toast.show({
        text1: "Error",
        type: "error",
        text2: action.payload?.message,
      });
    });
    builder.addCase(globalActions.unLikeUser.fulfilled, (state, action) => {
      if (action.payload) {
        if (action.payload.success) {
          // reserved
        }
      }
    });
    builder.addCase(globalActions.unLikeUser.rejected, (state, action) => {
      Toast.show({
        text1: "Error",
        type: "error",
        text2: action.payload?.message,
      });
    });
    builder.addCase(globalActions.getStaticContent.fulfilled, (state, action) => {
      if (action.payload) {
        if (action.payload.success) {
          state.staticContent = action.payload.data;
        }
      }
    });
    builder.addCase(globalActions.getStaticContent.rejected, (state, action) => {
      Toast.show({
        text1: "Error",
        type: "error",
        text2: action.payload?.message,
      });
    });
    builder.addCase(globalActions.GetChats.fulfilled, (state, action) => {
      if (action.payload) {
        if (action.payload.success) {
          state.chats = action.payload.data;
        }
      }
    });
    builder.addCase(globalActions.GetChats.rejected, (state, action) => {
      Toast.show({
        text1: "Error",
        type: "error",
        text2: action.payload?.message,
      });
    });
    builder.addCase(globalActions.GetMoreChats.fulfilled, (state, action) => {
      if (action.payload) {
        if (action.payload.success) {
          console.warn("CHAT PAYLOAD", action.payload.data.pagination);
          state.chats = {
            ...action.payload.data,
            data: [...state.chats.data, ...action.payload.data.data],
          };
        }
      }
    });
    builder.addCase(globalActions.GetMoreChats.rejected, (state, action) => {
      Toast.show({
        text1: "Error",
        type: "error",
        text2: action.payload?.message,
      });
    });
    builder.addCase(globalActions.GetMessages.fulfilled, (state, action) => {
      if (!action.payload?.success || !action.payload.data) return;
      const block = action.payload.data;
      if (Array.isArray(block.data)) {
        state.messages = {
          ...block,
          data: dedupeMessagesById(block.data),
        };
      } else {
        state.messages = action.payload.data;
      }
    });
    /** Own sends: socket often does not echo to sender; append API response so bubble shows immediately. */
    builder.addCase(globalActions.SendMessage.fulfilled, (state, action) => {
      const payload = action.payload;
      if (!payload?.success || !payload?.data) return;
      const doc = payload.data;
      const prev = state.messages?.data ?? [];
      const id = doc?._id != null ? String(doc._id) : null;
      if (id && prev.some((m) => String(m?._id) === id)) return;
      const row = {
        _id: doc._id,
        chatId: doc.chatId,
        from: doc.from,
        to: doc.to,
        message: doc.message,
        messageType: doc.messageType,
        mediaFile: doc.mediaFile ?? null,
        replyTo: doc.replyTo ?? null,
        createdAt: doc.createdAt ?? new Date().toISOString(),
        updatedAt: doc.updatedAt,
      };
      state.messages = {
        ...(state.messages || {}),
        data: dedupeMessagesById([row, ...prev]),
      };
    });
    builder.addCase(globalActions.GetMessages.rejected, (state, action) => {
      Toast.show({
        text1: "Error",
        type: "error",
        text2: action.payload?.message,
      });
    });
    builder.addCase(globalActions.GetMoreMessages.fulfilled, (state, action) => {
      if (!action.payload?.success || !action.payload.data?.data) return;
      const merged = [
        ...(state.messages?.data || []),
        ...action.payload.data.data,
      ];
      state.messages = {
        ...action.payload.data,
        data: dedupeMessagesById(merged),
      };
    });
    builder.addCase(globalActions.GetMoreMessages.rejected, (state, action) => {
      Toast.show({
        text1: "Error",
        type: "error",
        text2: action.payload?.message,
      });
    });
    builder.addCase(globalActions.getNotifications.fulfilled, (state, action) => {
      if (action.payload) {
        if (action.payload.success) {
          state.notifications = action.payload.data;
        }
      }
    });
    builder.addCase(globalActions.getNotifications.rejected, (state, action) => {
      Toast.show({
        text1: "Error",
        type: "error",
        text2: action.payload?.message,
      });
    });
  },
});

export const { setLoader, setDashLoader, AppendNewMessage, emptyDashData } =
  globalSlice.actions;
export default globalSlice.reducer;
