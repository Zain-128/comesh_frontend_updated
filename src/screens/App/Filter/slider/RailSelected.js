import React, {memo} from 'react';
import {StyleSheet, View} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../../../constants/colors';

const RailSelected = () => {
  return (
    <LinearGradient
      style={styles.root}
      start={{x: 0, y: 0}}
      end={{x: 1, y: 0}}
      colors={[colors.primary, colors.secondary]}
    />
  );
};

export default memo(RailSelected);

const styles = StyleSheet.create({
  root: {
    height: 4,
    borderRadius: 2,
  },
});
