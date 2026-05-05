import React, { useState } from 'react';
import { Image, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useImagePickerLock } from '../../utils/imagePickerSafe';
import * as Progress from 'react-native-progress';
import { widthPercentageToDP } from 'react-native-responsive-screen';
import Toast from "react-native-toast-message";
import Video from 'react-native-video';
import { useDispatch, useSelector } from "react-redux";
import PrimaryButton from '../../components/Buttons/PrimaryButton';
import Container from '../../components/Container';
import Text from '../../components/Text';
import { Typography } from '../../components/Typography';
import colors from '../../constants/colors';
import endPoints from '../../constants/endPoints';
import userActions from '../../redux/actions/userActions';
import { setUser } from '../../redux/userSlice';

/** Handles object (from thunk) or legacy string body; never throws on HTML/error pages. */
function normalizeUploadResponse(data) {
  if (data && typeof data === "object") return data;
  if (typeof data === "string") {
    const t = data.trim();
    if (!t || t.startsWith("<")) {
      return { success: false, message: "Upload failed. Please try again." };
    }
    try {
      return JSON.parse(t);
    } catch {
      return { success: false, message: "Upload failed. Please try again." };
    }
  }
  return { success: false, message: "Upload failed. Please try again." };
}

const UploadProfileVid = (props) => {

  const [media, setMedia] = useState(null);
  /** Profile photo (avatar) — shown in chat / messages lists. */
  const [avatar, setAvatar] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  const dispatch = useDispatch();
  const userId = useSelector((s) => s.user?.userData?._id);
  const { launchImageLibrary } = useImagePickerLock();

  const SelectAvatar = () => {
    launchImageLibrary({
      mediaType: "photo",
      selectionLimit: 1,
    }, (response) => {
      if (response.didCancel || response.errorMessage) return;
      const asset = response.assets?.[0];
      if (!asset?.uri) return;
      console.log("[UploadProfileVid] avatar picked", {
        fileName: asset.fileName,
        type: asset.type,
        size: asset.fileSize,
      });
      setAvatar({
        name: asset.fileName,
        size: asset.fileSize,
        type: asset.type || "image/jpeg",
        uri: asset.uri,
      });
    });
  };

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
        else {
          console.log("[UploadProfileVid] profile video picked", {
            fileName: video.fileName,
            type: video.type,
            size: video.fileSize,
            duration: video.duration,
          });
          setMedia({
            name: video.fileName,
            size: video.fileSize,
            type: video.type,
            uri: video.uri,
          });
        }
      }
    })
    //     }
    //   }
    // ])

  }

  const SelectProfilePhoto = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 1,
        maxWidth: 2048,
        maxHeight: 2048,
        quality: 0.88,
      },
      (response) => {
        if (!response.didCancel && !response.errorMessage && response.assets?.[0]) {
          const a = response.assets[0];
          setProfilePhoto({
            uri: a.uri,
            type: a.type || 'image/jpeg',
            fileName: a.fileName,
            name: a.fileName,
          });
        }
      },
    );
  };

  const UploadVideo = async () => {
    if (!media?.uri) {
      Toast.show({
        text1: "Warning",
        text2: "Please select profile video to continue",
        type: "error"
      })
      return;
    }
    if (!avatar?.uri) {
      Toast.show({
        text1: "Warning",
        text2: "Please add a profile photo (avatar) to continue",
        type: "error"
      })
      return;
    }
    const profileUrl = (() => {
      const base = String(endPoints.baseUrl || "").replace(/\/+$/, "");
      const path = String(endPoints.UpdateProfile || "");
      return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
    })();
    console.log("[UploadProfileVid] Continue → PUT", profileUrl);
    console.log("[UploadProfileVid] multipart meta:", {
      hasVideoUri: !!media?.uri,
      videoType: media?.type,
      videoName: media?.name,
      hasAvatarUri: !!avatar?.uri,
      avatarType: avatar?.type,
    });

    setUploading(true);
    try {
      const thunkResult = await dispatch(
        userActions.UploadVideo({
          video: media,
          profileImage: avatar,
          redirect: false,
          onProgress: (pe) => {
            setTimeout(() => {
              setProgress((pe.sent / pe.total * 100) / 100);
            }, 1000);
          },
          callback: (data) => {
        console.log("[UploadProfileVid] API callback raw typeof:", typeof data);
        console.log("[UploadProfileVid] API callback raw:", data);
        const res = normalizeUploadResponse(data);
        console.log(
          "[UploadProfileVid] API normalized success:",
          res?.success,
          "message:",
          res?.message,
        );
        try {
          console.log(
            "[UploadProfileVid] API normalized full:",
            JSON.stringify(res, null, 2),
          );
        } catch (stringifyErr) {
          console.log("[UploadProfileVid] API normalized (non-JSONable):", res, stringifyErr);
        }
            if (res.success) {
              setProgress(null);
              /** Persist profile image + video URLs in Redux so later onboarding steps send them to the API. */
              const updated = res.data;
              if (updated && typeof updated === "object") {
                const patch = {};
                if (updated.profileImage) patch.profileImage = updated.profileImage;
                if (updated.profileVideo) patch.profileVideo = updated.profileVideo;
                if (updated.profileVideoThumbnail) {
                  patch.profileVideoThumbnail = updated.profileVideoThumbnail;
                }
                if (Object.keys(patch).length) dispatch(setUser(patch));
              }
              if (userId) {
                dispatch(userActions.GetMyProfile(userId));
              }
              props.navigation.navigate("OnBoard2");
            } else {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: res.message || "Upload failed. Please try again.",
              });
            }
          },
        })
      ).unwrap();
      console.log("[UploadProfileVid] thunk unwrap result:", thunkResult);
    } catch (thunkErr) {
      console.log("[UploadProfileVid] thunk error / reject:", thunkErr);
    } finally {
      setUploading(false);
    }
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
        <View style={{ alignItems: "center", marginTop: 16 }}>
          <Text style={{ fontWeight: "600", fontSize: 16, marginBottom: 10 }}>
            Profile photo
          </Text>
          <TouchableOpacity onPress={SelectAvatar} activeOpacity={0.85}>
            <View style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              overflow: "hidden",
              borderWidth: 2,
              borderColor: colors.primary,
              backgroundColor: "#eee",
              justifyContent: "center",
              alignItems: "center",
            }}>
              {avatar?.uri ? (
                <Image source={{ uri: avatar.uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              ) : (
                <Text style={{ color: colors.textLight, fontSize: 13, textAlign: "center", padding: 8 }}>
                  Tap to add{"\n"}photo
                </Text>
              )}
            </View>
          </TouchableOpacity>
          <Text style={{ color: colors.textLight, fontSize: 12, marginTop: 8, textAlign: "center" }}>
            This photo is your avatar in chats and messages.
          </Text>
        </View>
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
            <Typography
              children={"This may take a few moments to load."}
              textType='medium'
              color='#666'
              size={14}
            />
            <Progress.Bar progress={progress ?? 0} width={widthPercentageToDP(80)} height={10} color={colors.primary} />
          </View>
        </View>
      </Modal>

    </Container >
  )
};

const styles = StyleSheet.create({
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: '#fff',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
});

export default UploadProfileVid;
