import React, { useCallback, useEffect, useState } from 'react';
import { Image, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useImagePickerLock } from '../../utils/imagePickerSafe';
import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen';
import Toast from 'react-native-toast-message';
import Video from 'react-native-video';
import { useDispatch, useSelector } from "react-redux";
import PrimaryButton from '../../components/Buttons/PrimaryButton';
import Container from '../../components/Container';
import { SelectPicker } from '../../components/SelectPicket';
import Text from '../../components/Text';
import colors from '../../constants/colors';
import {
  setPendingOnboardingMedia,
  setPostSignupFlowComplete,
  setUser,
} from '../../redux/userSlice';
import {
  logOnboardingPayload,
  normalizeNicheForApi,
} from '../../utils/onboardingApiDebug';
import {
  ONBOARDING_GALLERY_VIDEO_MAX_BYTES,
  ONBOARDING_GALLERY_VIDEO_MAX_MB,
  PROFILE_VIDEO_MAX_DURATION_SEC,
  enrichVideoAssetForValidation,
  formatBytesForLog,
  getProfileVideoRejectReason,
  logVideoAssetCheck,
  normalizeVideoDurationSec,
  sumGalleryVideoBytes,
  validateProfileVideoPick,
} from '../../constants/videoUploadLimits';

const galleryVideoLimits = { maxBytes: ONBOARDING_GALLERY_VIDEO_MAX_BYTES };
import {
  multiVideoPickerOptions,
  normalizeVideoAssets,
} from '../../utils/videoPickerAsset';

const MAX_GALLERY_VIDEOS = 5;

const OnBoard3 = (props) => {
  const dispatch = useDispatch();
  const userRegister = useSelector((state) => state.user.userRegister);
  const pendingOnboardingMedia = useSelector(
    (state) => state.user.pendingOnboardingMedia,
  );

  const [value, setValue] = useState(null);
  const [videos, setVideos] = useState([]);
  const [disabled, setDisabled] = useState(false);
  const [previewUri, setPreviewUri] = useState(null);
  const { launchImageLibrary } = useImagePickerLock();

  useEffect(() => {
    const niche = userRegister?.niche;
    if (niche?.length) {
      setValue(Array.isArray(niche) ? niche : [niche]);
    }
    const saved = pendingOnboardingMedia?.galleryVideos;
    if (Array.isArray(saved) && saved.length) {
      setVideos(saved);
      if (__DEV__) {
        console.log('[OnBoard3] restored gallery from Redux', {
          count: saved.length,
          items: saved.map((v, i) => ({
            i,
            fileName: v?.fileName,
            size: formatBytesForLog(v?.fileSize),
          })),
        });
      }
    }
  }, []);

  const logGalleryState = useCallback((label) => {
    if (!__DEV__) return;
    console.log(`[OnBoard3] ${label}`, {
      niche: value,
      nicheNormalized: normalizeNicheForApi(value),
      videoCount: videos.length,
      videos: videos.map((v, i) => ({
        i,
        fileName: v?.fileName,
        fileSize: v?.fileSize,
        fileSizeLabel: formatBytesForLog(v?.fileSize),
        duration: v?.duration,
        uriTail: v?.uri ? String(v.uri).slice(-40) : null,
      })),
      pendingOnboardingMedia,
    });
  }, [value, videos, pendingOnboardingMedia]);

  const processPickedVideo = async (raw) => {
    if (!raw?.uri) {
      return { ok: false, reason: 'No video selected' };
    }

    const enriched = await enrichVideoAssetForValidation(raw);

    const reason = getProfileVideoRejectReason(enriched, galleryVideoLimits);
    logVideoAssetCheck('pick', enriched, reason);
    if (reason) {
      const hint =
        reason.includes(`${ONBOARDING_GALLERY_VIDEO_MAX_MB}MB`) ||
        reason.includes('MB or less')
          ? `${reason} Use a shorter clip (under 15s).`
          : reason;
      return { ok: false, reason: hint };
    }

    const check = validateProfileVideoPick(enriched, galleryVideoLimits);
    if (!check.valid) {
      return { ok: false, reason: check.message };
    }

    return { ok: true, asset: enriched };
  };

  const SelectVideos = () => {
    const remaining = MAX_GALLERY_VIDEOS - videos.length;
    if (remaining <= 0) {
      Toast.show({
        text1: "Limit reached",
        text2: `You can add up to ${MAX_GALLERY_VIDEOS} videos`,
        type: "error",
      });
      return;
    }
    setDisabled(true);
    launchImageLibrary(multiVideoPickerOptions(remaining), async (response) => {
      if (response.didCancel || response.errorMessage) {
        setDisabled(false);
        if (__DEV__ && response.errorMessage) {
          console.warn('[OnBoard3] picker error', response.errorMessage);
        }
        return;
      }

      const picked = normalizeVideoAssets(response.assets);
      if (!picked.length) {
        setDisabled(false);
        return;
      }

      const accepted = [];
      let lastReject = null;

      let slotsLeft = remaining;
      for (const raw of picked) {
        if (slotsLeft <= 0) {
          break;
        }
        const result = await processPickedVideo(raw);
        if (result.ok && result.asset) {
          accepted.push(result.asset);
          slotsLeft -= 1;
        } else if (result.reason) {
          lastReject = result.reason;
        }
      }

      setDisabled(false);

      if (!accepted.length) {
        Toast.show({
          text1: 'No videos added',
          text2:
            lastReject ||
            `Each clip must be max 15s and ${ONBOARDING_GALLERY_VIDEO_MAX_MB}MB.`,
          type: 'error',
        });
        return;
      }

      setVideos((prev) => {
        const seen = new Set(prev.map((v) => v.uri));
        const merged = [...prev];
        for (const asset of accepted) {
          if (seen.has(asset.uri) || merged.length >= MAX_GALLERY_VIDEOS) {
            continue;
          }
          seen.add(asset.uri);
          merged.push(asset);
        }
        return merged;
      });

      if (picked.length > 1) {
        const skipped = picked.length - accepted.length;
        if (skipped > 0) {
          Toast.show({
            text1: `${accepted.length} of ${picked.length} videos added`,
            text2:
              lastReject ||
              `${skipped} clip(s) skipped — max 15s and ${ONBOARDING_GALLERY_VIDEO_MAX_MB}MB each.`,
            type: 'error',
          });
        } else {
          Toast.show({
            text1: `${accepted.length} videos added`,
            text2: `All clips are within 15s and ${ONBOARDING_GALLERY_VIDEO_MAX_MB}MB.`,
            type: 'success',
          });
        }
      } else if (accepted.length === 1) {
        Toast.show({
          text1: 'Video added',
          text2: formatBytesForLog(accepted[0]?.fileSize),
          type: 'success',
        });
      }
    });
  };

  const removeVideoAt = (index) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const ContinueToNextStep = () => {
    const niche = normalizeNicheForApi(value);
    if (!niche?.length) {
      Toast.show({
        text1: "Warning",
        text2: "Please select your niche to continue",
        type: "error",
      });
      return;
    }

    dispatch(setUser({ niche }));

    const galleryPayload = { galleryVideos: videos };
    dispatch(setPendingOnboardingMedia(galleryPayload));

    const saveSnapshot = {
      niche,
      galleryVideos: videos.map((v) => ({
        fileName: v.fileName,
        fileSize: v.fileSize,
        fileSizeLabel: formatBytesForLog(v.fileSize),
        duration: v.duration,
        type: v.type,
        uri: v.uri,
      })),
    };
    logOnboardingPayload('OnBoard3 Continue → Redux pendingOnboardingMedia', saveSnapshot);
    logGalleryState('Continue (local state)');

    dispatch(setPostSignupFlowComplete(false));
    props.navigation.navigate("OnBoard4");
  };

  return (
    <Container
      header
      steps={require("../../assets/images/Steps3.png")}
      {...props}
      right={false}
    >
      <ScrollView>
        <View style={{ flex: 1, padding: "5%", gap: 20 }}>
          <View style={{ gap: 10 }}>
            <Text style={{ fontWeight: "bold", fontSize: 22 }} >
              Please select your niche?
            </Text>
            <SelectPicker
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
              onValueChange={(selected) => {
                setValue(selected);
                if (__DEV__) {
                  console.log('[OnBoard3] niche selected', {
                    raw: selected,
                    normalized: normalizeNicheForApi(selected),
                  });
                }
              }}
            />
          </View>
          <View style={{ gap: 10, zIndex: -1 }}>
            <Text style={{ fontWeight: "bold", fontSize: 22 }} >
              Upload Videos
            </Text>
            <Text style={{ color: colors.textLight }}>
              Add up to {MAX_GALLERY_VIDEOS} videos (select several at once or tap + again).
              Each clip: max {PROFILE_VIDEO_MAX_DURATION_SEC}s and {ONBOARDING_GALLERY_VIDEO_MAX_MB}MB per video (not combined).
            </Text>
            <Text style={{ color: colors.textLight, fontSize: 13 }}>
              {videos.length} / {MAX_GALLERY_VIDEOS} added
              {videos.length > 0
                ? ` · Total ${formatBytesForLog(sumGalleryVideoBytes(videos))} (OK if each clip ≤ ${ONBOARDING_GALLERY_VIDEO_MAX_MB}MB)`
                : ''}
            </Text>
            <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', marginTop: 20, gap: 10 }}>
              {
                videos.map((v, idx) =>
                  <View
                    key={v?.uri ? `${v.uri}-${idx}` : `vid-${idx}`}
                    style={{
                      overflow: 'hidden',
                      width: widthPercentageToDP(28),
                      height: heightPercentageToDP(20),
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Video
                      source={{ uri: v.uri }}
                      style={StyleSheet.absoluteFillObject}
                      resizeMode="cover"
                      repeat
                      muted
                      paused
                      playInBackground={false}
                    />
                    <View style={styles.videoMetaBadge}>
                      <Text style={styles.videoMetaText}>
                        {Math.round(normalizeVideoDurationSec(v?.duration) ?? 0)}s ·{' '}
                        {formatBytesForLog(v?.fileSize)}
                      </Text>
                    </View>
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
                videos.length < MAX_GALLERY_VIDEOS &&
                <View style={{ width: widthPercentageToDP(28), height: heightPercentageToDP(20), borderRadius: 10, backgroundColor: "#F9F9FC", alignItems: 'center', justifyContent: "center" }}>
                  <TouchableOpacity
                    onPress={SelectVideos}
                    disabled={disabled}
                    style={{ opacity: disabled ? 0.7 : 1 }}>
                    <Image style={{ width: 35, height: 35 }} source={require("../../assets/images/add.png")} />
                  </TouchableOpacity>
                </View>
              }

            </View>
          </View>
          <PrimaryButton text={'Continue'} onPress={ContinueToNextStep} />
        </View>
      </ScrollView>
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

const styles = StyleSheet.create({
  videoMetaBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    zIndex: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  videoMetaText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default OnBoard3;
