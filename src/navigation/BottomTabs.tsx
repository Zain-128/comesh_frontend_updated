import React, { useEffect } from "react";
import { StyleSheet, View, TouchableOpacity, Platform, Image } from "react-native";
import { IMAGES } from "../constants/images";


const BottomTabs = (props: any) => {
  
    useEffect(() => {
    //   props.navigation.setOptions({tabBarVisible: false})
    }, [])
  
    return (
      <View style={[styles.tabContainer]}>
        {BOTTOMTABS.map((i, index) => {
          const isActive = i.key === props.state.index;
          return (
            <TouchableOpacity
              key={index}
              style={styles.tabView}
              onPress={() => props.navigation.navigate(i.navigateTo)}
            >
                {isActive ? i.imageActive : i.image}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };
  
  export default BottomTabs;
  
  const styles = StyleSheet.create({
    tabContainer: {
      flexDirection: "row",
      backgroundColor: '#fff',
      borderTopLeftRadius: 10,
      borderTopRightRadius: 10,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 10,
    },
    tabView: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        ios: {
          paddingBottom: 10,
          height: 70,
        },
        android: {
          paddingBottom: 10,
          height: 70,
        },
        default: {
          height: 70,
        },
      }),
    },
    tabIcon: {
      width: 26,
      height: 26
    },
    homeTabIcon: {
      width: 45,
      height: 45
    }
  });
  
  const BOTTOMTABS = [
    {
      key: 0,
      title: "Chat",
      navigateTo: "Chat",
      image: <Image source={ IMAGES.chatIcon } style={styles.tabIcon} />,
      imageActive: <Image source={ IMAGES.activeChatIcon } style={styles.tabIcon} />,
    },
    {
      key: 1,
      title: "Filter",
      navigateTo: "Filter",
      image: <Image source={ IMAGES.filterIcon } style={styles.tabIcon} />,
      imageActive: <Image source={ IMAGES.activeFilterIcon } style={styles.tabIcon} />,
    },
    {
      key: 2,
      title: "Home",
      navigateTo: "Home",
      image: <Image source={ IMAGES.homeIcon } style={styles.homeTabIcon} />,
      imageActive: <Image source={ IMAGES.homeIcon } style={styles.homeTabIcon} />,
    },
    {
      key: 3,
      title: "MyProfile",
      navigateTo: "MyProfile",
      image: <Image source={ IMAGES.profileIcon } style={styles.tabIcon} />,
      imageActive: <Image source={ IMAGES.activeProfileIcon } style={styles.tabIcon} />,
    },
    {
      key: 4,
      title: "Settings",
      navigateTo: "Settings",
      image: <Image source={ IMAGES.settingIcon } style={styles.tabIcon} />,
      imageActive: <Image source={ IMAGES.activeSettingIcon } style={styles.tabIcon} />,
    },
  ];