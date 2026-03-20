import React from 'react';
import {
  StatusBar,
  StyleSheet,
  View
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../constants/colors';

export const AppContainer = (props: any) => {
  const { children } = props;

  return (
    <View style={{ flex: 1 }}>
      <StatusBar
        backgroundColor={'transparent'}
        translucent
        barStyle={'light-content'}
      />
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={[colors.primary, colors.secondary]}
        style={{ height: (StatusBar.currentHeight || 0) + 20 }}>
        {/* {
        props.header ?
          <View style={{ gap: heightPercentageToDP(4) }}>
            <Header right white />
            {
              props?.steps &&
              <Image source={props?.steps} style={{ width: "90%", height: 30, resizeMode: "contain", alignSelf: 'center', }} />
            }
          </View>
          : null
      } */}
      </LinearGradient>
      <View
        style={{
          backgroundColor: '#fff',
          flex: 1,
          marginTop: -20,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          overflow: 'hidden',
          ...props.style,
        }}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
});
