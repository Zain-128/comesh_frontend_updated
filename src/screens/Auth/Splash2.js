import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { widthPercentageToDP } from 'react-native-responsive-screen';

import images from '../../assets/images/index';
import colors from '../../constants/colors';

const Splash2 = () => {
  const navigation = useNavigation();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainStack' }],
        });
      });
    }, 3000);
    return () => clearTimeout(t);
  }, [animatedValue, navigation]);

  return (
    <>
      <ImageBackground
        source={require('../../assets/images/splash2-bgg.png')}
        resizeMode="cover"
        style={styles.container}
      />
      <Animated.View
        style={[
          styles.logoBlock,
          {
            transform: [
              {
                scale: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            ],
          },
        ]}>
        <View style={styles.logoInner}>
          <Image source={images.Logo} style={styles.videoWrapper} />
        </View>
        <View style={styles.taglineWrap}>
          <Text style={styles.tagline}>Swipe Match · Create together</Text>
        </View>
      </Animated.View>
    </>
  );
};

export default Splash2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
  },
  logoBlock: {
    position: 'absolute',
    alignSelf: 'center',
    top: '36%',
    alignItems: 'center',
  },
  logoInner: {
    width: widthPercentageToDP(30),
    height: widthPercentageToDP(30),
    borderRadius: widthPercentageToDP(2),
    overflow: 'hidden',
  },
  taglineWrap: {
    marginTop: widthPercentageToDP(3),
    alignItems: 'center',
  },
  tagline: {
    color: colors.white,
    textAlign: 'center',
    fontSize: widthPercentageToDP(3.6),
    fontWeight: '600',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
