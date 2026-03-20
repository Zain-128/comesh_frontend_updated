import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';

// slices imports
import globalSlice from './globalSlice';
import languageSlice from './languageSlice';
import userSlice from './userSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  blacklist: ['isLoader']
};

let rootReducer = combineReducers({
  user: userSlice,
  globalState: globalSlice,
  language: languageSlice,
});

let reducerPersisted = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: reducerPersisted,
});

export const persistor = persistStore(store)
