import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { IMAGES } from '../../constants/images';
import { Typography } from '../Typography';

const SimpleHeader = (props: any) => {
  const { backBtn = true } = props;
  return (
    <View
      style={styles.header}>
      {backBtn && <View style={{ flexDirection: 'row', gap: 5 }}>
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
      </View>}
      {props.title ? <Typography children={props.title} size={20} textType='bold' /> : <Image
        source={IMAGES.logo}
        style={{
          width: 100,
          height: 30,
          resizeMode: 'contain',
        }}
      />}
      <View style={{ flexDirection: 'row', gap: 5, width: 20 }}>
        {props.notificationBtn && <TouchableOpacity
          activeOpacity={1}
          onPress={() => props.navigation.navigate('Notifications')}>
          <Image
            source={IMAGES.bellIcon}
            style={{
              width: 20,
              height: 20,
            }}
          />
        </TouchableOpacity>}
      </View>
    </View>
  );
};

export default SimpleHeader;

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
