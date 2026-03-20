import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, PermissionsAndroid, Platform, StyleSheet, View } from 'react-native';
import * as Animatable from 'react-native-animatable';
import LinearGradient from 'react-native-linear-gradient';
import {
  widthPercentageToDP
} from 'react-native-responsive-screen';
import Video from 'react-native-video';

// local imports
import notifee, { AndroidImportance } from "@notifee/react-native";
import messaging from '@react-native-firebase/messaging';
import images from '../../assets/images/index';
import colors from '../../constants/colors';

const Splash2 = () => {
  const navigation = useNavigation();
  const animatedValue = useRef(new Animated.Value(0)).current;


  async function requestUserPermission() {
    if (Platform.OS == "android") {
      PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Authorization status:', authStatus);
    }
    if (Platform.OS == 'ios') {
      if (!messaging().isDeviceRegisteredForRemoteMessages)
        await messaging().registerDeviceForRemoteMessages().then((resolved) => {
          console.log("FCM Register Device Result: ", resolved);
        }, (error) => {
          console.warn("FCM Register Device ERROR: ", error);
        });;
    }
  }

  const RegisterForNotifications = async () => {
    await requestUserPermission();
    let channelId = await notifee.createChannel({
      id: "comesh",
      name: "ComeshApp",
      sound: "default",
      vibration: true,
      badge: true,
      importance: AndroidImportance.HIGH
    })
    await messaging().getAPNSToken();
    messaging().onMessage((message) => {
      notifee.displayNotification({
        ...message.notification,
        android: {
          channelId,
        }
      })
    })
  }

  useEffect(() => {
    RegisterForNotifications()
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
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.container}>
        <View style={{ width: '49.5%', justifyContent: 'space-between' }}>
          <Animatable.View animation={'bounceInLeft'} style={{ height: '33%' }}>
            <Video
              resizeMode={'cover'}
              repeat={true}
              muted={true}
              source={images.dummy_video1}
              style={styles.videoWrapper}
            />
          </Animatable.View>
          <Animatable.View animation={'bounceInLeft'} style={{ height: '33%' }}>
            <Video
              resizeMode={'cover'}
              repeat={true}
              muted={true}
              source={images.dummy_video4}
              style={styles.videoWrapper}
            />
          </Animatable.View>
          <Animatable.View animation={'bounceInUp'} style={{ height: '33%' }}>
            <Video
              resizeMode={'cover'}
              repeat={true}
              muted={true}
              source={images.dummy_video6}
              style={styles.videoWrapper}
            />
          </Animatable.View>
        </View>
        <View style={{ width: '49.5%', justifyContent: 'space-between' }}>
          <Animatable.View animation={'bounceInDown'} style={{ height: '49.8%' }}>
            <Video
              resizeMode={'cover'}
              repeat={true}
              muted={true}
              source={images.dummy_video2}
              style={styles.videoWrapper}
            />
          </Animatable.View>
          <Animatable.View
            animation={'bounceInRight'}
            style={{ height: '49.8%' }}>
            <Video
              resizeMode={'cover'}
              repeat={true}
              muted={true}
              source={images.dummy_video5}
              style={styles.videoWrapper}
            />
          </Animatable.View>
        </View>
      </LinearGradient>
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
