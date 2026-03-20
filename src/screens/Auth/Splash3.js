import {StyleSheet} from 'react-native';
import React, {useEffect} from 'react';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../constants/colors';
import {useNavigation} from '@react-navigation/native';

const Splash3 = () => {
  const navigation = useNavigation();
  useEffect(() => {
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{name: 'MainStack'}],
      });
    }, 1000);
  }, []);
  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      style={styles.container}></LinearGradient>
  );
};

export default Splash3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
