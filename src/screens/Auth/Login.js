import { useFocusEffect } from '@react-navigation/native';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import LinearGradient from 'react-native-linear-gradient';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import Video from 'react-native-video';

// local import
import Toast from "react-native-toast-message";
import { useDispatch } from "react-redux";
import images from '../../assets/images';
import PrimaryButton from '../../components/Buttons/PrimaryButton';
import { Typography } from '../../components/Typography';
import colors from '../../constants/colors';
import { fontsSize } from '../../constants/fonts';
import userActions from '../../redux/actions/userActions';
import { fcmTokenLabel, getFcmRegistrationToken } from '../../push/fcmToken';
import { obtainFcmToken } from '../../push/notifeeSetup';
import { pushLog } from '../../push/pushLog';
import { setLoader } from '../../redux/globalSlice';
import { setFcmDeviceToken } from '../../redux/userSlice';
import { validatePhoneForCountry } from '../../utils/phoneValidation';

let otp = '';

const Login = (props) => {
  const refInput = useRef();
  /** Last E.164 from libphonenumber validation (modal + VerifyPhone must match). */
  const lastPhoneE164Ref = useRef('');
  const [show, setShow] = useState(false);
  const [modal, setModal] = useState(false);
  const [countryCode, setCountryCode] = useState('US');
  const [selectCountry, setSelectCountry] = useState('1');
  const [mobileNo, setMobileNo] = useState('');
  const dispatch = useDispatch();

  /**
   * Ask for notification permission on Login after this screen is focused.
   * Short delay so the splash → Login transition finishes before the system dialog.
   */
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const timer = setTimeout(async () => {
        try {
          const token =
            (await getFcmRegistrationToken()) ?? (await obtainFcmToken());
          if (cancelled) return;
          pushLog('Login focus: FCM token resolved', fcmTokenLabel(token));
          if (token) dispatch(setFcmDeviceToken(token));
          try {
            const ns = await notifee.getNotificationSettings();
            if (
              !cancelled &&
              ns?.authorizationStatus === AuthorizationStatus.DENIED
            ) {
              Alert.alert(
                'Notifications off',
                'OTP / alerts need notifications. Enable in Settings → CoMesh → Notifications.',
                [
                  { text: 'Later', style: 'cancel' },
                  {
                    text: 'Open Settings',
                    onPress: () => Linking.openSettings(),
                  },
                ],
              );
            }
          } catch (_) {
            /* ignore */
          }
        } catch (_) {
          /* ignore */
        }
      }, 550);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }, [dispatch]),
  );

  useEffect(() => {
    Keyboard.addListener("keyboardDidHide", (ev) => {
      if (refInput.current)
        refInput.current.blur();
    })
  }, [])

  /** Uses token from focus effect when possible; otherwise requests permission here too. */
  const LoginFunc = async () => {
    const parsed = validatePhoneForCountry(countryCode, mobileNo);
    if (!parsed.ok) {
      Toast.show({
        text1: "Warning",
        type: "error",
        text2: parsed.message,
      });
      return;
    }
    const phone = parsed.e164;
    lastPhoneE164Ref.current = phone;
    dispatch(setLoader(true))
    try {
      let token =
        (await getFcmRegistrationToken()) ?? (await obtainFcmToken());
      pushLog('Login submit: sending FCM token', fcmTokenLabel(token));
      if (token) {
        dispatch(setFcmDeviceToken(token));
      }
      await dispatch(userActions.SignIn({
        phone,
        token,
        callback: (data) => {
          console.warn(data?.data?.otp)
          if (data?.data?.user?.isDeleted) {
            otp = data?.data?.otp;
            setModal(true)
            return;
          }
          props.navigation.navigate('VerifyPhone', { phone, otp: data?.data?.otp })
        }
      }))

    } catch (error) {
      console.warn("Error", error)
      Toast.show({
        text: "Warning",
        text2: error.message,
        type: "error"
      })
    }
    dispatch(setLoader(false))
  }

  return (
    <View style={styles.container}>
      <View style={styles.videoWrapper}>
        <Video
          repeat={true}
          muted={true}
          source={images.dummy_video4}
          resizeMode={'cover'}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      </View>
      <LinearGradient
        colors={['rgba(0,0,0,0)', 'rgba(0,0,0,1)']}
        style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <KeyboardAvoidingView
            behavior={"padding"}
          >
            <View style={styles.mainWrapper}>
              <Image
                source={images.Logo}
                style={{
                  width: widthPercentageToDP(28),
                  height: widthPercentageToDP(28),
                }}
              />
              <Text style={styles.heading}>Sign in with Phone Number</Text>
              <View style={styles.numberInputWrapper}>
                <View style={styles.countryPicker}>
                  <CountryPicker
                    visible={show}
                    onClose={() => setShow(false)}
                    {...{
                      countryCode: countryCode,
                      withFilter: true,
                      withFlag: true,
                      withAlphaFilter: true,
                      withFlagButton: true,
                      onSelect: e => {
                        setCountryCode(e.cca2);
                        setSelectCountry(e.callingCode[0]);
                        setShow(false);
                      },
                      containerButtonStyle: {},
                    }}
                  />
                </View>
                <View style={styles.inputWrapper}>
                  <TextInput
                    ref={refInput}
                    style={styles.input}
                    onChangeText={setMobileNo}
                    value={mobileNo}
                    placeholderTextColor="#dddd"
                    placeholder="992 9991 779"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <PrimaryButton
                text={'Sign In'}
                onPress={() => { LoginFunc() }}
                style={{ marginTop: heightPercentageToDP(3) }}
              />
              {/* <View style={styles.dividers}>
                <DividerHorizontal bg="white" h={1} mt={0} w="15%" />
                <Text style={styles.text2}>OR SIGN IN WITH</Text>
                <DividerHorizontal bg="white" h={1} mt={0} w="15%" />
              </View>

              <View style={styles.socialWrapper}>
                <Pressable style={styles.socialIc}>
                  <Image
                    source={images.google}
                    style={{ width: '50%', height: '50%' }}
                  />
                </Pressable>
                <Pressable
                  style={[styles.socialIc, { backgroundColor: '#0679dd' }]}>
                  <Image
                    source={images.fb}
                    style={{ width: '60%', height: '60%' }}
                  />
                </Pressable>
                <Pressable style={styles.socialIc}>
                  <Image
                    source={images.insta}
                    style={{ width: '100%', height: '100%' }}
                  />
                </Pressable>
              </View> */}
            </View>
          </KeyboardAvoidingView>
        </ScrollView>
      </LinearGradient>
      <Modal visible={modal} transparent animationType='fade'>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)", justifyContent: "center", alignItems: 'center', }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 20, width: widthPercentageToDP(90), padding: widthPercentageToDP(10), gap: heightPercentageToDP(5) }}>
            <View style={{ alignItems: 'center', justifyContent: "center", gap: 10 }}>
              <Typography textType='bold' size={30} align='center'>
                Account Deactivated
              </Typography>
              <Typography color='#aaa'>
                This account had been deactivated, Do you want to re-activate this account?
              </Typography>
            </View>
            <View style={{ gap: 20 }}>
              <PrimaryButton text={"Yes, Re-Activate account"} onPress={() => {
                setModal(false)
                props.navigation.navigate('VerifyPhone', { phone: lastPhoneE164Ref.current, otp })
              }} />
              <TouchableOpacity style={{ alignItems: 'center', }} onPress={() => setModal(false)}>
                <Typography textType='semiBold' color='#aaa'>
                  NO
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    width: '90%',
    height: '100%',
    alignSelf: 'center',
    paddingTop: heightPercentageToDP(25),
  },
  mainWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'absolute',
  },
  numberInputWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignSelf: 'center',
    marginTop: heightPercentageToDP(3),
  },
  countryPicker: {
    backgroundColor: 'white',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    height: heightPercentageToDP(6),
    width: widthPercentageToDP(20),
  },
  dividers: {
    marginTop: heightPercentageToDP(3),
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
  },
  heading: {
    textAlign: 'center',
    alignSelf: 'center',
    fontSize: fontsSize.lg2,
    fontWeight: '700',
    color: colors.white,
    marginTop: heightPercentageToDP(2),
  },

  text2: {
    textAlign: 'center',
    fontSize: fontsSize.md1,
    fontWeight: '500',
    color: colors.white,
    marginHorizontal: widthPercentageToDP(2),
  },
  videoWrapper: {
    resizeMode: 'stretch',
    left: 0,
    right: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
    position: 'absolute',
  },
  inputWrapper: {
    backgroundColor: 'white',
    borderRadius: 100,
    justifyContent: 'center',
    height: heightPercentageToDP(6),
    width: widthPercentageToDP(68),
  },
  input: {
    paddingHorizontal: widthPercentageToDP(4),
    color: 'black',
  },
  socialWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    alignSelf: 'center',
    marginTop: heightPercentageToDP(3),
    justifyContent: 'space-evenly',
  },
  socialIc: {
    width: widthPercentageToDP(10),
    height: widthPercentageToDP(10),
    backgroundColor: 'white',
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
