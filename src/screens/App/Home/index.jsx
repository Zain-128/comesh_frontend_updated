import LottieView from 'lottie-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Toast from 'react-native-toast-message';
import {
  Dimensions,
  Image,
  Linking,
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
import helper from "../../../utils/helper";
import Header from './Header';
import {
  performLike,
  performRewind,
  performSuperLike,
  performUnlike,
} from '../../../utils/likeMessagingActions';

const ITEM_HEIGHT = heightPercentageToDP(100) * 0.725;

const Home = props => {
  const { userData, token } = useSelector(state => state.user);
  const { dashboard, dashLoading, chats } = useSelector(state => state.globalState);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCIndex] = useState(0);
  const [canRewind, setCanRewind] = useState(false);
  const [rewinding, setRewinding] = useState(false);
  const [failedVideoIds, setFailedVideoIds] = useState([]);
  const swiperRef = useRef(null);
  const dispatch = useDispatch();
  const failedSet = useMemo(() => new Set(failedVideoIds), [failedVideoIds]);

  const activeUserId = useMemo(() => {
    const list = dashboard?.data;
    if (!Array.isArray(list) || !list.length) return null;
    const idx = Math.min(Math.max(0, currentIndex), list.length - 1);
    return list[idx]?._id ?? null;
  }, [dashboard?.data, currentIndex]);


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

  const SuperLike = (userId) =>
    performSuperLike({
      dispatch,
      userData,
      userId,
      navigation: props.navigation,
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

  const handleRewind = async () => {
    if (rewinding || !canRewind) return;
    setRewinding(true);
    const rewoundUser = await performRewind({ dispatch });
    setRewinding(false);
    if (rewoundUser?._id) {
      setCanRewind(false);
      setCIndex((idx) => Math.max(0, idx - 1));
      swiperRef.current?.swipeBack?.();
    }
  };
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
              <View style={{ flex: 1 }}>
              <Swiper
                ref={swiperRef}
                swipeBackCard
                onSwipedRight={(index) => {
                  setCanRewind(false);
                  let user = dashboard?.data.find((f, i) => i == index);
                  Like(user?._id)
                }}
                onSwipedLeft={(index) => {
                  setCanRewind(true);
                  let user = dashboard?.data.find((f, i) => i == index);
                  unLike(user?._id)
                }}
                onSwipedTop={(index) => {
                  setCanRewind(false);
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
                renderCard={(card) => {
                  const videoSrc = helper.getMediaSource(card?.profileVideo);
                  const poster = helper.resolveMediaUrl(card?.profileVideoThumbnail || card?.profileImage);
                  const shouldShowVideo = !!videoSrc && !failedSet.has(String(card?._id));
                  //images.dummy_video5
                  return (
                    <View style={{
                      height: ITEM_HEIGHT,
                      width: widthPercentageToDP(100),
                      alignSelf: 'stretch',
                      overflow: 'hidden',
                    }}>
                      <Video
                        paused={String(card?._id) !== String(activeUserId)}
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
                      <LinearGradient
                        pointerEvents="none"
                        style={styles.profileOverlayGradient}
                        colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']}
                        locations={[0, 0.35, 1]}
                      />
                      <TouchableOpacity
                        activeOpacity={1}
                        style={styles.profileContent}
                        onPress={() =>
                          props.navigation.navigate('UserProfile', {
                            userID: card?._id,
                            prefillName: helper.getUserDisplayName(card),
                          })
                        }>
                        <View style={styles.profileOverlayInner}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' , width :Dimensions.get('window').width * 1}}>
                            <Typography
                              children={helper.getUserDisplayName(card, "User")}
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
                        </View>
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
              {canRewind ? (
                <TouchableOpacity
                  style={styles.rewindBtn}
                  activeOpacity={0.85}
                  disabled={rewinding}
                  onPress={handleRewind}
                  accessibilityLabel="Rewind last pass">
                  <View style={styles.rewindBtnInner}>
                    <AdIcon name="banckward" size={26} color={colors.primary} />
                  </View>
                  <Typography
                    children="Rewind"
                    size={11}
                    textType="semiBold"
                    color={colors.primary}
                    style={styles.rewindLabel}
                  />
                </TouchableOpacity>
              ) : null}
              </View>
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
  profileOverlayGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '58%',
  },
  profileContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    justifyContent: 'flex-end',
  },
  profileOverlayInner: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 12,
  },
  profileBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 25,
    backgroundColor: colors.primaryLight,
  },
  rewindBtn: {
    position: 'absolute',
    right: 20,
    bottom: 36,
    alignItems: 'center',
    zIndex: 20,
  },
  rewindBtnInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  rewindLabel: {
    marginTop: 4,
  },
});
