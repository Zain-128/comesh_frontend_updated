import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';

// local import
import colors from '../../constants/colors';
import { fontsFamily, fontsSize } from '../../constants/fonts';

const PrimaryButton = ({ text, onPress, disabled = false, ...props }) => {
  return (
    <TouchableOpacity
      disabled={disabled}
      activeOpacity={0.9}
      style={[styles.button(disabled), { ...props.style }]}
      onPress={onPress}>
      <LinearGradient
        start={{ x: 0, y: 0.75 }}
        end={{ x: 1, y: 0.25 }}
        colors={[colors.primary, colors.secondary]}
        style={styles.linearGradient}>
        <Text style={styles.text}>{text}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default PrimaryButton;

const styles = StyleSheet.create({
  button: isValid => ({
    width: '100%',
    height: heightPercentageToDP(7),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: !isValid ? colors.primary : colors.textLight,
    borderRadius: widthPercentageToDP(100),
    marginTop: heightPercentageToDP(1),
    overflow: 'hidden',
  }),
  linearGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: fontsSize.lg1,
    fontFamily: fontsFamily.semibold,
    color: colors.onPrimary,
  },
});
