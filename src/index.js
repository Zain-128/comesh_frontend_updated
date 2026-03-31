// import 'react-native-gesture-handler';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import colors from './constants/colors';
import RootStack from './navigation/RootStack';
import { persistor, store } from './redux/store';

// Hide timeout-related error toasts globally.
if (!Toast.__timeoutFilterPatched) {
  const originalShow = Toast.show?.bind(Toast);
  Toast.show = (options = {}) => {
    const msg = `${options?.text1 || ''} ${options?.text2 || ''}`.toLowerCase();
    if (
      msg.includes('timeout') ||
      msg.includes('timed out') ||
      msg.includes('econnaborted')
    ) {
      return;
    }
    return originalShow?.(options);
  };
  Toast.__timeoutFilterPatched = true;
}

/** Gradient edge-to-edge; app UI sits inside SafeAreaView (safe-area-context). */
const App = () => {
  return (
    <GestureHandlerRootView style={styles.flex1}>
      <SafeAreaProvider>
        <View style={styles.flex1}>
          <LinearGradient
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            colors={[colors.primary, colors.secondary]}
            style={StyleSheet.absoluteFillObject}
          />
          <SafeAreaView style={styles.flex1} edges={['top', 'left', 'right', 'bottom']}>
            <Provider store={store}>
              <PersistGate loading={null} persistor={persistor}>
                <RootStack />
              </PersistGate>
            </Provider>
          </SafeAreaView>
          <Toast />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  flex1: { flex: 1 },
});

export default App;
