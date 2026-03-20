import React, { useState } from 'react';
import { Image, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import * as Progress from 'react-native-progress';
import { widthPercentageToDP } from 'react-native-responsive-screen';
import Toast from "react-native-toast-message";
import Video from 'react-native-video';
import { useDispatch } from "react-redux";
import PrimaryButton from '../../components/Buttons/PrimaryButton';
import Container from '../../components/Container';
import Text from '../../components/Text';
import { Typography } from '../../components/Typography';
import colors from '../../constants/colors';
import userActions from '../../redux/actions/userActions';

const UploadProfileVid = (props) => {

  const [media, setMedia] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const dispatch = useDispatch();

  const SelectVideo = () => {
    // Alert.alert("Select", "Please select an option", [
    //   {
    //     text: "Camera",
    //     onPress: () => {
    //       launchCamera({
    //         mediaType: "video",
    //         quality: 0.7,
    //         videoQuality: "medium",
    //         selectionLimit: 1
    //       }, (response) => {
    //         if (!response.didCancel && !response.errorMessage) {
    //           let video = response.assets[0];
    //           setMedia(video);
    //         }
    //       })
    //     }
    //   }, {
    //     text: "Library",
    //  onPress: () => {
    launchImageLibrary({
      mediaType: "video",
      videoQuality: "medium",
      selectionLimit: 1,
      assetRepresentationMode: "compatible",
      formatAsMp4: true
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
        else
          setMedia({
            name: video.fileName,
            size: video.fileSize,
            type: video.type,
            uri: video.uri,
          });
      }
    })
    //     }
    //   }
    // ])

  }

  const UploadVideo = async () => {
    if (!media?.uri) {
      Toast.show({
        text1: "Warning",
        text2: "Please select profile video to continue",
        type: "error"
      })
      return;
    }
    setUploading(true)
    await dispatch(userActions.UploadVideo({
      video: media,
      redirect: false,
      onProgress: (pe) => {
        setTimeout(() => {
          setProgress((pe.sent / pe.total * 100) / 100)
        }, 1000)
      },
      callback: (data) => {
        let res = JSON.parse(data);
        console.warn(data)
        if (res.success) {
          setProgress(null)
          props.navigation.navigate('OnBoard2')
        }
        else {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: res.message
          })
        }
      }
    }))
    setUploading(false)
  }

  return (
    <Container
      header
      steps={require("../../assets/images/Steps.png")}
      {...props}
      right={false}
    >
      <View style={{ flex: 1, padding: "5%" }}>
        <Text style={{ fontWeight: "bold", fontSize: 22 }} >
          Let's Continue building <Text style={{ color: colors.accent }}>Your</Text> Profile
        </Text>
        <View style={{ flex: 1, overflow: 'hidden', borderRadius: 20, borderWidth: 1, borderStyle: "dashed", borderColor: "#D8D8D8", marginVertical: 20, backgroundColor: "#F9F9FC", justifyContent: "center", alignItems: 'center', }}>
          {
            media?.uri &&
            <Video paused controls style={{ ...StyleSheet.absoluteFill, }} resizeMode="cover" source={{ uri: media.uri }} />
          }
          <TouchableOpacity onPress={SelectVideo}>
            <View style={{ gap: 12, justifyContent: "center", alignItems: 'center', backgroundColor: "#fff", padding: 10, borderRadius: 20 }}>
              <Image source={require("../../assets/images/video.png")} style={{ width: 40, height: 40 }} />
              <Text style={{ fontWeight: "500", fontSize: 16 }}>
                Upload Video
              </Text>
              <Text style={{ color: colors.textLight, textAlign: "center" }}>
                This video will be shown as
                your profile video{"\n"}
                Please allow a few moments to upload
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        <PrimaryButton
          text={'Continue'}
          onPress={() => {
            UploadVideo();
            //  props.navigation.navigate('OnBoard2')
          }}
        />
      </View>
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

    </Container >
  )
};

export default UploadProfileVid;
