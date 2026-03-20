import {
  StyleSheet,
  View,
  Modal,
  ActivityIndicator,
  Animated,
} from 'react-native';
import React, {useEffect, useRef} from 'react';
import {useSelector} from 'react-redux';

const Loader = () => {
  const isLoader = useSelector(state => state.globalState.isLoader);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isLoader ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    return () => animatedValue.stopAnimation();
  }, [isLoader]);

  if (isLoader) {
    return (
      <Modal transparent>
        <View style={styles.container}>
          <Animated.View
            style={{
              transform: [
                {
                  scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                  }),
                },
              ],
            }}>
            <ActivityIndicator size={'large'} color="#fff" />
          </Animated.View>
        </View>
      </Modal>
    );
  }
  return null;
};

export default Loader;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});
