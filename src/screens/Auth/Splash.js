import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../constants/colors';

const MIN_SPLASH_MS = 1000;

const Splash = () => {
  const navigation = useNavigation();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await new Promise((r) => setTimeout(r, MIN_SPLASH_MS));
      if (!cancelled) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Splash2' }],
        });
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [navigation]);

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      style={styles.container}
    />
  );
};

export default Splash;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
