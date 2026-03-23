// import 'react-native-gesture-handler';
import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import colors from './constants/colors';
import RootStack from './navigation/RootStack';
import { persistor, store } from './redux/store';

const App = () => {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={[colors.primary, colors.secondary]}
        style={{ ...StyleSheet.absoluteFill }} />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <RootStack />
          </PersistGate>
        </Provider>
      </GestureHandlerRootView>
      <Toast />
    </SafeAreaView>
  );
};

export default App;
