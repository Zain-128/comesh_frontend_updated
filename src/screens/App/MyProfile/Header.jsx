import React from 'react';
import {StyleSheet, View, Image} from 'react-native';
import {IMAGES} from '../../../constants/images';

const Header = () => {
  return (
    <View style={styles.header}>
      <View style={styles.headerIcon} />
      <View style={{flex: 1, alignItems: 'center'}}>
        <Image source={IMAGES.logo} style={styles.headerLogo} />
      </View>
      <Image source={IMAGES.location} style={styles.headerIcon} />
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
