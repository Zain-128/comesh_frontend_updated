import React, { useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useImagePickerLock } from '../../utils/imagePickerSafe';
import * as Progress from 'react-native-progress';
import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen';
import Toast from 'react-native-toast-message';
import Video from 'react-native-video';
import { useDispatch } from "react-redux";
import PrimaryButton from '../../components/Buttons/PrimaryButton';
import Container from '../../components/Container';
import { SelectPicker } from '../../components/SelectPicket';
import Text from '../../components/Text';
import { Typography } from '../../components/Typography';
import colors from '../../constants/colors';
import userActions from '../../redux/actions/userActions';
import { setUser } from '../../redux/userSlice';

const OnBoard3 = (props) => {
  const [value, setValue] = useState(null);
  const dispatch = useDispatch();
  const [videos, setVideos] = useState([]);
  const [disabled, setDisabled] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUri, setPreviewUri] = useState(null);
  const { launchImageLibrary } = useImagePickerLock();

  const SelectVideos = () => {
    const remaining = 5 - videos.length;
    if (remaining <= 0) {
      Toast.show({
        text1: "Warning",
        text2: "You can only add 5 videos",
        type: "error"
      })
      return;
    }
    setDisabled(true);
    launchImageLibrary({
      mediaType: "video",
      quality: 0.7,
      videoQuality: "medium",
      selectionLimit: remaining,
    }, (response) => {
      setDisabled(false);
      if (response.didCancel || response.errorMessage) return;
      const assets = response.assets || [];
      if (!assets.length) return;
      setVideos((prev) => [...prev, ...assets].slice(0, 5));
    });
  };

  const removeVideoAt = (index) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const Upload = async () => {
    if (videos.length > 0) {
      setUploading(true)
      let interval = setInterval(() => {
        setProgress((p) => {
          if (p < 1) {
            return p + (3 / 10)
          }
          else {
            props.navigation.navigate('OnBoard4')
            setUploading(false)
            clearInterval(interval);
          }
        })
      }, 1000)
    }
    else
      props.navigation.navigate('OnBoard4')
  }

  const UploadAndUpdate = async () => {
    if (!value) {
      Toast.show({
        text1: "Warning",
        text2: ""
      })
      return;
    }
    setUploading(true)
    await dispatch(userActions.UploadProfileMedia({
      video: videos,
      onProgress: (pe) => {
        setTimeout(() => {
          setProgress(pe.sent / pe.total)
        }, 1000)
      },
      callback: (data) => {
        const res = typeof data === "object" && data !== null ? data : {};
        console.warn(res?.data?.videos);
        if (res.success) {
          setUploading(false)
          setProgress(null)
          dispatch(setUser({
            niche: value,
          }));
          props.navigation.navigate('OnBoard4')
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
    <Container
      header
      steps={require("../../assets/images/Steps3.png")}
      {...props}
      right={false}
    //SkipToScreen="OnBoard4"

    >
      <ScrollView>
        <View style={{ flex: 1, padding: "5%", gap: 20 }}>
          <View style={{ gap: 10 }}>
            <Text style={{ fontWeight: "bold", fontSize: 22 }} >
              Please select your niche?
            </Text>
            {/* <View style={{ borderRadius: 50, backgroundColor: "#fff", elevation: 5, shadowColor: "#999" }}> */}
            {/* <Picker>
                <Picker.Item label='Fitness' />
                <Picker.Item label='Sports' />
                <Picker.Item label='Entertainment' />
                <Picker.Item label='DIY' />
              </Picker> */}
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
            {/* </View> */}
          </View>
          <View style={{ gap: 10, zIndex: -1 }}>
            <Text style={{ fontWeight: "bold", fontSize: 22 }} >
              Upload Videos
            </Text>
            <Text>
              You can add upto 5 videos
            </Text>
            <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', marginTop: 20, gap: 10 }}>
              {
                videos.map((v, idx) =>
                  <View
                    key={v?.uri ? `${v.uri}-${idx}` : `vid-${idx}`}
                    style={{ overflow: 'hidden', width: widthPercentageToDP(28), height: heightPercentageToDP(20), borderRadius: 10, backgroundColor: "#000", alignItems: 'center', justifyContent: "center" }}>
                    {v?.uri ? (
                      <Video
                        source={{ uri: v.uri }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                        muted
                        repeat={false}
                        paused
                        disableFocus
                      />
                    ) : null}
                    <TouchableOpacity
                      style={{ position: "absolute", top: 4, right: 4, zIndex: 2, backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 12, padding: 4 }}
                      onPress={() => removeVideoAt(idx)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>✕</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setPreviewUri(v.uri)}
                      style={{ zIndex: 1 }}
                      activeOpacity={0.85}>
                      <Image style={{ width: 35, height: 35 }} source={require("../../assets/images/play.png")} />
                    </TouchableOpacity>
                  </View>)
              }
              {
                videos.length != 5 &&
                <View style={{ width: widthPercentageToDP(28), height: heightPercentageToDP(20), borderRadius: 10, backgroundColor: "#F9F9FC", alignItems: 'center', justifyContent: "center" }}>
                  <TouchableOpacity onPress={SelectVideos} disabled={disabled} style={{ opacity: disabled ? 0.7 : 1 }}>
                    <Image style={{ width: 35, height: 35 }} source={require("../../assets/images/add.png")} />
                  </TouchableOpacity>
                </View>
              }

            </View>
          </View>
          <PrimaryButton
            text={'Continue'}
            onPress={() => {
              if (value == '') {
                Toast.show({
                  type: "error",
                  text1: "Warning",
                  text2: "Please select your niche to continue"
                })
                return;
              }
              UploadAndUpdate();
            }}
          />
        </View>
      </ScrollView>
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
            <Progress.Bar progress={progress} width={widthPercentageToDP(80)} height={10} color={colors.primary} />
          </View>
        </View>
      </Modal>
      <Modal visible={!!previewUri} transparent animationType="fade" onRequestClose={() => setPreviewUri(null)}>
        <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center" }}>
          {previewUri ? (
            <Video
              source={{ uri: previewUri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
              controls
              repeat={false}
            />
          ) : null}
          <TouchableOpacity
            onPress={() => setPreviewUri(null)}
            style={{ position: "absolute", top: 48, right: 16, backgroundColor: "rgba(255,255,255,0.95)", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 }}>
            <Text style={{ fontWeight: "700", color: "#000" }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Container >
  )
};

export default OnBoard3;
