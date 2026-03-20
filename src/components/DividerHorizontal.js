import {View} from 'react-native';
import React from 'react';
import {heightPercentageToDP} from 'react-native-responsive-screen';

const DividerHorizontal = ({
  w = '100%',
  h = 0.4,
  bg = 'grey',
  style,
  mt = heightPercentageToDP(2),
}) => {
  return (
    <View
      style={{
        width: w,
        height: h,
        marginTop: mt,
        backgroundColor: bg,
        alignSelf: 'center',
        ...style,
      }}
    />
  );
};

export default DividerHorizontal;
