import Geolocation from "@react-native-community/geolocation";
import messaging from "@react-native-firebase/messaging";
import { CommonActions } from "@react-navigation/native";
import QB from "quickblox-react-native-sdk";
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from "react-redux";
import PrimaryButton from '../../components/Buttons/PrimaryButton';
import Container from '../../components/Container';
import { DatePicker } from "../../components/DatePicker";
import RadioButton from '../../components/RadioButton';
import Text from '../../components/Text';
import userActions from '../../redux/actions/userActions';
import { setLoader } from '../../redux/globalSlice';
import helper from "../../utils/helper";
import { RangeSliderInput } from "../App/Filter";

const data = [
  { Q: "Are you willing to travel?", options: ["Yes", "No"], selected: "Yes" },
  { Q: "Add Follower range", options: ["range"], selected: "0" },
  { Q: "Add your availability?", options: ["date"], selected: new Date() },
  { Q: "Do you want to show your location?", options: ["Yes", "No"], selected: "Yes" },
]

const OnBoard4 = (props) => {

  const [selectedDates, setSelectedDates] = useState();
  const [values, setValues] = useState(data);
  const userProfile = useSelector(state => state.user.userRegister);
  const dispatch = useDispatch();
  const [Day, setDay] = useState("");
  const [timezone, setTimezone] = useState("");
  const [Year, setYear] = useState("");
  const [From, setFrom] = useState("");
  const [To, setTo] = useState("");

  useEffect(() => {
    Geolocation.setRNConfiguration({
      locationProvider: "auto",
      skipPermissionRequests: false,
      authorizationLevel: "auto"
    })
    Geolocation.requestAuthorization();
    QB.auth.logout();
  }, [])


  const CheckLocation = async () => {
    // if (values[values.length - 1].selected == 'Yes') {
    //   if (Platform.OS == 'android') {
    //     let permissions = await PermissionsAndroid.requestMultiple(["android.permission.ACCESS_FINE_LOCATION", "android.permission.ACCESS_COARSE_LOCATION"]);
    //     if (!permissions["android.permission.ACCESS_COARSE_LOCATION"] && !permissions["android.permission.ACCESS_FINE_LOCATION"]) {
    //       Toast.show({
    //         text1: "Warning",
    //         text2: "Please enable location if you want to show your location",
    //         type: "error"
    //       })
    //       return;
    //     }
    //   }
    //   Geolocation.requestAuthorization(() => {
    //   }, (error) => {
    //     console.warn(error)
    //     Toast.show({
    //       text1: "Warning",
    //       text2: "Please enable location if you want to show your location or select No"
    //     })
    //   });
    //   Geolocation.getCurrentPosition((position) => {
    //     if (position)
    //       CreateAccount({
    //         location: {
    //           coordinates: [
    //             position.coords.latitude + "",
    //             position.coords.longitude + ""
    //           ],
    //           type: "point"
    //         }
    //       })
    //     else {
    //       CreateAccount();
    //     }
    //   }, (error) => {
    //     console.warn(error)
    //   })
    // }
    // else
    CreateAccount();
  }

  const CreateAccount = async (location = null) => {
    dispatch(setLoader(true))
    let random = Math.random() * 1000
    const createUserParams = {
      fullName: userProfile.firstName + " " + userProfile.lastName,
      login: userProfile.email ? userProfile.email : userProfile.firstName + userProfile.lastName + random,
      password: (userProfile.firstName + "12345678!").replace(" ", "")
    };

    try {
      let QBUser;

      await QB.auth.login({
        login: createUserParams.login,
        password: createUserParams.password,
      }).then(async (QBUserExist) => {
        console.warn("EXIST", QBUserExist)
        if (QBUserExist.user && QBUserExist.session.userId) {
          QBUser = QBUserExist.user;
        }
        else {
          QBUser = await QB.users.create(createUserParams);
        }
      }).catch(async (re) => {
        console.warn("NOT EXIST", re, createUserParams)
        QBUser = await QB.users.create(createUserParams);
      })

      let token = await messaging().getToken();


      await dispatch(userActions.UpdateProfile({
        ...userProfile,
        email: userProfile.email ? userProfile.email.replace(" ", "") : "no-mail@comesh.com",
        willingToTravel: values[0].selected == 'Yes',
        showLocation: false,//values[values.length - 1].selected == 'Yes',
        followers: String(values[1].selected),
        // availability: values[2].selected.toISOString(),
        availabilityFrom: `${Day} ${From}`,
        availabilityTo: `${Day} ${To}`,
        isFirstTime: true,
        quickBloxId: QBUser.id,
        quickBloxUsername: QBUser.login,
        quickBloxPassword: createUserParams.password,
        deviceToken: token,
        timeZone: timezone,
        ...location ? location : {},
        callback: (data) => {
          QB.auth.login({
            login: createUserParams.login,
            password: createUserParams.password
          })
          props.navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                { name: 'GestureGuide' },
              ],
            })
          )
        }
      }))

    } catch (error) {
      console.warn(error)
      if (error.message == "login has already been taken")
        Toast.show({
          text1: "Warning",
          text2: "User is already registered",
          type: "error"
        })
    }
    dispatch(setLoader(false))
  }

  const CreateAccountSkip = async () => {
    dispatch(setLoader(true))
    let random = Math.random() * 1000
    const createUserParams = {
      fullName: userProfile.firstName + " " + userProfile.lastName,
      login: userProfile.email ? userProfile.email : userProfile.firstName + userProfile.lastName + random,
      password: (userProfile.firstName + "12345678!").replace(" ", "")
    };

    try {
      let QBUser;

      await QB.auth.login({
        login: createUserParams.login,
        password: createUserParams.password,
      }).then(async (QBUserExist) => {
        console.warn("EXIST", QBUserExist)
        if (QBUserExist.user && QBUserExist.session.userId) {
          QBUser = QBUserExist.user;
        }
        else {
          QBUser = await QB.users.create(createUserParams);
        }
      }).catch(async (re) => {
        console.warn("NOT EXIST", re)
        QBUser = await QB.users.create(createUserParams);
      })

      let token = await messaging().getToken();


      await dispatch(userActions.UpdateProfile({
        ...userProfile,
        deviceToken: token,
        quickBloxId: QBUser.id,
        quickBloxUsername: QBUser.login,
        quickBloxPassword: createUserParams.password,
        isFirstTime: true,
        callback: (data) => {
          props.navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                { name: 'GestureGuide' },
              ],
            })
          )
        }
      }))
    }
    catch (e) {
      console.warn(e)
    }
    dispatch(setLoader(false))
  }


  return (
    <Container
      header
      steps={require("../../assets/images/Steps4.png")}
      {...props}
      onSkip={() => CreateAccountSkip()}
    >
      <ScrollView>
        <View style={{ flex: 1, padding: "5%" }}>
          <Text style={{ fontWeight: "bold", fontSize: 22 }} >
            You’re almost done!
          </Text>
          <View style={{ flex: 1, paddingVertical: '8%', gap: 20 }}>
            {
              values.map((v, i) => (
                <View style={{ gap: 15 }}>
                  <Text style={{ fontWeight: "500", fontSize: 16 }}>Q.{i + 1} {v.Q}</Text>
                  {
                    v.options.map((o) => {
                      if (o == "range")
                        return (
                          <View style={{ margin: 10, marginTop: -20 }}>
                            <RangeSliderInput min={0} max={10000000} valueLabel='Followers' isNotRange={true} label={helper.FollowersPrefix(v.selected) + ' Followers'} handleValueChange={(low, high, byUser) => {
                              if (byUser) {
                                let valuesCopy = [...values];
                                let val = { ...valuesCopy[i] };
                                val.selected = low;
                                valuesCopy.splice(i, 1, val)
                                setValues(valuesCopy)
                              }
                            }} />
                          </View>
                        )
                      if (o == "date")
                        return (
                          <View style={{ backgroundColor: "#fff", borderRadius: 15, overflow: 'hidden', paddingVertical: "5%" }}>
                            {/* {
                            Year && Month && Day ?
                              <Typography>
                                {Year + "-" + Month + "-" + Day + " " + From + " to " + To}
                              </Typography>
                              : null
                          } */}
                            <View style={{ flexDirection: "row", gap: 15, }}>
                              <DatePicker
                                val={Day}
                                label={"Day"}
                                onValueChange={(value) => {
                                  setDay(value)
                                }}
                                multiple
                                options={[{ label: "Monday", value: "Monday" }, { label: "Tuesday", value: "Tuesday" }, { label: "Wednesday", value: "Wednesday" }, { label: "Thursday", value: "Thursday" }, { label: "Friday", value: "Friday" }, { label: "Saturday", value: "Saturday" }, { label: "Sunday", value: "Sunday" }]}
                              // options={[{ label: "01", value: "01" }, { label: "02", value: "02" }, { label: "03", value: "03" }, { label: "04", value: "04" }, { label: "05", value: "05" }, { label: "06", value: "06" }, { label: "07", value: "07" }, { label: "08", value: "08" }, { label: "09", value: "09" }, { label: 10, value: 10 }, { label: 11, value: 11 }, { label: 12, value: 12 }, { label: 13, value: 13 }, { label: 14, value: 14 }, { label: 15, value: 15 }, { label: 16, value: 16 }, { label: 17, value: 17 }, { label: 18, value: 18 }, { label: 19, value: 19 }, { label: 20, value: 20 }, { label: 21, value: 21 }, { label: 22, value: 22 }, { label: 23, value: 23 }, { label: 24, value: 24 }, { label: 25, value: 25 }, { label: 26, value: 26 }, { label: 27, value: 27 }, { label: 28, value: 28 }, { label: 29, value: 29 }, { label: 30, value: 30 }, { label: 31, value: 31 }]}
                              />
                              <DatePicker
                                val={timezone}
                                onValueChange={(value) => {
                                  setTimezone(value[0])
                                }}
                                label={"Timezone"}
                                options={[
                                  { label: "AST", value: "AST" },
                                  { label: "EST", value: "EST" },
                                  { label: "EDT", value: "EDT" },
                                  { label: "CST", value: "CST" },
                                  { label: "CDT", value: "CDT" },
                                  { label: "MST", value: "MST" },
                                  { label: "MDT", value: "MDT" },
                                  { label: "PST", value: "PST" },
                                  { label: "PDT", value: "PDT" },
                                  { label: "AKST", value: "AKST" },
                                  { label: "AKDT", value: "AKDT" },
                                  { label: "HST", value: "HST" },
                                  { label: "HAST", value: "HAST" },
                                  { label: "HADT", value: "HADT" },
                                  { label: "SST", value: "SST" },
                                  { label: "SDT", value: "SDT" },
                                  { label: "CHST", value: "CHST" },
                                ]}
                              />
                              {/* <DatePicker
                                val={Year}
                                onValueChange={(value) => {
                                  setYear(value)
                                }}
                                label={"Year"}
                                options={[
                                  { label: new Date().getFullYear(), value: new Date().getFullYear() + "" },
                                  { label: new Date().getFullYear() + 1, value: (new Date().getFullYear() + 1) + "" },
                                  { label: new Date().getFullYear() + 2, value: (new Date().getFullYear() + 2) + "" },
                                  { label: new Date().getFullYear() + 3, value: (new Date().getFullYear() + 3) + "" },
                                  { label: new Date().getFullYear() + 4, value: (new Date().getFullYear() + 4) + "" },
                                  { label: new Date().getFullYear() + 5, value: (new Date().getFullYear() + 5) + "" },
                                  { label: new Date().getFullYear() + 6, value: (new Date().getFullYear() + 6) + "" },
                                  { label: new Date().getFullYear() + 7, value: (new Date().getFullYear() + 7) + "" },
                                  { label: new Date().getFullYear() + 8, value: (new Date().getFullYear() + 8) + "" },
                                  { label: new Date().getFullYear() + 9, value: (new Date().getFullYear() + 9) + "" },
                                  { label: new Date().getFullYear() + 10, value: (new Date().getFullYear() + 10) + "" },
                                  { label: new Date().getFullYear() + 11, value: (new Date().getFullYear() + 11) + "" },
                                  { label: new Date().getFullYear() + 12, value: (new Date().getFullYear() + 12) + "" },
                                  { label: new Date().getFullYear() + 13, value: (new Date().getFullYear() + 13) + "" },
                                  { label: new Date().getFullYear() + 14, value: (new Date().getFullYear() + 14) + "" },
                                  { label: new Date().getFullYear() + 15, value: (new Date().getFullYear() + 15) + "" },
                                  { label: new Date().getFullYear() + 16, value: (new Date().getFullYear() + 16) + "" },
                                  { label: new Date().getFullYear() + 17, value: (new Date().getFullYear() + 17) + "" },
                                  { label: new Date().getFullYear() + 18, value: (new Date().getFullYear() + 18) + "" },
                                  { label: new Date().getFullYear() + 19, value: (new Date().getFullYear() + 19) + "" },
                                  { label: new Date().getFullYear() + 20, value: (new Date().getFullYear() + 20) + "" },
                                  { label: new Date().getFullYear() + 21, value: (new Date().getFullYear() + 21) + "" },
                                  { label: new Date().getFullYear() + 22, value: (new Date().getFullYear() + 22) + "" },
                                  { label: new Date().getFullYear() + 23, value: (new Date().getFullYear() + 23) + "" },
                                  { label: new Date().getFullYear() + 24, value: (new Date().getFullYear() + 24) + "" },
                                  { label: new Date().getFullYear() + 25, value: (new Date().getFullYear() + 25) + "" },
                                  { label: new Date().getFullYear() + 26, value: (new Date().getFullYear() + 26) + "" },
                                ]}
                              /> */}
                            </View>
                            <View style={{ flexDirection: "row", gap: 15, marginTop: 15 }}>
                              <DatePicker
                                onValueChange={(value) => {
                                  setFrom(value)
                                }}
                                label={"From (Hours)"}
                                options={[
                                  { label: "12:00 AM", value: "12:00 AM" },
                                  { label: "1:00 AM", value: "1:00 AM" },
                                  { label: "2:00 AM", value: "2:00 AM" },
                                  { label: "3:00 AM", value: "3:00 AM" },
                                  { label: "4:00 AM", value: "4:00 AM" },
                                  { label: "5:00 AM", value: "5:00 AM" },
                                  { label: "6:00 AM", value: "6:00 AM" },
                                  { label: "7:00 AM", value: "7:00 AM" },
                                  { label: "8:00 AM", value: "8:00 AM" },
                                  { label: "9:00 AM", value: "9:00 AM" },
                                  { label: "10:00 AM", value: "10:00 AM" },
                                  { label: "11:00 AM", value: "11:00 AM" },
                                  { label: "12:00 PM", value: "12:00 PM" },
                                  { label: "13:00 PM", value: "13:00 PM" },
                                  { label: "14:00 PM", value: "14:00 PM" },
                                  { label: "15:00 PM", value: "15:00 PM" },
                                  { label: "16:00 PM", value: "16:00 PM" },
                                  { label: "17:00 PM", value: "17:00 PM" },
                                  { label: "18:00 PM", value: "18:00 PM" },
                                  { label: "19:00 PM", value: "19:00 PM" },
                                  { label: "20:00 PM", value: "20:00 PM" },
                                  { label: "21:00 PM", value: "21:00 PM" },
                                  { label: "22:00 PM", value: "22:00 PM" },
                                  { label: "23:00 PM", value: "23:00 PM" }
                                ]}
                              />
                              <DatePicker
                                onValueChange={(value) => {
                                  setTo(value)
                                }}
                                label={"To (Hours)"}
                                options={[
                                  { label: "12:00 AM", value: "12:00 AM" },
                                  { label: "1:00 AM", value: "1:00 AM" },
                                  { label: "2:00 AM", value: "2:00 AM" },
                                  { label: "3:00 AM", value: "3:00 AM" },
                                  { label: "4:00 AM", value: "4:00 AM" },
                                  { label: "5:00 AM", value: "5:00 AM" },
                                  { label: "6:00 AM", value: "6:00 AM" },
                                  { label: "7:00 AM", value: "7:00 AM" },
                                  { label: "8:00 AM", value: "8:00 AM" },
                                  { label: "9:00 AM", value: "9:00 AM" },
                                  { label: "10:00 AM", value: "10:00 AM" },
                                  { label: "11:00 AM", value: "11:00 AM" },
                                  { label: "12:00 PM", value: "12:00 PM" },
                                  { label: "13:00 PM", value: "13:00 PM" },
                                  { label: "14:00 PM", value: "14:00 PM" },
                                  { label: "15:00 PM", value: "15:00 PM" },
                                  { label: "16:00 PM", value: "16:00 PM" },
                                  { label: "17:00 PM", value: "17:00 PM" },
                                  { label: "18:00 PM", value: "18:00 PM" },
                                  { label: "19:00 PM", value: "19:00 PM" },
                                  { label: "20:00 PM", value: "20:00 PM" },
                                  { label: "21:00 PM", value: "21:00 PM" },
                                  { label: "22:00 PM", value: "22:00 PM" },
                                  { label: "23:00 PM", value: "23:00 PM" }
                                ]}
                              />
                            </View>
                            {/* <Calendar
                            theme={{
                              arrowColor: "#ddd",
                              monthTextColor: "#000",
                              textMonthFontSize: 20,
                              textMonthFontWeight: "500",
                              textSectionTitleColor: colors.accent,
                              todayTextColor: colors.accent,
                            }}
                            onDayPress={(date) => {
                              if (date.timestamp <= moment.now()) {
                                Toast.show({
                                  text1: "Warning",
                                  text2: "Please select future date",
                                  type: "error"
                                })
                                return;
                              }
                              let valuesCopy = [...values];
                              let val = { ...valuesCopy[i] };
                              val.selected = new Date(date.dateString);
                              valuesCopy.splice(i, 1, val)
                              setValues(valuesCopy)
                              setSelectedDates(date.dateString)
                            }}
                            markedDates={{
                              [selectedDates]: {
                                selected: true,
                                selectedColor: "#4A1BFF",
                                selectedTextColor: "#fff"
                              }
                            }}
                          /> */}
                          </View>
                          // <View style={{ marginTop: 10, backgroundColor: "#fff", elevation: 5, shadowColor: "#999", borderRadius: 15, overflow: 'hidden', paddingVertical: "5%" }}>
                          //   <Calendar
                          //     theme={{
                          //       arrowColor: "#ddd",
                          //       monthTextColor: "#000",
                          //       textMonthFontSize: 20,
                          //       textMonthFontWeight: "500",
                          //       textSectionTitleColor: colors.accent,
                          //       todayTextColor: colors.accent,
                          //     }}
                          //     onDayPress={(date) => {
                          //       if (date.timestamp <= moment.now()) {
                          //         Toast.show({
                          //           text1: "Warning",
                          //           text2: "Please select future date",
                          //           type: "error"
                          //         })
                          //         return;
                          //       }
                          //       let valuesCopy = [...values];
                          //       let val = { ...valuesCopy[i] };
                          //       val.selected = new Date(date.dateString);
                          //       valuesCopy.splice(i, 1, val)
                          //       setValues(valuesCopy)
                          //       setSelectedDates(date.dateString)
                          //     }}
                          //     markedDates={{
                          //       [selectedDates]: {
                          //         selected: true,
                          //         selectedColor: "#4A1BFF",
                          //         selectedTextColor: "#fff"
                          //       }
                          //     }}
                          //   />
                          // </View>
                        )
                      return (
                        <RadioButton label={o} checked={v.selected == o} onPress={(va) => {
                          let valuesCopy = [...values];
                          let val = { ...valuesCopy[i] };
                          val.selected = o;
                          valuesCopy.splice(i, 1, val)
                          setValues(valuesCopy)
                        }} />
                      )
                    })
                  }
                </View>
              ))
            }
          </View>
          <PrimaryButton
            text={'Create Account'}
            onPress={() => {
              CheckLocation()
            }}
          />
        </View>
      </ScrollView>
    </Container>
  )
};

export default OnBoard4;
