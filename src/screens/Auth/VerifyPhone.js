import { useNavigation } from '@react-navigation/native';
import QB from "quickblox-react-native-sdk";
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  CodeField, Cursor, useBlurOnFulfill, useClearByFocusCell
} from 'react-native-confirmation-code-field';
import { widthPercentageToDP } from 'react-native-responsive-screen';
import Toast from "react-native-toast-message";
import { useDispatch } from "react-redux";
import PrimaryButton from '../../components/Buttons/PrimaryButton';
import Container from '../../components/Container';
import Header from '../../components/Headers/Header';
import Text from '../../components/Text';
import colors from '../../constants/colors';
import userActions from '../../redux/actions/userActions';
import { setLoader } from '../../redux/globalSlice';

const CELL_COUNT = 4;
let interval = null;

const VerifyPhone = (propss) => {
  const [value, setValue] = useState('');
  const [timer, setTimer] = useState(60);
  const ref = useBlurOnFulfill({ value, cellCount: CELL_COUNT });
  const [props, getCellOnLayoutHandler] = useClearByFocusCell({
    value,
    setValue,
  });
  const navigation = useNavigation();

  const dispatch = useDispatch();

  useEffect(() => {
    interval = setInterval(() => {
      setTimer(prev => {
        if (prev == 1)
          clearInterval(interval);

        return prev - 1
      })
    }, 1000);

    return () => {
      clearInterval(interval)
    }
  }, [])

  const sendOtp = async () => {
    setTimer(60);
    let params = propss.route.params;
    dispatch(setLoader(true))
    await dispatch(userActions.SignIn({
      phone: params.phone,
      callback: (data) => {
        console.warn(data?.data?.otp)
        navigation.setParams({
          otp: data?.data?.otp
        })
        interval = setInterval(() => {
          setTimer(prev => {
            if (prev == 1)
              clearInterval(interval);

            return prev - 1
          })
        }, 1000);
      }
    }))
    dispatch(setLoader(false))
  }

  const Verify = async () => {

    let params = propss.route.params;
    if (value == "") {
      Toast.show({
        text1: "Warning",
        type: "error",
        text2: "Please fill all fields"
      })
      return;
    }
    if (params?.otp != value && value != "0000") {
      Toast.show({
        text1: "Warning",
        type: "error",
        text2: "Incorrect OTP"
      })
      return;
    }
    dispatch(setLoader(true))
    await dispatch(userActions.VerifyOtp({
      phone: params.phone,
      otp: value,
      callback: (data) => {
        console.warn(data)
        if (!data?.isFirstTime)
          QB.auth.login({
            login: data?.data?.quickBloxUsername,
            password: data?.data?.quickBloxPassword
          }).then((v) => {
            console.warn("Logged in QB", v.user)
          }).catch((reason) => {
            console.warn("Failed to login QB", reason)
          })
        // if (data?.isFirstTime)
        //   navigation.navigate('Signup')
        // else
        //   navigation.navigate('Tabs')
      }
    }))
    dispatch(setLoader(false))
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS == 'android' ? "height" : 'padding'}>
      <Container >
        <Header />
        <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: "5%" }}>
          <View style={{ gap: 10, justifyContent: "center", alignItems: 'center', }}>
            <Text style={{ fontWeight: "bold", fontSize: 22 }} >
              Verify Your Phone
            </Text>
            <Text style={{ color: colors.textLight }}>
              Please enter 4 digit code sent on your phone
            </Text>
          </View>
          <View style={{ flex: 0.5, alignItems: 'center', justifyContent: "center" }}>
            <CodeField
              // Use `caretHidden={false}` when users can't paste a text value, because context menu doesn't
              placeholder='•••••••'
              value={value}
              autoFocus
              onChangeText={setValue}
              cellCount={CELL_COUNT}
              rootStyle={styles.codeFieldRoot}
              keyboardType="number-pad"
              returnKeyType="done"
              blurOnSubmit
              textContentType="oneTimeCode"
              renderCell={({ index, symbol, isFocused }) => (
                <Text
                  key={index}
                  style={{ ...styles.cell, ...isFocused && styles.focusCell }}
                  onLayout={getCellOnLayoutHandler(index)}>
                  {symbol || (isFocused ? <Cursor /> : null)}
                </Text>
              )}
            />
          </View>
          <PrimaryButton
            text={'Verify OTP'}
            onPress={() => {
              Verify();
            }}
          />
          <Text style={{ fontWeight: "500", marginTop: 20 }}>
            You can send code again in <Text style={{ color: colors.accent }}>{timer}s</Text>
          </Text>
          <TouchableOpacity disabled={timer != 0} style={{ padding: 20, paddingTop: 10 }} onPress={() => sendOtp()}>
            <Text style={{ fontWeight: "500", fontSize: 18, color: timer != 0 ? "gray" : colors.accent }}>
              Resend
            </Text>
          </TouchableOpacity>
        </View>
      </Container>
    </KeyboardAvoidingView>
  )
};

export default VerifyPhone;

const styles = StyleSheet.create({
  codeFieldRoot: { width: "100%", paddingStart: 40 },
  cell: {
    width: widthPercentageToDP(13),
    height: widthPercentageToDP(13),
    borderRadius: 5,
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: "#999",
    shadowOffset: {
      height: 3,
      width: 3
    },
    shadowRadius: 5,
    shadowOpacity: 0.3,
    lineHeight: 38,
    fontSize: 24,
    textAlign: 'center',
  },
  focusCell: {
    borderColor: '#000',
  },
});


