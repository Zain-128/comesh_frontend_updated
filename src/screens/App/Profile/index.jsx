import React, { useEffect } from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import AdIcon from 'react-native-vector-icons/AntDesign';
import Video from "react-native-video";
import { useDispatch, useSelector } from 'react-redux';
import { SelectPicker } from '../../../components/SelectPicket';
import { Typography } from '../../../components/Typography';
import { AppContainer } from '../../../components/layouts/AppContainer';
import colors from '../../../constants/colors';
import { IMAGES } from '../../../constants/images';
import globalActions from '../../../redux/actions/globalActions';
import { setLoader } from '../../../redux/globalSlice';
import { updateUserLikes } from '../../../redux/userSlice';
import helper from '../../../utils/helper';

const Profile = props => {
  useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  const { userData } = useSelector(state => state.user);
  const { othersProfile } = useSelector(state => state.globalState);
  const [profileVideoFailed, setProfileVideoFailed] = React.useState(false);
  const dispatch = useDispatch();
  const { userID = "" } = props.route.params;

  useEffect(() => {
    let params = props.route.params;
    //if (othersProfile?._id != params.userID)
    getData();
  }, [])

  const getData = async () => {
    let params = props.route.params;
    dispatch(setLoader(true))
    await dispatch(globalActions.GetOthersProfile({
      userId: params.userID,
      callback: (data) => {
        //console.warn(data?.data?.likedByMe)
      }
    }));
    dispatch(setLoader(false));
  }

  const Like = async (userId) => {
    //dispatch(setLoader(true))
    await dispatch(globalActions.likeUser({
      userId,
      callback: (data) => {
        console.warn(data)
        if (data.success) {
          dispatch(updateUserLikes({ userId, type: "like" }))
        }
      }
    }));
    //dispatch(setLoader(false));

  }

  const unLike = async (userId) => {
    //dispatch(setLoader(true))
    await dispatch(globalActions.unLikeUser({
      userId,
      callback: (data) => {
        console.warn(data)
        if (data.success) {
          dispatch(updateUserLikes({ userId, type: "unlike" }))
        }
      }
    }));
    //dispatch(setLoader(false));

  }

  const SuperLike = async (userId) => {
    //dispatch(setLoader(true))
    await dispatch(globalActions.SuperLikeUser({
      userId,
      callback: (data) => {
        console.warn(data)
        if (data.success) {
          dispatch(updateUserLikes({ userId, type: "like" }))
        }
      }
    }));
    //dispatch(setLoader(false));

  }

  const getAvailability = () => {
    let fTimeArr = othersProfile?.availabilityFrom.split(" ");
    let tTimeArr = othersProfile?.availabilityTo.split(" ");
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


  return (
    <AppContainer>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ height: heightPercentageToDP(50), overflow: 'hidden', }}>
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
              source={{ uri: helper.resolveMediaUrl(othersProfile?.profileVideo) }}
              poster={helper.resolveMediaUrl(othersProfile?.profileVideoThumbnail || othersProfile?.profileImage) || undefined}
              posterResizeMode="cover"
              onError={() => setProfileVideoFailed(true)}
              resizeMode='cover'
              style={{ flex: 1, width: '100%', resizeMode: 'cover', backgroundColor: "#000" }}
            />
          ) : (
            <Image
              source={
                helper.resolveMediaUrl(othersProfile?.profileImage || othersProfile?.profileVideoThumbnail)
                  ? { uri: helper.resolveMediaUrl(othersProfile?.profileImage || othersProfile?.profileVideoThumbnail) }
                  : IMAGES.men
              }
              resizeMode="cover"
              style={{ flex: 1, width: "100%", backgroundColor: "#000" }}
            />
          )}
          <View style={styles.notchView} />
          <View style={styles.actionView}>
            <TouchableOpacity
              onPress={() => Like(othersProfile?._id)}
              style={styles.actionBtn}>
              <AdIcon name={userData?.likedByMe?.includes(othersProfile?._id) ? 'like1' : 'like2'} size={26} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => unLike(othersProfile?._id)}
            >
              <View style={styles.actionBtn}>
                <AdIcon name={userData?.unLikedByMe?.includes(othersProfile?._id) ? 'dislike1' : 'dislike2'} size={26} color={colors.primary} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              SuperLike(othersProfile?._id)
            }}>
              <View style={styles.actionBtn}>
                <AdIcon name={'staro'} size={26} color={colors.primary} />
              </View>
            </TouchableOpacity>
            {/* <View style={styles.actionBtn}>
              <AdIcon name={'banckward'} size={26} color={colors.primary} />
            </View> */}
          </View>
        </View>

        <View style={styles.profileContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Typography size={26} textType="bold">
              {othersProfile?.firstName + " " + othersProfile?.lastName + " "}
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
            {othersProfile?.niche.map((i, index) => (
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
              {othersProfile?.videos && othersProfile?.videos.map(i => (
                <TouchableOpacity
                  activeOpacity={1}
                  style={{}}>
                  <Video
                    source={{ uri: helper.resolveMediaUrl(i.url) }}
                    poster={helper.resolveMediaUrl(i.thumbnailUrl || othersProfile?.profileVideoThumbnail) || undefined}
                    posterResizeMode="cover"
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
              othersProfile?.questionAndAnswers.length > 0 && othersProfile?.questionAndAnswers.findIndex((f) => f.question == 'How often do you make content?') != -1 &&
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
              othersProfile?.questionAndAnswers.length > 0 && othersProfile?.questionAndAnswers.findIndex((f) => f.question == 'How often do you make content?') != -1 &&
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
            <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => props.navigation.navigate('Block', { report: true, userID })}>
              <Image
                source={IMAGES.reportIcon}
                style={{ width: 40, height: 40 }}
              />
              <Typography children={'Report'} />
            </TouchableOpacity>
            <TouchableOpacity style={{ alignItems: 'center' }} onPress={() => props.navigation.navigate('Block', { report: false, userID })}>
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
});
