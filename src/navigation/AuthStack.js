import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// screens
import Login from '../screens/Auth/Login';
import VerifyPhone from '../screens/Auth/VerifyPhone';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="VerifyPhone" component={VerifyPhone} />
    </Stack.Navigator>
  );
};

export default AuthStack;
