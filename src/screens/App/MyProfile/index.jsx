import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from 'react';
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
import Toast from "react-native-toast-message";
import Video from "react-native-video";
import { useSelector } from 'react-redux';
import Input from '../../../components/Input';
import { SelectPicker } from '../../../components/SelectPicket';
import { Typography } from '../../../components/Typography';
import { AppContainer } from '../../../components/layouts/AppContainer';
import { IMAGES } from '../../../constants/images';
import helper from "../../../utils/helper";

const MyProfile = props => {
  useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  const { userData } = useSelector(state => state.user)
  const [paused, setPaused] = useState(false)
  const [profileVideoFailed, setProfileVideoFailed] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setPaused(true)
    });
    const unsubscribed = navigation.addListener('focus', () => {
      setPaused(false)
    });

    return () => {
      unsubscribe();
      unsubscribed();
    }
  }, []);

  const getAvailability = () => {
    let fTimeArr = userData?.availabilityFrom.split(" ");
    let tTimeArr = userData?.availabilityTo.split(" ");
    let tDayArr = userData?.availabilityTo.split(",");
    let tDayArrSpace = String(tDayArr[tDayArr.length - 1]).split(" ");
    let fromTime = fTimeArr[1] + " " + fTimeArr[2];
    let toTime = tTimeArr[1] + " " + tTimeArr[2];
    let fromDay = userData?.availabilityFrom.split(",")[0];
    let toDay = tDayArrSpace[0];
    let zone = userData?.timeZone ? userData?.timeZone : "";

    return fromDay + " to " + toDay + "\n" + fromTime + " - " + toTime + " " + zone;
  }


  return (
    <AppContainer>
      <ScrollView style={{ flex: 1 }}>
        <View style={{ height: heightPercentageToDP(50) }}>
          <View
            style={{
              position: 'absolute',
              zIndex: 1,
              width: '100%',
              padding: 20,
              paddingTop: 0,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <Typography children={'My Profile'} textType="bold" size={24} color='#fff' />
            <View style={{ flexDirection: 'row', gap: 5 }}>
              <TouchableOpacity
                activeOpacity={1}
                style={{}}
                onPress={() => props.navigation.navigate("Notifications")}>
                <Image
                  source={IMAGES.bellCircle}
                  style={{
                    width: 50,
                    height: 100,
                  }}
                />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={1}
                style={{}}
                onPress={() => props.navigation.navigate("EditProfile")}>
                <Image
                  source={IMAGES.editCircle}
                  style={{
                    width: 50,
                    height: 100,
                  }}
                />
              </TouchableOpacity>
            </View>
          </View>

          {userData?.profileVideo && !profileVideoFailed ? (
            <Video
              paused={paused}
              repeat={true}
              source={{ uri: helper.resolveMediaUrl(userData?.profileVideo) }}
              poster={helper.resolveMediaUrl(userData?.profileVideoThumbnail || userData?.profileImage) || undefined}
              posterResizeMode="cover"
              onError={() => setProfileVideoFailed(true)}
              resizeMode='cover'
              style={{ flex: 1, width: '100%', resizeMode: 'cover', backgroundColor: "#000" }}
            />
          ) : (
            <Image
              source={
                helper.resolveMediaUrl(userData?.profileImage || userData?.profileVideoThumbnail)
                  ? { uri: helper.resolveMediaUrl(userData?.profileImage || userData?.profileVideoThumbnail) }
                  : IMAGES.men
              }
              resizeMode="cover"
              style={{ flex: 1, width: "100%", backgroundColor: "#000" }}
            />
          )}
          <View style={styles.notchView} />
        </View>

        <View style={styles.profileContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Typography children={userData?.firstName + " " + userData?.lastName} size={26} textType="bold" />
            {
              userData?.isVerified &&
              <Image
                source={IMAGES.verifiedIcon}
                style={{ width: 20, height: 20, marginLeft: 10 }}
              />
            }
          </View>
          <Typography
            children={userData?.address}
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
            {userData?.niche.map((i, index) => (
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
              children={userData?.description}
            />
          </View>
          {
            userData?.availabilityFrom && userData?.availabilityTo &&
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
            </View>
          }
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
                userData?.socialMediaProfiles && Object.entries(userData?.socialMediaProfiles).map((v, i) => {
                  let images = [IMAGES.fb, IMAGES.insta, IMAGES.tiktok, IMAGES.youtube, IMAGES.twitter];
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
                <Typography children={helper.FollowersPrefix(userData?.followers)} size={20} textType="bold" />
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
              </View>*/}
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
              {userData?.videos && userData?.videos.map(i => (
                <Video
                  source={{ uri: helper.resolveMediaUrl(i.url) }}
                  poster={helper.resolveMediaUrl(i.thumbnailUrl || userData?.profileVideoThumbnail) || undefined}
                  posterResizeMode="cover"
                  paused
                  controls
                  style={{
                    borderRadius: 20,
                    width: widthPercentageToDP(70),
                    height: widthPercentageToDP(70) / 1.25,
                    backgroundColor: "#eee"
                  }}
                />
              ))}
            </ScrollView>
          </View>

          <View style={{ marginTop: 20 }}>
            <Typography children={`Preferences`} size={18} textType="bold" style={{ marginBottom: 15 }} />
            {
              userData?.questionAndAnswers?.length > 0 && userData?.questionAndAnswers.findIndex((f) => f.question == 'How often do you make content?') != -1 &&
              <SelectPicker
                disabled={true}
                val={userData?.questionAndAnswers.find((f) => f.question == 'How often do you make content?')?.answer}
                label={'How often do you make content?'}
                options={["1-2 days/weekly", "3-4 days/weekly", "Randomly just for fun"]}
              />
            }
            <View style={{ marginTop: 20 }} />
            <SelectPicker
              val={userData?.willingToTravel ? "Yes" : "No"}
              disabled={true}
              label={'Willing to travel?'}
              options={['Yes', 'No']}
            />
            {/* <SelectPicker
              val={userData?.niche}
              disabled={true}
              label={'Interest / Niche'}
              options={['Fitness', 'Sports', 'Entertainment', 'DIY']}
            /> */}
            <View style={{ marginTop: 20 }} />
            {
              userData?.questionAndAnswers?.length > 0 && userData?.questionAndAnswers.findIndex((f) => f.question == 'How often do you make content?') != -1 &&
              <SelectPicker
                val={userData?.questionAndAnswers.find((f) => f.question == 'Select which applies?')?.answer}
                disabled={true}
                label={'Type of content you create?'}
                options={["Live streamer", "Video Creator", "Both"]}
              />
            }
          </View>

          <View style={{ marginTop: 20 }}>
            <Typography children={`Personal Info`} size={18} textType="bold" />

            <View
              style={{
                flex: 1,
                gap: 20,
                marginVertical: 20,
              }}>
              {/* <Input
                editable={userData?.}
                placeholder="First Name"
                leftImage={require('../../../assets/images/name.png')}
              />
              <Input
                editable={userData?.}
                placeholder="Last Name"
                leftImage={require('../../../assets/images/name.png')}
              /> */}
              <Input
                editable={false}
                value={userData?.email}
                placeholder="Your Email Address"
                leftImage={require('../../../assets/images/email.png')}
              />
              <Input
                editable={false}
                value={userData?.phoneNo}
                placeholder="Phone Number"
                leftImage={require('../../../assets/images/phone.png')}
              />
              <Input
                editable={false}
                value={userData?.dob}
                placeholder="Date Of Birth"
                leftImage={require('../../../assets/images/DOB.png')}
              />
              <Input
                editable={false}
                value={userData?.address}
                placeholder="Location"
                leftImage={require('../../../assets/images/location.png')}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </AppContainer>
  );
};

export default MyProfile;

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
