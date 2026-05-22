import React, { useState } from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { useImagePickerLock } from '../../utils/imagePickerSafe';
import { heightPercentageToDP } from 'react-native-responsive-screen';
import Toast from "react-native-toast-message";
import Video from 'react-native-video';
import { useDispatch } from "react-redux";
import PrimaryButton from '../../components/Buttons/PrimaryButton';
import Container from '../../components/Container';
import Text from '../../components/Text';
import colors from '../../constants/colors';
import { setPendingOnboardingMedia } from '../../redux/userSlice';
import VideoPickerThumbnail from '../../components/VideoPickerThumbnail';
import {
  normalizeVideoAsset,
  singleVideoPickerOptions,
} from '../../utils/videoPickerAsset';

const VIDEO_STAGE_MIN_HEIGHT = heightPercentageToDP(34);

/** Local file preview: keep buffers small so first frame shows faster. */
const VIDEO_BUFFER_CONFIG = {
  minBufferMs: 250,
  maxBufferMs: 8000,
  bufferForPlaybackMs: 250,
  bufferForPlaybackAfterRebufferMs: 500,
};

const UploadProfileVid = (props) => {

  const [media, setMedia] = useState(null);
  const [previewVideoUri, setPreviewVideoUri] = useState(null);
  /** Profile photo (avatar) — shown in chat / messages lists. */
  const [avatar, setAvatar] = useState(null);
  const dispatch = useDispatch();
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
    launchImageLibrary(singleVideoPickerOptions(), (response) => {
      if (!response.didCancel && !response.errorMessage) {
        const video = normalizeVideoAsset(response.assets?.[0]);
        if (!video?.uri) {
          return;
        }
        if (video.duration > 30) {
          Toast.show({
            text1: "Warning",
            text2: "Profile Video must not exceeds limit of 30 seconds",
            type: "error",
          });
        } else {
          setMedia({
            name: video.fileName,
            size: video.fileSize,
            type: video.type,
            uri: video.uri,
            posterUri: video.posterUri,
            thumbnailUri: video.thumbnailUri,
          });
        }
      }
    });
    //     }
    //   }
    // ])

  };

  const ContinueToNextStep = () => {
    if (!media?.uri) {
      Toast.show({
        text1: "Warning",
        text2: "Please select profile video to continue",
        type: "error",
      });
      return;
    }
    if (!avatar?.uri) {
      Toast.show({
        text1: "Warning",
        text2: "Please add a profile photo (avatar) to continue",
        type: "error",
      });
      return;
    }
    dispatch(
      setPendingOnboardingMedia({
        profileVideo: media,
        profileImage: avatar,
      }),
    );
    props.navigation.navigate("OnBoard2");
  };

  return (
    <Container
      header
      steps={require("../../assets/images/Steps.png")}
      {...props}
      right={false}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: "5%", flexGrow: 1 }}>
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
        <View
          style={[
            styles.videoStage,
            { minHeight: VIDEO_STAGE_MIN_HEIGHT },
          ]}
        >
          {media?.uri ? (
            <TouchableOpacity
              activeOpacity={0.92}
              style={StyleSheet.absoluteFillObject}
              onPress={() => setPreviewVideoUri(media.uri)}
            >
              <VideoPickerThumbnail
                asset={media}
                style={StyleSheet.absoluteFillObject}
              >
                <View style={styles.playOverlay}>
                  <Image
                    source={require("../../assets/images/play.png")}
                    style={{ width: 48, height: 48 }}
                  />
                </View>
              </VideoPickerThumbnail>
            </TouchableOpacity>
          ) : null}

          {!media?.uri ? (
            <TouchableOpacity
              onPress={SelectVideo}
              activeOpacity={0.88}
              style={styles.uploadPromptTouchable}
            >
              <View style={styles.uploadPromptCard}>
                <Image
                  source={require("../../assets/images/video.png")}
                  style={{ width: 40, height: 40 }}
                />
                <Text style={{ fontWeight: "500", fontSize: 16 }}>
                  Upload Video
                </Text>
                <Text style={{ color: colors.textLight, textAlign: "center" }}>
                  This video will be shown as your profile video. Tap to choose
                  a clip (max 30 seconds).
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={SelectVideo}
              activeOpacity={0.9}
              style={styles.changeVideoChip}
            >
              <Text style={styles.changeVideoChipText}>Change video</Text>
            </TouchableOpacity>
          )}

        </View>
        <PrimaryButton
          text={'Continue'}
          onPress={ContinueToNextStep}
        />
      </ScrollView>
      <Modal
        visible={!!previewVideoUri}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVideoUri(null)}
      >
        <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center" }}>
          {previewVideoUri ? (
            <Video
              source={{ uri: previewVideoUri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
              controls
              repeat={false}
              bufferConfig={VIDEO_BUFFER_CONFIG}
            />
          ) : null}
          <TouchableOpacity
            onPress={() => setPreviewVideoUri(null)}
            style={{
              position: "absolute",
              top: 48,
              right: 16,
              backgroundColor: "rgba(255,255,255,0.95)",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 20,
            }}
          >
            <Text style={{ fontWeight: "700", color: "#000" }}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </Container >
  )
};

const styles = StyleSheet.create({
  videoStage: {
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D8D8D8',
    marginVertical: 20,
    backgroundColor: '#F9F9FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadPromptTouchable: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPromptCard: {
    gap: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 20,
    maxWidth: '92%',
  },
  changeVideoChip: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  changeVideoChipText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
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
