import React from 'react';
import { Text } from 'react-native';

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

const weightForType: Record<
  NonNullable<Props['textType']>,
  `${number}` | 'normal' | 'bold'
> = {
  bold: '700',
  semiBold: '600',
  medium: '500',
  regular: '400',
  light: '300',
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

  const textStyle: any = {
    fontSize: size,
    color: color,
    textAlign: align,
    textTransform: capitalize ? 'capitalize' : 'none',
    fontWeight: weightForType[textType] ?? '400',
    ...style,
  };

  return (
    <Text style={textStyle} numberOfLines={numberOfLines}>
      {props.children}
    </Text>
  );
};
