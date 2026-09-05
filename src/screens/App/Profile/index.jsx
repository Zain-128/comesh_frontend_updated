import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import Toast from "react-native-toast-message";
import AdIcon from 'react-native-vector-icons/AntDesign';
import Video from "react-native-video";
import { useDispatch, useSelector } from 'react-redux';
import { SelectPicker } from '../../../components/SelectPicket';
import { Typography } from '../../../components/Typography';
import { AppContainer } from '../../../components/layouts/AppContainer';
import colors from '../../../constants/colors';
import { IMAGES } from '../../../constants/images';
import globalActions from '../../../redux/actions/globalActions';
import { canOpenChatWithUser } from '../../../constants/subscriptionEntitlements';
import { setLoader, clearOthersProfile } from '../../../redux/globalSlice';
import helper from '../../../utils/helper';
import { userIdInList } from '../../../utils/matchHelpers';
import {
  openChatWithPeer,
  performLike,
  performSuperLike,
  performUnlike,
} from '../../../utils/likeMessagingActions';

const Profile = props => {
  useEffect(() => {
    StatusBar.setBarStyle("light-content");
  }, []);

  const { userData } = useSelector((state) => state.user);
  const { othersProfile, chats } = useSelector((state) => state.globalState);
  const [profileVideoFailed, setProfileVideoFailed] = React.useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const dispatch = useDispatch();
  const routeUserId = props.route.params?.userID;
  const prefillName = props.route.params?.prefillName;
  const profileMatches =
    othersProfile && routeUserId && String(othersProfile._id) === String(routeUserId);

  const loadProfile = useCallback(async () => {
    const uid = props.route.params?.userID;
    if (!uid) {
      setLoading(false);
      setFetchFailed(true);
      return;
    }
    setLoading(true);
    setFetchFailed(false);
    dispatch(clearOthersProfile());
    dispatch(setLoader(true));
    try {
      await dispatch(globalActions.GetOthersProfile({ userId: uid })).unwrap();
    } catch {
      setFetchFailed(true);
    } finally {
      setLoading(false);
      dispatch(setLoader(false));
    }
  }, [dispatch, props.route.params?.userID]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const otherDisplayName =
    helper.getUserDisplayName(profileMatches ? othersProfile : null) ||
    prefillName ||
    "Comesh User";

  const otherUserId = profileMatches ? othersProfile?._id : null;
  const showMessageAction =
    otherUserId != null && canOpenChatWithUser(userData, otherUserId);

  const openChatWithUser = () =>
    openChatWithPeer({
      dispatch,
      navigation: props.navigation,
      userData,
      chats,
      peerUserId: otherUserId,
    });

  const Like = (userId) =>
    performLike({
      dispatch,
      userData,
      userId,
      navigation: props.navigation,
      chats,
    });

  const unLike = (userId) =>
    performUnlike({ dispatch, userId });

  const SuperLike = (userId) =>
    performSuperLike({
      dispatch,
      userData,
      userId,
      navigation: props.navigation,
    });

  const getAvailability = () => {
    if (!othersProfile?.availabilityFrom || !othersProfile?.availabilityTo) return "";
    let fTimeArr = othersProfile.availabilityFrom.split(" ");
    let tTimeArr = othersProfile.availabilityTo.split(" ");
    let tDayArr = othersProfile?.availabilityTo.split(",");
    let tDayArrSpace = String(tDayArr[tDayArr.length - 1]).split(" ");
    let fromTime = fTimeArr[1] + " " + fTimeArr[2];
    let toTime = tTimeArr[1] + " " + tTimeArr[2];
    let fromDay = othersProfile?.availabilityFrom.split(",")[0];
    let toDay = tDayArrSpace[0];
    let zone = othersProfile?.timeZone ? userData?.timeZone : "";

    if (fromDay && toDay && fromTime && toTime)
      return fromDay + " to " + toDay + "\n" + fromTime + " - " + toTime + " " + zone;
  }


  if (!routeUserId) {
    return (
      <AppContainer>
        <View style={styles.centered}>
          <Typography textType="medium" size={16} color="#666" children="Invalid profile link." />
        </View>
      </AppContainer>
    );
  }

  if (!profileMatches) {
    if (loading) {
      return (
        <AppContainer>
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Typography style={{ marginTop: 16 }} textType="medium" size={14} color="#888" children="Loading profile…" />
          </View>
        </AppContainer>
      );
    }
    if (fetchFailed) {
      return (
        <AppContainer>
          <View style={styles.centered}>
            <Typography textType="semiBold" size={16} color="#333" align="center" children="Could not load this profile." />
            <TouchableOpacity style={styles.retryBtn} onPress={loadProfile} activeOpacity={0.85}>
              <Typography textType="semiBold" size={15} color="#fff" children="Retry" />
            </TouchableOpacity>
          </View>
        </AppContainer>
      );
    }
    return (
      <AppContainer>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppContainer>
    );
  }

  return (
    <AppContainer>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ height: heightPercentageToDP(50), overflow: 'hidden', position: 'relative' }}>
          <TouchableOpacity
            style={{ position: 'absolute', zIndex: 1, margin: 20 }}
            onPress={() => props.navigation.goBack()}>
            <Image
              source={IMAGES.arrowLeft}
              style={{
                width: 30,
                height: 30,
              }}
            />
          </TouchableOpacity>

          {othersProfile?.profileVideo && !profileVideoFailed ? (
            <Video
              repeat={true}
              muted
              playInBackground={false}
              playWhenInactive={false}
              source={helper.getMediaSource(othersProfile?.profileVideo) || { uri: helper.resolveMediaUrl(othersProfile?.profileVideo) }}
              poster={helper.resolveMediaUrl(othersProfile?.profileVideoThumbnail || othersProfile?.profileImage) || undefined}
              posterResizeMode="cover"
              onError={() => setProfileVideoFailed(true)}
              resizeMode='cover'
              style={{ flex: 1, width: '100%', resizeMode: 'cover', backgroundColor: "#000" }}
            />
          ) : (
            <Image
              source={
                helper.getMediaSourceOrUri(othersProfile?.profileImage || othersProfile?.profileVideoThumbnail) ??
                IMAGES.profileIcon
              }
              resizeMode="cover"
              style={{ flex: 1, width: "100%", backgroundColor: "#000" }}
            />
          )}
          {othersProfile?.profileImage ? (
            <View style={styles.heroAvatarWrap} accessibilityLabel="Profile photo">
              <Image
                source={
                  helper.getMediaSourceOrUri(othersProfile.profileImage) ??
                  IMAGES.profileIcon
                }
                style={styles.heroAvatarImg}
                resizeMode="cover"
              />
            </View>
          ) : null}
          <View style={styles.notchView} />
          <View style={styles.actionView}>
            <TouchableOpacity
              onPress={() => Like(othersProfile?._id)}
              style={styles.actionBtn}>
              <AdIcon name={userIdInList(userData?.likedByMe, othersProfile?._id) ? 'like1' : 'like2'} size={26} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => unLike(othersProfile?._id)}
            >
              <View style={styles.actionBtn}>
                <AdIcon name={userIdInList(userData?.unLikedByMe, othersProfile?._id) ? 'dislike1' : 'dislike2'} size={26} color={colors.primary} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              SuperLike(othersProfile?._id)
            }}>
              <View style={styles.actionBtn}>
                <AdIcon name={'staro'} size={26} color={colors.primary} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={openChatWithUser}
              style={[
                styles.actionBtn,
                !showMessageAction && styles.actionBtnDisabled,
              ]}
              accessibilityLabel="Send message"
            >
              <AdIcon
                name="message1"
                size={26}
                color={showMessageAction ? colors.primary : '#B0B0B0'}
              />
            </TouchableOpacity>
            {/* <View style={styles.actionBtn}>
              <AdIcon name={'banckward'} size={26} color={colors.primary} />
            </View> */}
          </View>
        </View>

        <View style={styles.profileContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Typography size={26} textType="bold">
              {otherDisplayName ? `${otherDisplayName} ` : ""}
              <Typography textType="medium" children={othersProfile?.pronouns} size={14} />
            </Typography>
            {
              othersProfile?.isVerified &&
              <Image
                source={IMAGES.verifiedIcon}
                style={{ width: 20, height: 20, marginLeft: 10 }}
              />
            }
          </View>
          <Typography
            children={othersProfile?.address}
            size={14}
            textType="medium"
          />
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 10,
              marginTop: 8,
            }}>
            {(Array.isArray(othersProfile?.niche) ? othersProfile.niche : []).map((i, index) => (
              <View style={styles.profileBadge}>
                <Typography children={helper.sentenceCase(i)} color="#fff" size={12} />
              </View>
            ))}
          </View>

          <View style={{ marginTop: 20 }}>
            <Typography children={`About`} size={18} textType="bold" />
            <Typography
              color="#939393"
              style={{ lineHeight: 20, marginTop: 10 }}
              children={othersProfile?.description}
            />
          </View>
          {
            othersProfile?.availabilityFrom && othersProfile?.availabilityTo &&
            <View style={{ marginTop: 20 }}>
              <Typography children={`Availability`} size={18} textType="bold" />
              <Typography
                color="#939393"
                style={{ lineHeight: 20, marginTop: 10 }}
              >
                <Typography
                  color="#5c5c5c"
                  style={{ lineHeight: 20, marginTop: 10 }}
                  textType='bold'
                />{getAvailability()}
              </Typography>
              {/* 
              <Typography
                color="#939393"
                style={{ lineHeight: 20, marginTop: 10 }}
              >
                <Typography
                  color="#5c5c5c"
                  style={{ lineHeight: 20, marginTop: 10 }}
                  children={"To:"}
                  textType='bold'
                /> {othersProfile?.availabilityTo.split(",")[othersProfile?.availabilityTo.split(",").length - 1]}
              </Typography> */}
            </View>
          }

          {/* <View style={{ marginTop: 20 }}>
            <Typography children={`Interests`} size={18} textType="bold" />
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 10,
                marginTop: 10,
              }}>
              {['Eating Out', 'Cooking', 'Swimming', 'Climate Change'].map(
                i => (
                  <TouchableOpacity style={styles.interestBadge}>
                    <Typography
                      color="#F31FFF"
                      children={i}
                      size={12}
                      textType="semiBold"
                    />
                  </TouchableOpacity>
                ),
              )}
            </View>
          </View> */}

          <View style={{ marginTop: 20 }}>
            <Typography
              children={`Social Media Handles`}
              size={18}
              textType="bold"
            />
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 10,
                marginTop: 10,
              }}>
              {
                othersProfile?.socialMediaProfiles && Object.entries(othersProfile?.socialMediaProfiles).map((v, i) => {
                  let images = [IMAGES.fb, IMAGES.insta, IMAGES.tiktok, IMAGES.youtube];
                  if (v[1])
                    return (
                      <TouchableOpacity
                        activeOpacity={1}
                        style={{}}
                        onPress={async () => {
                          try {
                            await Linking.openURL(v[1])
                          } catch (error) {
                            Toast.show({
                              text1: "Error",
                              text2: "Can't open this link, Bad Link.",
                              type: "error"
                            })
                          }
                        }}>
                        <Image
                          source={images[i]}
                          style={{
                            width: 50,
                            height: 50,
                          }}
                        />
                      </TouchableOpacity>
                    )
                })}
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={styles.socialCard}>
                <Typography children={helper.FollowersPrefix(othersProfile?.followers)} size={20} textType="bold" />
                <Typography
                  children={'Followers'}
                  size={12}
                  color="#042AFF"
                  textType="medium"
                />
              </View>
              {/* <View style={styles.socialCard}>
                <Typography children={'240M'} size={20} textType="bold" />
                <Typography
                  children={'Followings'}
                  size={12}
                  color="#042AFF"
                  textType="medium"
                />
              </View> */}
            </View>
          </View>

          <View style={{ marginTop: 20 }}>
            <Typography children={`Media`} size={18} textType="bold" />
            <ScrollView
              horizontal
              contentContainerStyle={{ gap: 10 }}
              style={{
                flexDirection: 'row',
                marginTop: 10,
              }}>
              {Array.isArray(othersProfile?.videos) && othersProfile.videos.map((i) => (
                <TouchableOpacity
                  activeOpacity={1}
                  style={{}}>
                  <Video
                    source={helper.getMediaSource(i.url) || { uri: helper.resolveMediaUrl(i.url) }}
                    poster={helper.videoPosterUrl(i.thumbnailUrl, i.url, othersProfile?.profileImage) || undefined}
                    posterResizeMode="cover"
                    muted
                    paused
                    controls
                    style={{
                      borderRadius: 20,
                      width: widthPercentageToDP(70),
                      height: widthPercentageToDP(70) / 1.25,
                    }}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={{ marginTop: 20 }}>
            <Typography children={`Preferences`} size={18} textType="bold" style={{ marginBottom: 15 }} />
            {
              Array.isArray(othersProfile?.questionAndAnswers) && othersProfile.questionAndAnswers.length > 0 && othersProfile.questionAndAnswers.findIndex((f) => f.question == 'How often do you make content?') != -1 &&
              <>
                <SelectPicker
                  disabled={true}
                  val={othersProfile?.questionAndAnswers.find((f) => f.question == 'How often do you make content?')?.answer}
                  label={'How often do you make content?'}
                  options={["1-2 days/weekly", "3-4 days/weekly", "Randomly just for fun"]}
                />
                <View style={{ marginTop: 15 }} />
              </>
            }
            <SelectPicker
              val={othersProfile?.willingToTravel ? "Yes" : "No"}
              disabled={true}
              label={'Willing to travel?'}
              options={['Yes', 'No']}
            />
            <View style={{ marginTop: 15 }} />

            {/* <SelectPicker
              val={othersProfile?.niche}
              disabled={true}
              label={'Interest / Niche'}
              options={[{ label: "Fake relationship", value: "Fake relationship" },
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
              { label: "Pet", value: "Pet" },]}
            /> */}
            {
              Array.isArray(othersProfile?.questionAndAnswers) && othersProfile.questionAndAnswers.length > 0 && othersProfile.questionAndAnswers.findIndex((f) => f.question == 'How often do you make content?') != -1 &&
              <SelectPicker
                val={othersProfile?.questionAndAnswers.find((f) => f.question == 'Select which applies?')?.answer}
                disabled={true}
                label={'Type of content you create?'}
                options={["Live streamer", "Video Creator", "Both"]}
              />
            }
          </View>

          <View
            style={{
              marginTop: 30,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 40,
            }}>
            <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => props.navigation.navigate('Block', { report: true, userID: routeUserId })}>
              <Image
                source={IMAGES.reportIcon}
                style={{ width: 40, height: 40 }}
              />
              <Typography children={'Report'} />
            </TouchableOpacity>
            <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => props.navigation.navigate('Block', { report: false, userID: routeUserId })}>
              <Image
                source={IMAGES.blockIcon}
                style={{ width: 40, height: 40 }}
              />
              <Typography children={'Block'} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </AppContainer>
  );
};

export default Profile;

const styles = StyleSheet.create({
  heroAvatarWrap: {
    position: 'absolute',
    zIndex: 3,
    left: 18,
    bottom: 88,
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#E8E8E8',
  },
  heroAvatarImg: {
    width: '100%',
    height: '100%',
  },
  profileContent: {
    minHeight: heightPercentageToDP(50),
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 20,
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
  actionView: {
    width: '100%',
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-around',
    bottom: 3,
    zIndex: 2,
  },
  actionBtnDisabled: {
    opacity: 0.85,
  },
  actionBtn: {
    width: 65,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    minHeight: heightPercentageToDP(40),
  },
  retryBtn: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
});
