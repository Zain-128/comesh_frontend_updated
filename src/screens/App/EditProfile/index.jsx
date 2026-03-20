import RNDatePicker from "@react-native-community/datetimepicker";
import moment from "moment";
import React, { useEffect, useState } from 'react';
import {
  Image,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import * as Progress from 'react-native-progress';
import {
  heightPercentageToDP, widthPercentageToDP
} from 'react-native-responsive-screen';
import Toast from 'react-native-toast-message';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Video from "react-native-video";
import { useDispatch, useSelector } from 'react-redux';
import PrimaryButton from '../../../components/Buttons/PrimaryButton';
import { DatePicker } from "../../../components/DatePicker";
import Input from '../../../components/Input';
import RadioButton from '../../../components/RadioButton';
import { SelectPicker } from "../../../components/SelectPicket";
import { Typography } from '../../../components/Typography';
import { AppContainer } from '../../../components/layouts/AppContainer';
import colors from "../../../constants/colors";
import { IMAGES } from "../../../constants/images";
import userActions from '../../../redux/actions/userActions';
import { setLoader } from '../../../redux/globalSlice';
import helper from "../../../utils/helper";
import { RangeSliderInput } from "../../App/Filter";
import Header from './Header';

const data = [
  { Q: "Are you a full time content creator, or just for fun?", options: ["Fulltime content creator", "Just for fun"], selected: "Fulltime content creator" },
  { Q: "Select which applies?", options: ["Live streamer", "Video Creator", "Both"], selected: "Live streamer" },
  { Q: "How often do you make content?", options: ["1-2 days/weekly", "3-4 days/weekly", "Randomly just for fun"], selected: "1-2 days/weekly" },
]


const EditProfile = props => {

  const [questions, setQuestions] = useState(data);
  const { userData } = useSelector(state => state.user)
  const [fname, setFname] = useState(userData?.firstName);
  const [lname, setLname] = useState(userData?.lastName);
  const [email, setEmail] = useState(userData?.email);
  const [dob, setDOB] = useState(userData?.dob ? new Date(userData?.dob) : new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [location, setLocation] = useState(userData?.address);
  const [about, setAbout] = useState(userData?.description);
  const [social, setSocial] = useState(userData?.socialMediaProfiles);
  const [value, setValue] = useState(userData?.niche);
  // const [selectedDates, setSelectedDates] = useState(new Date(userData?.availability).toISOString().split("T")[0]);
  //const [Day, setDay] = useState(userData?.availabilityFrom ? [userData.availabilityFrom.split(" ")[0].split("-")[userData.availabilityFrom.split("T")[0].split("-").length - 1].trim()] : "");
  const [Day, setDay] = useState(userData?.availabilityFrom ? userData?.availabilityFrom.split(" ")[0].split(",") : "");
  const [timezone, setTimezone] = useState(userData?.timeZone ? [userData?.timeZone] : "");
  // const [Month, setMonth] = useState(userData?.availabilityFrom ? [userData.availabilityFrom.split(" ")[0].split("-")[userData.availabilityFrom.split("T")[0].split("-").length - 2].trim()] : "");
  // const [Year, setYear] = useState(userData?.availabilityFrom ? [userData.availabilityFrom.split(" ")[0].split("-")[userData.availabilityFrom.split("T")[0].split("-").length - 3].trim()] : "");
  // const [From, setFrom] = useState(userData?.availabilityFrom ? [userData.availabilityFrom.split(" ")[1] + " " + userData.availabilityFrom.split(" ")[2]] : "");
  // const [To, setTo] = useState(userData?.availabilityTo ? [userData.availabilityTo.split(" ")[1] + " " + userData.availabilityTo.split(" ")[2]] : "");
  const [From, setFrom] = useState(userData?.availabilityFrom ? [userData?.availabilityFrom.split(" ")[1] + " " + userData?.availabilityFrom.split(" ")[2]] : "");
  const [To, setTo] = useState(userData?.availabilityTo ? [userData?.availabilityTo.split(" ")[1] + " " + userData?.availabilityTo.split(" ")[2]] : "");
  const [values, setValues] = useState([
    { Q: "Are you willing to travel?", options: ["Yes", "No"], selected: userData?.willingToTravel ? "Yes" : "No" },
    { Q: "Add Follower range", options: ["range"], selected: userData?.followers + "" },
    { Q: "Add your availability?", options: ["date"], selected: new Date(userData?.availability) },
  ]);
  const [prevMedia, setPrevMedia] = useState(userData?.videos ? userData?.videos.map(v => ({ uri: v.url })) : null);
  const [media, setMedia] = useState([]);
  const [profile_pic, setProfilePic] = useState({
    uri: userData?.profileVideo
  });
  const [progress, setProgress] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progressMedia, setProgressMedia] = useState(null);

  const dispatch = useDispatch();


  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    let newData = data.map((v) => {
      let q = userData?.questionAndAnswers.find(f => f.question == v.Q);
      return {
        ...v,
        selected: q ? q.question == v.Q ? q.answer : v.selected : v.selected
      }
    })
    setQuestions(newData)
  }, [])

  const UpdateAccount = async (videos = []) => {
    dispatch(setLoader(true))
    try {
      await dispatch(userActions.UpdateProfile({
        firstName: fname,
        lastName: lname,
        dob: dob.toISOString().split("T")[0],
        address: location,
        email,
        niche: value,
        description: about,
        socialMediaProfiles: social,
        questionAndAnswers: questions.map((v) => ({
          question: v.Q,
          answer: v.selected
        })),
        willingToTravel: values[0].selected == 'Yes',
        showLocation: values[values.length - 1].selected == 'Yes',
        followers: values[1].selected + "",
        availabilityFrom: `${Day} ${From}`,//values[2].selected.toISOString().split("T")[0],
        availabilityTo: `${Day} ${To}`,//values[2].selected.toISOString().split("T")[0],
        previousVideos: JSON.stringify(videos),
        ...!videos?.length ? { emptyVideos: true } : null,
        callback: (data) => {
          if (data.success) {
            Toast.show({
              text1: "Success",
              text2: "You profile has been updated",
              type: "success"
            })
            props.navigation.goBack();
          }
        },
        onProgress: (ev) => {
          console.warn(ev)
        }
      }))
    } catch (error) {

    }

    dispatch(setLoader(false))
  }

  const SelectVideo = () => {
    // Alert.alert("Select", "Please select an option", [
    //   {
    //     text: "Camera",
    //     onPress: () => {
    //       launchCamera({
    //         mediaType: "video",
    //         quality: 0.7,
    //         videoQuality: "medium",
    //       }, (response) => {
    //         if (!response.didCancel && !response.errorMessage) {
    //           let video = response.assets[0];
    //           setMedia([...media, video]);
    //         }
    //       })
    //     }
    //   }, {
    //     text: "Library",
    //     onPress: () => {
    if (media.length == 5) {
      Toast.show({
        text1: "Warning",
        text2: "Media must contain 5 videos",
        type: "error"
      })
      return;
    }
    launchImageLibrary({
      mediaType: "video",
      videoQuality: "medium",
      selectionLimit: 5
    }, (response) => {
      if (!response.didCancel && !response.errorMessage) {
        let video = response.assets[0];
        setMedia([...media, {
          name: video.fileName,
          size: video.fileSize,
          type: video.type,
          uri: video.uri,
        }]);
      }
    })
    //     }
    //   }
    // ])

  }

  const SelectProfileVideo = () => {
    // Alert.alert("Select", "Please select an option", [
    //   {
    //     text: "Camera",
    //     onPress: () => {
    //       launchCamera({
    //         mediaType: "video",
    //         quality: 0.7,
    //         videoQuality: "medium",
    //       }, (response) => {
    //         if (!response.didCancel && !response.errorMessage) {
    //           let video = response.assets[0];
    //           setProfilePic(video);
    //         }
    //       })
    //     }
    //   }, {
    //     text: "Library",
    //     onPress: () => {
    launchImageLibrary({
      mediaType: "video",
      quality: 0.7,
      videoQuality: "medium",
      selectionLimit: 1
    }, (response) => {
      if (!response.didCancel && !response.errorMessage) {
        let video = response.assets[0];
        if (video.duration > 30) {
          Toast.show({
            text1: "Warning",
            text2: "Profile Video must not exceeds limit of 30 seconds",
            type: "error"
          })
        }
        else {
          setProfilePic(video);
          UploadVideo({
            name: video.fileName,
            size: video.fileSize,
            type: video.type,
            uri: video.uri,
          })
        }
      }
    })
    //     }
    //   }
    // ])

  }

  const UploadVideo = async (video) => {
    await dispatch(userActions.UploadVideo({
      video,
      redirect: true,
      onProgress: (pe) => {
        setTimeout(() => {
          setProgress(pe)
        }, 1000)
      },
      callback: (data) => {
        let res = JSON.parse(data);
        console.warn("RESULT OF PROFILE VIDEO", res)
        if (res.success) {
          setProgress(null)
          Toast.show({
            text1: "Success",
            text2: "Profile Video has been channged",
            type: "success"
          })
        }
      }
    }))
  }

  const UploadAndUpdate = async () => {
    setUploading(true)
    await dispatch(userActions.UploadProfileMedia({
      prevMedia: prevMedia ? prevMedia.map((v) => ({ url: v.uri })) : null,
      video: media,
      onProgress: (pe) => {
        setTimeout(() => {
          setProgressMedia(pe.sent / pe.total)
        }, 1000)
      },
      callback: (data) => {
        let res = JSON.parse(data);
        if (res.success) {
          setUploading(false)
          setProgress(null)
          UpdateAccount(res?.data?.videos);
        }
        else {
          Toast.show({
            text1: "Error",
            text2: res.message,
            type: "error"
          })
        }
      }
    }))

  }


  return (
    <AppContainer>
      <ScrollView style={{ flex: 1 }}>
        <Header {...props} />
        <TouchableOpacity onPress={() => SelectProfileVideo()} style={{ height: heightPercentageToDP(40) }}>
          <Video paused={false} source={profile_pic?.uri ? { uri: profile_pic?.uri } : IMAGES.men} resizeMode={'cover'} style={{ flex: 1, width: '100%', resizeMode: 'cover', backgroundColor: "#000" }} />
          <View style={styles.notchView} />
          <TouchableOpacity
            activeOpacity={1}
            style={{ position: "absolute", top: 0, right: 10 }}
            onPress={() => SelectProfileVideo()}>
            <Image
              source={IMAGES.editCircle}
              style={{
                width: 50,
                height: 100,
              }}
            />
          </TouchableOpacity>
          {
            progress &&
            <View style={{ gap: 10, position: "absolute", alignSelf: 'center', left: 0, right: 0, top: 0, bottom: 0, justifyContent: "center", alignItems: 'center', backgroundColor: "rgba(0,0,0,0.6)" }}>
              <Typography children={'Uploading'} color="#fff" size={20} textType="semiBold" />
              <Progress.Bar height={10} width={widthPercentageToDP(90)} color={colors.primary} progress={(progress.sent / progress.total * 100) / 100} />
            </View>
          }
        </TouchableOpacity>
        <View style={{ flex: 1, padding: "5%", paddingTop: 0 }}>
          <View style={{ flex: 1, gap: heightPercentageToDP(3), marginVertical: 20 }}>
            <Typography children={'Personal Information'} textType='bold' size={17} />
            <Input value={fname} onChangeText={(text) => { setFname(text) }} placeholder='First Name' leftImage={require("../../../assets/images/name.png")} />
            <Input value={lname} onChangeText={(text) => { setLname(text) }} placeholder='Last Name' leftImage={require("../../../assets/images/name.png")} />
            <Input value={email} onChangeText={(text) => { setEmail(text) }} placeholder='Your Email Address' leftImage={require("../../../assets/images/email.png")} />
            {/* <Input value={} placeholder='Phone Number' leftImage={require("../../assets/images/phone.png")} /> */}
            <Input value={dob.toDateString()} onPressOut={() => {
              Keyboard.dismiss()
              setShowPicker(true)
            }} placeholder='Date Of Birth' leftImage={require("../../../assets/images/DOB.png")} />
            {
              showPicker &&
              <RNDatePicker
                value={dob ? dob : new Date()}
                onChange={(event, date) => {
                  if (Platform.OS == "android")
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
            <Input
              value={location}
              onChangeText={(text) => { setLocation(text) }}
              placeholder='Location'
              leftImage={require("../../../assets/images/location.png")}
            // onFocus={() => {
            //   Keyboard.dismiss();
            //   props.navigation.navigate("Maps")
            // }} 
            />
            <Typography children={'About Me'} textType='bold' size={17} />
            <Input multiline value={about} onChangeText={(text) => { setAbout(text) }} placeholder='About' height={heightPercentageToDP(20)} />
            <Typography children={'Media'} textType='bold' size={17} />
            <ScrollView
              horizontal
              contentContainerStyle={{ gap: 20 }}
            >
              {
                prevMedia.map((m, i) => {
                  return (
                    <View style={{ paddingTop: 10 }}>
                      <Video
                        source={{ uri: m.uri }}
                        paused
                        controls
                        style={{
                          borderRadius: 20,
                          width: widthPercentageToDP(60),
                          height: widthPercentageToDP(60) / 1.5,
                          borderColor: "#ddd",
                          borderWidth: 1
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => {
                          let mm = [...prevMedia];
                          mm.splice(i, 1);
                          setPrevMedia(mm)
                        }}
                        style={{ width: 25, height: 25, justifyContent: "center", alignItems: 'center', backgroundColor: "red", position: "absolute", top: 0, right: -5, borderRadius: 100, zIndex: 1111111 }}>
                        <MaterialCommunityIcons name='minus' size={20} color='#fff' />
                      </TouchableOpacity>
                    </View>
                  )
                })
              }
              {
                media.map((m, i) => {
                  return (
                    <View style={{ paddingTop: 10 }}>
                      <Video
                        source={{ uri: m.uri }}
                        paused
                        controls
                        style={{
                          borderRadius: 20,
                          width: widthPercentageToDP(60),
                          height: widthPercentageToDP(60) / 1.5,
                          borderColor: "#ddd",
                          borderWidth: 1
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => {
                          let mm = [...media];
                          mm.splice(i, 1);
                          setMedia(mm)
                        }}
                        style={{ width: 25, height: 25, justifyContent: "center", alignItems: 'center', backgroundColor: "red", position: "absolute", top: 0, right: -5, borderRadius: 100, zIndex: 1111111 }}>
                        <MaterialCommunityIcons name='minus' size={20} color='#fff' />
                      </TouchableOpacity>
                    </View>
                  )
                })
              }
              <TouchableOpacity style={{ padding: 10 }} onPress={SelectVideo}>
                <View style={{
                  gap: 12,
                  width: widthPercentageToDP(60),
                  height: widthPercentageToDP(60) / 1.5,
                  justifyContent: "center",
                  alignItems: 'center',
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderStyle: "dashed",
                  padding: 10,
                  borderRadius: 20
                }}>
                  <Image source={require("../../../assets/images/video.png")} style={{ width: 40, height: 40 }} />
                  <Typography textType="semiBold" size={16}>
                    Upload Video
                  </Typography>
                </View>
              </TouchableOpacity>
            </ScrollView>
            <Typography children={'Social Media Profiles'} textType='bold' size={17} />
            <Input value={social.facebook} onChangeText={(text) => { setSocial(prev => ({ ...prev, facebook: text })) }} placeholder='Facebook' leftImage={require("../../../assets/images/fb.png")} />
            <Input value={social.twitter} onChangeText={(text) => { setSocial(prev => ({ ...prev, twitter: text })) }} placeholder='Twitter' leftImage={require("../../../assets/images/twitter.png")} />
            <Input value={social.instagram} onChangeText={(text) => { setSocial(prev => ({ ...prev, instagram: text })) }} placeholder='Instagram' leftImage={require("../../../assets/images/instagram.png")} />
            <Input value={social.youtube} onChangeText={(text) => { setSocial(prev => ({ ...prev, youtube: text })) }} placeholder='Youtube' leftImage={require("../../../assets/images/youtube.png")} />
            <Input value={social.tiktok} onChangeText={(text) => { setSocial(prev => ({ ...prev, tiktok: text })) }} placeholder='Tiktok' leftImage={require("../../../assets/images/tiktok.png")} />
            <Typography children={'Other Information'} textType='bold' size={17} />
            {
              questions.map((v, i) => (
                <View style={{ gap: 12, marginHorizontal: '3%' }}>
                  <Typography textType='semiBold' children={`Q.${i + 1} ${v.Q}`} />
                  {
                    v.options.map((o) => (
                      <RadioButton label={o} checked={v.selected == o} onPress={(val) => {
                        let questionsCopy = [...questions];
                        let question = { ...questionsCopy[i] };
                        question.selected = o;
                        questionsCopy.splice(i, 1, question)
                        setQuestions(questionsCopy)
                      }} />
                    ))
                  }
                </View>
              ))
            }
            <Typography children={'Please select your niche?'} textType='semiBold' />
            <SelectPicker
              //val={filter && filter?.questionAndAnswers ? filter.questionAndAnswers.find(q => q.question == 'How often do you make content?').answer : null}
              options={[
                { label: "Fake relationship", value: "Fake relationship" },
                { label: "Friendly fun videos", value: "Friendly fun videos" },
                { label: "TikTok battle collab", value: "TikTok battle collab" },
                { label: "Couple collab", value: "Couple collab" },
                { label: "Fashion", value: "Fashion" },
                { label: "Comedian", value: "Comedian" },
                { label: "Chef", value: "Chef" },
                { label: "Craft/DIY", value: "Craft/DIY" },
                { label: "GYM", value: "GYM" },
                { label: "ART", value: "ART" },
                { label: "Music", value: "Music" },
                { label: "Sports", value: "Sports" },
                { label: "Gaming", value: "Gaming" },
                { label: "Beauty", value: "Beauty" },
                { label: "Truck driver", value: "Truck driver" },
                { label: "Pet", value: "Pet" },
                { label: "Fishing", value: "Fishing" },
                { label: "Van life", value: "Van life" },
                { label: "Other", value: "Other" },
              ]}
              multiple
              val={value}
              onValueChange={(value) => {
                setValue(value)
              }}
            />
            {/* <DropDownPicker
              closeOnBackPressed={true}
              badgeDotColors={colors.primary}
              open={open}
              value={value}
              items={items}
              setOpen={setOpen}
              setValue={setValue}
              setItems={setItems}
              disableBorderRadius
              multiple
              containerStyle={{
                zIndex: 1111111111,
              }}
              style={{
                backgroundColor: "#fff",
                borderRadius: 50,
                elevation: 5,
                shadowColor: "#999",
                shadowOpacity: 0.4,
                shadowRadius: 5,
                shadowOffset: {
                  width: 3,
                  height: 3
                },
                borderWidth: 0,
              }}
              dropDownContainerStyle={{
                backgroundColor: "white",
                elevation: 5,
                shadowColor: "#999",
                shadowOpacity: 0.4,
                shadowRadius: 5,
                shadowOffset: {
                  width: 3,
                  height: 3
                },
                borderWidth: 0,
              }}
            /> */}

            {/* </View> */}
            {
              values.map((v, i) => (
                <View style={{ gap: 15 }}>
                  <Typography textType='semiBold' children={`Q.${i + 1} ${v.Q}`} />
                  {
                    v.options.map((o) => {
                      if (o == "range")
                        return (
                          <View style={{ margin: 10, marginTop: -20 }}>
                            <RangeSliderInput min={0} max={10000000} val={v.selected} valueLabel='Followers' isNotRange={true} label={helper.FollowersPrefix(v.selected) + ' Followers'} handleValueChange={(low, high, byUser) => {
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
                                  setDay(value.join(","))
                                }}
                                multiple
                                options={[{ label: "Monday", value: "Monday" }, { label: "Tuesday", value: "Tuesday" }, { label: "Wednesday", value: "Wednesday" }, { label: "Thursday", value: "Thursday" }, { label: "Friday", value: "Friday" }, { label: "Saturday", value: "Saturday" }, { label: "Sunday", value: "Sunday" }]}
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
                                val={Month}
                                onValueChange={(value) => {
                                  setMonth(value)
                                }}
                                label={"Month"}
                                options={[{ label: "January", value: "01" }, { label: "February", value: "02" }, { label: "March", value: "03" }, { label: "April", value: "04" }, { label: "May", value: "05" }, { label: "June", value: "06" }, { label: "July", value: "07" }, { label: "August", value: "08" }, { label: "September", value: "09" }, { label: "October", value: 10 }, { label: "November", value: 11 }, { label: "December", value: 12 }]}
                              />
                              <DatePicker
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
                                val={From}
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
                                val={To}
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
            {/* {
              open &&
              <TouchableOpacity
                activeOpacity={0.95}
                onPress={() => setOpen(false)}
                style={{ ...StyleSheet.absoluteFill, left: "-10%", right: "-10%", backgroundColor: "rgba(0,0,0,0.3)" }} />
            } */}
            <PrimaryButton
              text={'Update & Save'}
              onPress={() => {
                if (media.length > 0)
                  UploadAndUpdate();
                else
                  UpdateAccount(prevMedia.map(v => ({ url: v.uri })));
              }}
              style={{ marginTop: heightPercentageToDP(3) }}
            />
          </View>

        </View >
        <Modal
          visible={uploading}
          transparent
          animationType='slide'
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.3)", justifyContent: "center", alignItems: 'center', }}>
            <View style={{ backgroundColor: "#F9F9FC", gap: 20, height: widthPercentageToDP(90), width: widthPercentageToDP(90), borderRadius: 20, justifyContent: "center", alignItems: 'center', }}>
              <Typography
                children={"Uploading"}
                textType='bold'
                color='#000'
                size={30}
              />
              <Progress.Bar progress={progressMedia} width={widthPercentageToDP(80)} height={10} color={colors.primary} />
            </View>
          </View>
        </Modal>

      </ScrollView >
    </AppContainer >
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  profileContent: {
    minHeight: heightPercentageToDP(50),
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  notchView: {
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    backgroundColor: '#fff',
    height: 20,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    zIndex: 1,
  },
  profileBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 25,
    backgroundColor: '#F200FF',
  },
  interestBadge: {
    borderWidth: 1,
    borderColor: '#F31FFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 25,
  },
  socialCard: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginVertical: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 10,
  },
});
