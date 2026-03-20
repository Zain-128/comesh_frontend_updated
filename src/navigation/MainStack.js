import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useSelector } from 'react-redux';

// screen
import AuthStack from './AuthStack';
import HomeStack from './HomeStack';
import OnBoardStack from './OnboardingStack';

const Stack = createNativeStackNavigator();

const MainStack = () => {
  const { isLogin, isFirstTime, userData } = useSelector(state => state.user);
  return isLogin ? isFirstTime ? <OnBoardStack /> : <HomeStack /> : <AuthStack />;
};

export default MainStack;
