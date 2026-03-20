import { useNavigation } from "@react-navigation/native";
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { IMAGES } from '../../../constants/images';

const Header = () => {
  const navigation = useNavigation();
  return (
    <View style={styles.header}>
      <View style={styles.headerIcon} />
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Image source={IMAGES.logo} style={styles.headerLogo} />
      </View>
      <TouchableOpacity onPress={() => navigation.navigate("Notifications")}>
        <Image source={IMAGES.bellIcon} style={styles.headerIcon} />
      </TouchableOpacity>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '10%',
    maxHeight: 120,
    paddingHorizontal: 20,
  },
  headerLogo: { height: 40, width: 100, resizeMode: 'contain' },
  headerIcon: { height: 20, width: 20 },
});
