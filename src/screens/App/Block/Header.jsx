import React from 'react';
import {StyleSheet, View, Image, TouchableOpacity} from 'react-native';
import {IMAGES} from '../../../constants/images';
import {Typography} from '../../../components/Typography';

const Header = (props) => {
  return (
    <View
      style={ styles.header }>
      <View style={{flexDirection: 'row', gap: 5}}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => props.navigation.goBack()}>
          <Image
            source={IMAGES.backBtnDark}
            style={{
              width: 20,
              height: 20,
            }}
          />
        </TouchableOpacity>
      </View>
      <Image
        source={IMAGES.logo}
        style={{
          width: 100,
          height: 30,
          resizeMode: 'contain',
        }}
      />
      <View style={{flexDirection: 'row', gap: 5}}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => props.navigation.navigate('Notifications')}>
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
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLogo: {height: 40, width: 100, resizeMode: 'contain'},
  headerIcon: {height: 35, width: 35},
});
