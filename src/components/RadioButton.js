import React, { useEffect, useState } from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { widthPercentageToDP } from 'react-native-responsive-screen';
import { Typography } from './Typography';

const RadioButton = (props) => {

  const [checked, setCheck] = useState(props?.checked || false);

  useEffect(() => {
    setCheck(props?.checked);
  }, [props?.checked])

  return (
    <TouchableOpacity onPress={() => {
      if (props.onPress)
        props.onPress(!checked)
      else
        setCheck(!checked)
    }}>
      <View style={{ flexDirection: 'row', paddingVertical: 5, gap: 10, alignItems: 'center' }}>
        <Image style={{ width: widthPercentageToDP(5), height: widthPercentageToDP(5), resizeMode: "contain" }} source={checked ? require("../assets/images/check.png") : require("../assets/images/uncheck.png")} />
        <Typography textType='medium'>{props.label}</Typography>
      </View>
    </TouchableOpacity>
  )
};

export default RadioButton;
