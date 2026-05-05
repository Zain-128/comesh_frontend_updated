import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen';
import images from '../../assets/images';
import Text from '../../components/Text';
import colors from '../../constants/colors';

const GestureGuide = () => {
  const navigation = useNavigation();

  const onLeaveTutorial = () => {
    navigation.navigate('PostOnboardingSubscription');
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={[
          { desc: 'Pass this profile?', gesture: 'SWIPE LEFT' },
          { desc: 'Connect with Profile?', gesture: 'SWIPE RIGHT' },
          { desc: 'Super Like?', gesture: 'SWIPE UP' },
          { desc: 'Rewind Profiles?', gesture: 'SWIPE DOWN' },
        ]}
        pagingEnabled
        snapToInterval={widthPercentageToDP(100)}
        bounces={false}
        decelerationRate={'fast'}
        horizontal
        renderItem={({ item }) => {
          return (
            <View style={{ width: widthPercentageToDP(100) }}>
              <LinearGradient
                start={{ x: 0, y: 0 }}
                end={{ x: 0.8, y: 0.8 }}
                colors={[colors.primary, colors.secondary]}
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <View
                  style={{
                    gap: 30,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{ fontSize: 44, color: '#fff', fontWeight: 'bold' }}>
                    Easy to use!
                  </Text>
                  <View
                    style={{
                      gap: 10,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Text style={{ fontSize: 22, color: '#fff' }}>
                      {item.desc}
                    </Text>
                    <Text style={{ fontSize: 22, color: '#fff' }}>
                      {item.gesture}
                    </Text>
                  </View>
                  <View
                    style={{ justifyContent: 'center', alignItems: 'center' }}>
                    <LottieView
                      source={item.gesture === 'SWIPE RIGHT' ? images.swipeRight : images.swipeLeft}
                      style={{ width: heightPercentageToDP(40), height: heightPercentageToDP(40) }}
                      autoPlay
                      loop
                    />
                  </View>
                  <TouchableOpacity
                    onPress={onLeaveTutorial}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      borderWidth: 2,
                      borderColor: '#fff',
                      borderRadius: 50,
                      padding: '4%',
                      width: widthPercentageToDP(85),
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Text
                      style={{ fontSize: 16, color: '#fff', fontWeight: '500' }}>
                      Continue
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View >
          );
        }}
      />
    </View >
  );
};

export default GestureGuide;
