import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

// screen
import Block from '../screens/App/Block';
import CardDetails from '../screens/App/CardDetails';
import ChangePassword from '../screens/App/ChangePassword';
import Chat from '../screens/App/Chat';
import Deactivate from "../screens/App/Deactivate";
import EditProfile from "../screens/App/EditProfile";
import Feedback from '../screens/App/Feedback';
import Filter from '../screens/App/Filter';
import Home from '../screens/App/Home';
import Maps from "../screens/App/Maps";
import Messages from '../screens/App/Messages';
import MyProfile from '../screens/App/MyProfile';
import Notifications from '../screens/App/Notifications';
import PaymentMethod from '../screens/App/PaymentMethod';
import Policies from '../screens/App/Policies';
import Profile from '../screens/App/Profile';
import SearchUsers from '../screens/App/SearchUsers';
import Settings from "../screens/App/Settings";
import Subscription from '../screens/App/Subscription';
import BottomTabs from './BottomTabs';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={BottomTabNavigation} />
      <Stack.Screen name="SearchUsers" component={SearchUsers} />
      <Stack.Screen name="UserProfile" component={Profile} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="Messages" component={Messages} />
      <Stack.Screen name="Block" component={Block} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="Subscription" component={Subscription} />
      <Stack.Screen name="PaymentMethod" component={PaymentMethod} />
      <Stack.Screen name="CardDetails" component={CardDetails} />
      <Stack.Screen name="ChangePassword" component={ChangePassword} />
      <Stack.Screen name="Policies" component={Policies} />
      <Stack.Screen name="Deactivate" component={Deactivate} />
      <Stack.Screen name="Feedback" component={Feedback} />
      <Stack.Screen name="Maps" component={Maps} />
    </Stack.Navigator>
  );
};

export default HomeStack;

const BottomTabNavigation = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      tabBar={(tabBarProps) => <BottomTabs {...tabBarProps} />}
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen name="Chat" component={Chat} />
      <Tab.Screen name="Filter" component={Filter} />
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="MyProfile" component={MyProfile} />
      <Tab.Screen name="Settings" component={Settings} />
    </Tab.Navigator>
  );
};
