import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import {
  Image,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Swiper from 'react-native-deck-swiper';
import LinearGradient from 'react-native-linear-gradient';
import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen';
import AdIcon from 'react-native-vector-icons/AntDesign';
import Video from 'react-native-video';
import { useDispatch, useSelector } from 'react-redux';
import images from '../../../assets/images';
import { Typography } from '../../../components/Typography';
import { AppContainer } from '../../../components/layouts/AppContainer';
import colors from '../../../constants/colors';
import { IMAGES } from '../../../constants/images';
import globalActions from '../../../redux/actions/globalActions';
import { emptyDashData } from '../../../redux/globalSlice';
import { updateUserLikes } from '../../../redux/userSlice';
import helper from "../../../utils/helper";
import Header from './Header';

const ITEM_HEIGHT = heightPercentageToDP(100) * 0.725;

const Home = props => {
  const { userData, token } = useSelector(state => state.user);
  const { dashboard, dashLoading } = useSelector(state => state.globalState);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCIndex] = useState(0);
  const dispatch = useDispatch();


  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    refreshPosts();
  }, [])

  const getPosts = async () => {
    setLoading(true)
    await dispatch(globalActions.DashboardListing({
      page: dashboard?.pagination?.current,
      callback: (data) => {
      }
    }));
    setLoading(false);
  }

  const refreshPosts = async () => {
    setLoading(true)
    await dispatch(globalActions.DashboardListing({
      page: 1,
      callback: (data) => {
      }
    }));
    setTimeout(() => {
      setLoading(false);
    }, 1000)
  }

  const SuperLike = async (userId) => {
    //dispatch(setLoader(true))
    await dispatch(globalActions.SuperLikeUser({
      userId,
      callback: (data) => {
        console.warn(data)
        if (data.success) {
          dispatch(updateUserLikes({
            userId,
            type: "like"
          }))
        }
      }
    }));
    //dispatch(setLoader(false));

  }

  const Like = async (userId) => {
    //dispatch(setLoader(true))
    await dispatch(globalActions.likeUser({
      userId,
      callback: (data) => {
        console.warn(data)
        if (data.success) {
          dispatch(updateUserLikes({
            userId,
            type: "like"
          }))
          dispatch(globalActions.GetChats({ callback: () => { } }));
          dispatch(globalActions.getLikesUsers({ callback: () => { } }));
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
          dispatch(updateUserLikes({
            userId,
            type: "unlike"
          }))
        }
      }
    }));
    //dispatch(setLoader(false));

  }



  //[images.dummy_video5, images.dummy_video4, images.dummy_video2]
  return (
    <AppContainer>
      <Header />
      {/* <ScrollView snapToInterval={ITEM_HEIGHT} decelerationRate={"fast"} bounces={false} disableIntervalMomentum > */}
      {/* <RefreshControl
        onRefresh={() => refreshPosts()}
        refreshing={loading}
        style={{ flex: 1 }}
      > */}
      <View style={{ flex: 1 }}>
        {
          loading || dashLoading ?
            <View style={{ height: ITEM_HEIGHT, justifyContent: "center", alignItems: 'center', }}>
              <LottieView autoPlay loop resizeMode='contain' source={require("../../../assets/loading.json")} style={{ width: widthPercentageToDP(40), height: widthPercentageToDP(40) }} />
            </View>
            :
            dashboard?.data?.length > 0 ?
              <Swiper
                onSwipedRight={(index) => {
                  let user = dashboard?.data.find((f, i) => i == index);
                  Like(user?._id)
                }}
                onSwipedLeft={(index) => {
                  let user = dashboard?.data.find((f, i) => i == index);
                  unLike(user?._id)
                }}
                onSwipedTop={(index) => {
                  let user = dashboard?.data.find((f, i) => i == index);
                  SuperLike(user?._id)
                }}
                cards={dashboard?.data}
                overlayLabels={{
                  // bottom: {
                  //   element: <Animatable.View animation='bounceIn' delay={1000}><AdIcon name={"banckward"} size={60} color={colors.primary} /></Animatable.View>,/* Optional */
                  //   title: 'rewind',
                  //   style: {
                  //     wrapper: {
                  //       backgroundColor: 'rgba(8, 38, 205,0.5)',
                  //       flexDirection: 'column',
                  //       alignItems: 'center',
                  //       justifyContent: 'center',
                  //       height: ITEM_HEIGHT
                  //     },
                  //   }
                  // },
                  top: {
                    element: <Animatable.View animation='bounceIn'><AdIcon name={"star"} size={60} color={colors.primary} /></Animatable.View>,/* Optional */
                    title: 'superlike',
                    style: {
                      wrapper: {
                        backgroundColor: 'rgba(8, 38, 205,0.5)',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: ITEM_HEIGHT
                      }
                    }
                  },
                  left: {
                    element: <Animatable.View animation='bounceIn'><AdIcon name={"dislike1"} size={60} color={colors.primary} /></Animatable.View>,/* Optional */
                    title: 'pass',
                    style: {
                      wrapper: {
                        backgroundColor: 'rgba(8, 38, 205,0.5)',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: ITEM_HEIGHT
                      }
                    }
                  },
                  right: {
                    element: <Animatable.View animation='bounceIn'><AdIcon name={"like1"} size={60} color={colors.primary} /></Animatable.View>,/* Optional */
                    title: 'like',
                    style: {
                      wrapper: {
                        backgroundColor: 'rgba(8, 38, 205,0.5)',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: ITEM_HEIGHT
                      }
                    }
                  }
                }}
                inputOverlayLabelsOpacityRangeX={[0, 50, 50, 50, 50]}
                inputOverlayLabelsOpacityRangeY={[0, 50, 50, 50, 50]}
                outputCardOpacityRangeX={[0, 1, 1, 1, 1]}
                outputCardOpacityRangeY={[0, 1, 1, 1, 1]}
                animateOverlayLabelsOpacity
                renderCard={(card, cardIndex) => {
                  const videoSrc = helper.getMediaSource(card?.profileVideo);
                  const poster = helper.resolveMediaUrl(card?.profileVideoThumbnail || card?.profileImage);
                  //images.dummy_video5
                  return (
                    <View style={{
                      height: ITEM_HEIGHT,
                      width: widthPercentageToDP(100)
                    }}>
                      <Video
                        paused={cardIndex == currentIndex ? false : true}
                        repeat={true}
                        muted={true}
                        source={videoSrc || images.dummy_video5}
                        poster={poster || undefined}
                        posterResizeMode="cover"
                        resizeMode={'cover'}
                        style={{
                          ...StyleSheet.absoluteFill,
                          backgroundColor: 'black'
                        }}
                      />
                      <TouchableOpacity
                        activeOpacity={1}
                        style={styles.profileContent}
                        onPress={() => props.navigation.navigate('UserProfile', { userID: card?._id })}>
                        <LinearGradient
                          style={styles.profileOverlay}
                          colors={['#000000f5', 'transparent', '#000000f5']}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Typography
                              children={`${card?.firstName ? card?.firstName : "No"} ${card?.lastName ? card?.lastName : "Name"}`}
                              size={26}
                              color="#fff"
                              textType="bold"
                            />
                            {
                              card?.isVerified &&
                              <Image
                                source={IMAGES.verifiedIcon}
                                style={{ width: 20, height: 20, marginLeft: 20 }}
                              />
                            }
                          </View>
                          {
                            card?.socialMediaProfiles &&
                            <View
                              style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                gap: 10,
                                marginBottom: 10,
                              }}>
                              {
                                card?.socialMediaProfiles && Object.entries(card?.socialMediaProfiles).map((v, i) => {
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
                                            width: 30,
                                            height: 30,
                                          }}
                                        />
                                      </TouchableOpacity>
                                    )
                                })}
                            </View>
                          }
                          {
                            card?.address &&
                            <Typography
                              children={card?.address}
                              size={14}
                              color="#fff"
                              textType="regular"
                            />
                          }
                          <View
                            style={{
                              flexDirection: 'row',
                              flexWrap: 'wrap',
                              gap: 10,
                              marginTop: 10,
                            }}>
                            {card?.niche && card?.niche.map((i, index) => (
                              <View style={styles.profileBadge}>
                                <Typography children={helper.sentenceCase(i)} color="#fff" size={12} />
                              </View>
                            ))}
                          </View>


                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )
                }}
                onSwiped={(cardIndex) => {
                  setCIndex(cardIndex)
                }}
                onSwipedAll={() => {
                  dispatch(emptyDashData())
                }}
                cardIndex={0}
                backgroundColor={'#fff'}
                stackSize={3}
                cardVerticalMargin={0}
                cardHorizontalMargin={0}
                marginBottom={0}
                marginTop={0}
              >
              </Swiper>
              :
              <View style={{ height: ITEM_HEIGHT, justifyContent: "center", alignItems: 'center', }}>
                <Typography children={"No Users"} textType='bold' size={30} color={colors.primary} />
              </View>
        }
      </View>
      {/* </RefreshControl> */}
      {/* </ScrollView> */}
    </AppContainer>
  );
};

export default Home;

const styles = StyleSheet.create({
  profileContent: {
    height: '100%',
    width: "100%",
  },
  profileOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 30,
  },
  profileBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
  },
});
