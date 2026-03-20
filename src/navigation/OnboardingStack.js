import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// screen
import Signup from "../screens/Auth/SignUp";
import GestureGuide from '../screens/Onboarding/GestureGuide';
import OnBoard2 from '../screens/Onboarding/OnBoard2';
import OnBoard3 from '../screens/Onboarding/OnBoard3';
import OnBoard4 from '../screens/Onboarding/OnBoard4';
import UploadProfileVid from '../screens/Onboarding/UploadProfileVid';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const OnBoardStack = () => {
  return (
    <Stack.Navigator
      initialRouteName={'SignUp'}
      screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignUp" component={Signup} />
      <Stack.Screen name="OnBoard1" component={UploadProfileVid} />
      <Stack.Screen name="OnBoard2" component={OnBoard2} />
      <Stack.Screen name="OnBoard3" component={OnBoard3} />
      <Stack.Screen name="OnBoard4" component={OnBoard4} />
      <Stack.Screen name="GestureGuide" component={GestureGuide} />
    </Stack.Navigator>
  );
};

export default OnBoardStack;
