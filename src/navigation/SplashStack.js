import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// screens
import Splash from '../screens/Auth/Splash';
import Splash2 from '../screens/Auth/Splash2';
import Splash3 from '../screens/Auth/Splash3';

const Stack = createNativeStackNavigator();

const SplashStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="Splash2" component={Splash2} />
      <Stack.Screen name="Splash3" component={Splash3} />
    </Stack.Navigator>
  );
};

export default SplashStack;
