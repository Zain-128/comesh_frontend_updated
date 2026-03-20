import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';

// screen
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, Modal, View } from 'react-native';
import { useDispatch, useSelector } from "react-redux";
import colors from '../constants/colors';
import { setLoader } from '../redux/globalSlice';
import MainStack from './MainStack';
import SplashStack from './SplashStack';

const Stack = createNativeStackNavigator();

const RootStack = () => {

  const loading = useSelector(state => state.globalState.isLoader);
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(setLoader(false));
  }, [])

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
    </>
  );
};

export default RootStack;
