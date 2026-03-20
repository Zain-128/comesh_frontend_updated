import React from 'react';
import { Text as RNText } from 'react-native';
import colors from '../constants/colors';

const Text = (props) => (
  <RNText {...props} style={{ color: colors.textDark, ...props.style }}>{props.children}</RNText>
);

export default Text;
