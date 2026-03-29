import AsyncStorage from "@react-native-async-storage/async-storage";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from "redux-persist";

import globalSlice from "./globalSlice";
import languageSlice from "./languageSlice";
import userSlice from "./userSlice";
import { injectStore } from "../utils/apiRequest";

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  blacklist: ["isLoader"],
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
