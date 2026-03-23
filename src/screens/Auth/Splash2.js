import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, ImageBackground, PermissionsAndroid, Platform, StyleSheet } from 'react-native';
import {
  widthPercentageToDP
} from 'react-native-responsive-screen';

// local imports
import notifee, { AndroidImportance } from "@notifee/react-native";
import { getApp, getApps } from "@react-native-firebase/app";
import {
  AuthorizationStatus,
  getAPNSToken,
  getMessaging,
  onMessage,
  registerDeviceForRemoteMessages,
  requestPermission,
} from "@react-native-firebase/messaging";
import images from '../../assets/images/index';
import colors from '../../constants/colors';

const Splash2 = () => {
  const navigation = useNavigation();
  const animatedValue = useRef(new Animated.Value(0)).current;


  async function requestUserPermission() {
    if (Platform.OS === "android" && Platform.Version >= 33) {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
    const app = getApp();
    const messagingInstance = getMessaging(app);
    const authStatus = await requestPermission(messagingInstance);
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
    if (Platform.OS == 'ios') {
      await registerDeviceForRemoteMessages(messagingInstance).then((resolved) => {
        console.log("FCM Register Device Result: ", resolved);
      }, (error) => {
        console.warn("FCM Register Device ERROR: ", error);
      });
    }
  }

  const RegisterForNotifications = async () => {
    if (!getApps().length) {
      // Firebase native app is not configured, skip push setup.
      return;
    }
    const app = getApp();
    const messagingInstance = getMessaging(app);
    await requestUserPermission();
    let channelId = await notifee.createChannel({
      id: "comesh",
      name: "ComeshApp",
      sound: "default",
      vibration: true,
      badge: true,
      importance: AndroidImportance.HIGH
    })
    await getAPNSToken(messagingInstance);
    onMessage(messagingInstance, (message) => {
      notifee.displayNotification({
        ...message.notification,
        android: {
          channelId,
        }
      })
    })
  }

  useEffect(() => {
    setTimeout(() => {
      RegisterForNotifications().catch((error) => {
        console.warn("Notification setup failed", error?.message || error);
      });
    }, 250);
    setTimeout(() => {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        // navigation.reset({
        //   index: 0,
        //   routes: [{name: 'Splash3'}],
        // });

        navigation.reset({
          index: 0,
          routes: [{ name: 'MainStack' }],
        });

      });
    }, 3000);
  }, []);

  return (
    <>
      <ImageBackground
        source={require('../../assets/images/splash2-bg.png')}
        resizeMode="cover"
        style={styles.container}
      />
      <Animated.View
        style={[
          styles.logoStyle,
          {
            transform: [
              {
                scale: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ],
          },
        ]}>
        <Image source={images.Logo} style={styles.videoWrapper} />
      </Animated.View>
    </>
  );
};

export default Splash2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
  },
  logoStyle: {
    width: widthPercentageToDP(30),
    height: widthPercentageToDP(30),
    borderRadius: widthPercentageToDP(2),
    overflow: 'hidden',
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
  },
});
