import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Typography } from '../../../components/Typography';
import { IMAGES } from '../../../constants/images';

const Header = (props) => {
  return (
    <View
      style={styles.header}>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => props.navigation.goBack()}>
          <Image
            source={IMAGES.backBtnDark}
            style={{
              width: 25,
              height: 25,
            }}
          />
        </TouchableOpacity>
      </View>
      <Typography size={18} textType="bold" align="center">
        {props.title}
      </Typography>
      <View style={{
        flexDirection: 'row', gap: 5, width: 20,
        height: 20,
      }}>

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
  headerLogo: { height: 40, width: 100, resizeMode: 'contain' },
  headerIcon: { height: 35, width: 35 },
});
