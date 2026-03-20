import React from 'react';
import { Image, Platform, StatusBar, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { heightPercentageToDP } from 'react-native-responsive-screen';
import colors from '../constants/colors';
import Header from './Headers/Header';

const Container = (props) => {

  return (
    <View style={{ flex: 1 }}>
      <StatusBar backgroundColor={"transparent"} translucent barStyle={"light-content"} />
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={[colors.primary, colors.secondary]}
        style={{ flex: props.header ? props?.steps ? 0.4 : 0.4 : 0.2, paddingTop: Platform.OS == "android" ? 50 : 0 }}
      >
        {
          props.header ?
            <View style={{ gap: heightPercentageToDP(4) }}>
              <Header right white {...props} />
              {
                props?.steps &&
                <Image source={props?.steps} style={{ width: "90%", height: 30, resizeMode: "contain", alignSelf: 'center', }} />
              }
            </View>
            : null
        }
      </LinearGradient>
      <View style={{ backgroundColor: "#fff", flex: 1, marginTop: "-20%", borderTopLeftRadius: 30, borderTopRightRadius: 30, ...props.style }}>
        {props.children}
      </View>
    </View>
  )
};

export default Container;
