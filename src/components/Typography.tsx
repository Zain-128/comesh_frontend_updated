import React from 'react';
import { Text } from 'react-native';
import { fontsFamily } from '../constants/fonts';

type Props = {
  textType?: 'bold' | 'semiBold' | 'medium' | 'regular' | 'light';
  size?: number;
  color?: string;
  align?: string;
  style?: Object;
  children: any;
  numberOfLines?: number;
  capitalize?: boolean;
};

export const Typography = (props: Props) => {
  const {
    textType = 'regular',
    size = undefined,
    color = '#242D39',
    align = 'left',
    style = {},
    numberOfLines = undefined,
    capitalize = false,
  } = props;

  let textStyle: any = {
    fontSize: size,
    color: color,
    textAlign: align,
    textTransform: capitalize ? 'capitalize' : 'none',
    ...style,
  };
  switch (textType) {
    case 'bold':
      textStyle.fontFamily = fontsFamily.bold;
      break;
    case 'semiBold':
      textStyle.fontFamily = fontsFamily.semibold;
      break;
    case 'medium':
      textStyle.fontFamily = fontsFamily.medium;
      break;
    case 'regular':
      textStyle.fontFamily = fontsFamily.regular;
      break;
    case 'light':
      textStyle.fontFamily = fontsFamily.light;
      break;
    default:
      textStyle.fontFamily = fontsFamily.regular;
      break;
  }

  return (
    <Text style={textStyle} numberOfLines={numberOfLines}>
      {props.children}
    </Text>
  );
};
