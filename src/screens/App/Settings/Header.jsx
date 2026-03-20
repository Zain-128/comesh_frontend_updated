import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { widthPercentageToDP } from 'react-native-responsive-screen';
import { Typography } from '../../../components/Typography';
import { IMAGES } from '../../../constants/images';

const Header = (props) => {
  return (
    <View
      style={{
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
      <Typography children={'Settings'} textType="bold" size={24} />
      <View style={{ flexDirection: 'row', gap: 5 }}>
        <TouchableOpacity
          activeOpacity={1}
          style={{ backgroundColor: "#fff", padding: widthPercentageToDP(3), borderRadius: 100, elevation: 5, shadowColor: "#999", shadowOffset: { height: 4, width: 4 }, shadowOpacity: 0.4, shadowRadius: 5 }}
          onPress={() => props.navigation.navigate('Notifications')}>
          <Image
            source={IMAGES.bellIcon}
            style={{
              width: 25,
              height: 25,
            }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '10%',
    maxHeight: 120,
    paddingHorizontal: 20,
  },
  headerLogo: { height: 40, width: 100, resizeMode: 'contain' },
  headerIcon: { height: 35, width: 35 },
});
