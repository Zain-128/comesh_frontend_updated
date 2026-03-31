import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NetInfo from '@react-native-community/netinfo';
import React, { useEffect } from 'react';

// screen
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, Modal, TouchableOpacity, View } from 'react-native';
import { useDispatch, useSelector } from "react-redux";
import { Typography } from '../components/Typography';
import colors from '../constants/colors';
import Toast from 'react-native-toast-message';
import { setLoader, setNoInternet } from '../redux/globalSlice';
import MainStack from './MainStack';
import SplashStack from './SplashStack';

const Stack = createNativeStackNavigator();

const RootStack = () => {

  const loading = useSelector(state => state.globalState.isLoader);
  const showNoInternet = useSelector(state => state.globalState.showNoInternet);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setLoader(false));
    dispatch(setNoInternet(false));
  }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) {
        dispatch(setNoInternet(false));
      }
    });
    return () => unsub();
  }, [dispatch]);

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={'SplashStack'}
          screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SplashStack" component={SplashStack} />
          <Stack.Screen name="MainStack" component={MainStack} />
        </Stack.Navigator>
      </NavigationContainer>
      <Modal transparent visible={loading} animationType='fade'>
        <View style={{ backgroundColor: "rgba(255,255,255,0.3)", flex: 1, justifyContent: "center", alignItems: 'center', }}>
          <View style={{ borderRadius: 100, backgroundColor: colors.secondary, padding: "5%", elevation: 5, shadowColor: "#aaa", shadowOffset: { height: 3, width: 3 }, shadowOpacity: 0.3, shadowRadius: 5 }}>
            <ActivityIndicator size={60} color={colors.primary} />
          </View>
        </View>
      </Modal>
      <Modal
        visible={showNoInternet}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => dispatch(setNoInternet(false))}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: '#fff',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Typography textType="bold" size={22} style={{ marginBottom: 12, textAlign: 'center' }}>
            No internet connection
          </Typography>
          <Typography size={15} color="#666" style={{ textAlign: 'center', marginBottom: 28 }}>
            Check your connection and try again. This screen appears when a request times out or fails while you are offline.
          </Typography>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={async () => {
              const net = await NetInfo.fetch();
              if (net.isConnected && net.isInternetReachable !== false) {
                dispatch(setNoInternet(false));
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Still offline',
                  text2: 'Turn on Wi-Fi or mobile data, then try again.',
                });
              }
            }}
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 14,
              paddingHorizontal: 32,
              borderRadius: 12,
            }}
          >
            <Typography color="#fff" textType="semiBold" size={16}>
              Try again
            </Typography>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
};

export default RootStack;
