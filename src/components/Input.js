import React from 'react';
import { Image, TextInput, View } from 'react-native';
import { widthPercentageToDP } from 'react-native-responsive-screen';
import { fontsFamily } from '../constants/fonts';

const Input = (props) => (
  <View style={{
    backgroundColor: "#fff", borderRadius: props?.height ? 20 : 50, elevation: 5, shadowColor: "#999",
    shadowOffset: {
      height: 3,
      width: 3
    },
    shadowRadius: 5,
    shadowOpacity: 0.3, width: "100%", paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: widthPercentageToDP(2),
  }}>
    {
      props.leftImage &&
      <Image source={props.leftImage} style={{ width: widthPercentageToDP(10), height: widthPercentageToDP(10), resizeMode: "contain" }} />
    }
    <TextInput
      {...props}
      placeholderTextColor={"#787878"}
      style={{
        flex: 1, ...props.style, height: props?.height ? props.height : 60, fontFamily: fontsFamily.regular, textAlignVertical: props?.height ? "top" : "center", padding: props?.height ? 10 : 0, color: "#000"
      }}
    />
  </View>
);

export default Input;
