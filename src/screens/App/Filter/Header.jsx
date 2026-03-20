import React from 'react';
import {StyleSheet, View, Image, TouchableOpacity} from 'react-native';
import {IMAGES} from '../../../constants/images';
import { Typography } from '../../../components/Typography';

const Header = (props) => {
  return (
    <View
      style={{
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
      <Typography children={'Filters'} textType="bold" size={24} />
      <View style={{flexDirection: 'row', gap: 5}}>
        <TouchableOpacity
          activeOpacity={1}
          style={{}}
          onPress={() => props.navigation.navigate('Notifications') }>
          <Image
            source={IMAGES.bellIcon}
            style={{
              width: 20,
              height: 20,
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
  headerLogo: {height: 40, width: 100, resizeMode: 'contain'},
  headerIcon: {height: 35, width: 35},
});
