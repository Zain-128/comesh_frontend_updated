import AsyncStorage from "@react-native-async-storage/async-storage";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { createMigrate, persistReducer, persistStore } from "redux-persist";

import globalSlice from "./globalSlice";
import languageSlice from "./languageSlice";
import userSlice from "./userSlice";
import { injectStore } from "../utils/apiRequest";

const migrations = {
  2: (state) => {
    if (!state?.user) {
      return state;
    }
    if (state.user.pendingOnboardingMedia) {
      return {
        ...state,
        user: {
          ...state.user,
          postSignupFlowComplete: false,
        },
      };
    }
    return state;
  },
};

const persistConfig = {
  key: "root",
  version: 2,
  storage: AsyncStorage,
  blacklist: ["isLoader"],
  migrate: createMigrate(migrations),
};

const rootReducer = combineReducers({
  user: userSlice,
  globalState: globalSlice,
  language: languageSlice,
});

const reducerPersisted = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: reducerPersisted,
});

injectStore(store);

export const persistor = persistStore(store);
