import RNDatePicker from "@react-native-community/datetimepicker";
import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import React, { useMemo, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text as RNText, TouchableOpacity, View } from 'react-native';
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

const minBirthDate = new Date(1900, 0, 1);
const maxBirthDate = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d;
})();

const Signup = (props) => {

  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [dob, setDOB] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [iosDraftDate, setIosDraftDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 25);
    return d;
  });
  const [location, setLocation] = useState("");
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const applyDobIfAdult = (date) => {
    if (!date) return;
    const years = moment().diff(moment(date), "years", true);
    if (years >= 18) {
      setDOB(date);
    } else {
      Toast.show({
        text1: "Warning",
        text2: "You must be 18 years of age to continue",
        type: "error",
      });
    }
  };

  const pickerValue = useMemo(() => dob ?? maxBirthDate, [dob]);

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
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  Keyboard.dismiss();
                  setIosDraftDate(dob ?? maxBirthDate);
                  setShowPicker(true);
                }}>
                <View pointerEvents="none">
                  <Input
                    value={dob ? moment(dob).format("DD-MMM-YYYY") : ""}
                    editable={false}
                    placeholder="Date Of Birth"
                    leftImage={require("../../assets/images/DOB.png")}
                  />
                </View>
              </TouchableOpacity>
              {Platform.OS === "android" && showPicker ? (
                <RNDatePicker
                  value={pickerValue}
                  mode="date"
                  display="default"
                  minimumDate={minBirthDate}
                  maximumDate={maxBirthDate}
                  onChange={(event, date) => {
                    setShowPicker(false);
                    if (event.type === "dismissed" || !date) return;
                    applyDobIfAdult(date);
                  }}
                />
              ) : null}
              {Platform.OS === "ios" ? (
                <Modal transparent animationType="slide" visible={showPicker} onRequestClose={() => setShowPicker(false)}>
                  <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }} onPress={() => setShowPicker(false)}>
                    <Pressable style={{ backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 28 }} onPress={(e) => e.stopPropagation()}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee" }}>
                        <TouchableOpacity onPress={() => setShowPicker(false)}>
                          <RNText style={{ fontSize: 17, color: "#007AFF" }}>Cancel</RNText>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            applyDobIfAdult(iosDraftDate);
                            setShowPicker(false);
                          }}>
                          <RNText style={{ fontSize: 17, fontWeight: "600", color: "#007AFF" }}>Done</RNText>
                        </TouchableOpacity>
                      </View>
                      <RNDatePicker
                        value={iosDraftDate}
                        mode="date"
                        display="spinner"
                        themeVariant="light"
                        minimumDate={minBirthDate}
                        maximumDate={maxBirthDate}
                        onChange={(_, date) => {
                          if (date) setIosDraftDate(date);
                        }}
                      />
                    </Pressable>
                  </Pressable>
                </Modal>
              ) : null}
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
                if (!dob) {
                  Toast.show({
                    text1: "Warning",
                    type: "error",
                    text2: "Please select your date of birth"
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
                navigation.navigate('OnBoard1');
              }}
            />
          </View>
        </ScrollView>
      </Container>
    </KeyboardAvoidingView>
  )
};

export default Signup;
