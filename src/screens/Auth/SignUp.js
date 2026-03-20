import RNDatePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { heightPercentageToDP } from 'react-native-responsive-screen';
import Toast from 'react-native-toast-message';
import { useDispatch } from "react-redux";
import PrimaryButton from '../../components/Buttons/PrimaryButton';
import Container from '../../components/Container';
import Header from '../../components/Headers/Header';
import Input from '../../components/Input';
import Text from '../../components/Text';
import { resetVerfiy, setUser } from '../../redux/userSlice';

let eregex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/

const Signup = (props) => {

  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [dob, setDOB] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [location, setLocation] = useState("");
  const dispatch = useDispatch();
  const navigation = useNavigation();

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS == 'android' ? null : 'padding'}>
      <Container {...props}>
        <Header onBack={() => {
          dispatch(resetVerfiy());
        }} {...props} />
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: "5%" }}>
            <Text style={{ fontWeight: "bold", fontSize: 22 }} >
              Awesome, let's start with some basics
            </Text>
            <View style={{ flex: 1, gap: heightPercentageToDP(3), marginVertical: 20 }}>
              <Input onChangeText={(text) => { setFname(text) }} placeholder='First Name' leftImage={require("../../assets/images/name.png")} />
              <Input onChangeText={(text) => { setLname(text) }} placeholder='Last Name' leftImage={require("../../assets/images/name.png")} />
              <Input onChangeText={(text) => { setEmail(text) }} placeholder='Your Email Address' leftImage={require("../../assets/images/email.png")} />
              {/* <Input placeholder='Phone Number' leftImage={require("../../assets/images/phone.png")} /> */}
              <Input value={dob ? dob.toDateString() : ""} onPressOut={() => {
                Keyboard.dismiss()
                setShowPicker(true)
              }} placeholder='Date Of Birth' leftImage={require("../../assets/images/DOB.png")} />
              {
                showPicker &&
                <RNDatePicker
                  value={dob ? dob : new Date()}
                  onChange={(event, date) => {
                    if (Platform.OS == 'android')
                      setShowPicker(false)

                    let diff = moment(moment.now()).diff(date.getTime());
                    let years = Math.abs(diff) / 31556952000;
                    if (years >= 18)
                      setDOB(date);
                    else {
                      Toast.show({
                        text1: "Warning",
                        text2: "You must be 18 years of age to continue",
                        type: "error"
                      })
                    }
                  }}
                  onError={() => {
                    setShowPicker(false)
                  }}
                />
              }
              <Input onChangeText={(text) => { setLocation(text) }} placeholder='Location' leftImage={require("../../assets/images/location.png")} />
              <Input onChangeText={(text) => { setPronouns(text) }} placeholder='Pronouns' leftImage={require("../../assets/images/name.png")} />
            </View>
            <PrimaryButton
              text={'Continue'}
              onPress={() => {

                if (fname == '') {
                  Toast.show({
                    text1: "Warning",
                    type: "error",
                    text2: "First name is required"
                  })
                  return;
                }
                if (lname == '') {
                  Toast.show({
                    text1: "Warning",
                    type: "error",
                    text2: "Last name is required"
                  })
                  return;
                }
                if (email == '') {
                  Toast.show({
                    text1: "Warning",
                    type: "error",
                    text2: "Email is required"
                  })
                  return;
                }
                if (!email.match(eregex)) {
                  Toast.show({
                    text1: "Warning",
                    type: "error",
                    text2: "Email is invalid"
                  })
                  return;
                }
                dispatch(setUser({
                  firstName: fname,
                  lastName: lname,
                  dob: dob.toISOString().split("T")[0],
                  address: location,
                  email,
                  pronouns
                }));
                navigation.navigate("OnBoard1")
              }}
            />
          </View>
        </ScrollView>
      </Container>
    </KeyboardAvoidingView>
  )
};

export default Signup;
