import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useSelector } from 'react-redux';

// screen
import AuthStack from './AuthStack';
import HomeStack from './HomeStack';
import OnBoardStack from './OnboardingStack';

const Stack = createNativeStackNavigator();

const MainStack = () => {
  const { isLogin, postSignupFlowComplete } = useSelector((state) => state.user);
  /** Home only after Gesture Guide + Subscription (not when server sets isFirstTime false). */
  return isLogin
    ? postSignupFlowComplete
      ? <HomeStack />
      : <OnBoardStack />
    : <AuthStack />;
};

export default MainStack;
