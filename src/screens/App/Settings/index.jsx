import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen';
import { Switch } from 'react-native-switch';
import Toast from "react-native-toast-message";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch } from "react-redux";
import PrimaryButton from '../../../components/Buttons/PrimaryButton';
import { Typography } from '../../../components/Typography';
import { AppContainer } from '../../../components/layouts/AppContainer';
import colors from '../../../constants/colors';
import { ContentType } from '../../../constants/endPoints';
import { fontsFamily, fontsSize } from '../../../constants/fonts';
import { logoutUser } from '../../../redux/userSlice';
import chatSocket from '../../../utils/chatSocket';
import Header from './Header';

const Settings = props => {
  useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  const dispatch = useDispatch();
  const [loggingOut, setLoggingOut] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [mode, setMode] = useState(false);


  const logout = () => {
    chatSocket.disconnect();
    dispatch(logoutUser())
  }

  return (
    <AppContainer>
      <Header {...props} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: heightPercentageToDP(3) }}>
        <Typography children={"Personal Information"} size={17} textType='semiBold' />
        <View style={{ gap: 15, backgroundColor: "#fff", shadowColor: "#999", shadowOffset: { height: 5, width: 5 }, shadowOpacity: 0.4, shadowRadius: 5, elevation: 10, padding: 20, borderRadius: 20 }}>
          <TouchableOpacity
            onPress={() => props.navigation.navigate('Subscription')}>
            <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
              <Typography children={"Subscription"} textType='semiBold' />
              <MaterialCommunityIcons size={23} color='#5c5c5c' name='chevron-right' />
            </View>
          </TouchableOpacity>
          {/* <View style={{ width: "100%", height: 1, backgroundColor: "#ddd" }} />
          <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
            <Typography children={"Change Password"} textType='semiBold' />
            <MaterialCommunityIcons size={23} color='#5c5c5c' name='chevron-right' />
          </View> */}
        </View>
        <Typography children={"Application"} size={17} textType='semiBold' />
        <View style={{ gap: 15, backgroundColor: "#fff", shadowColor: "#999", shadowOffset: { height: 5, width: 5 }, shadowOpacity: 0.4, shadowRadius: 5, elevation: 10, padding: 20, borderRadius: 20 }}>
          <TouchableOpacity onPress={() => props.navigation.navigate("Notifications")}>
            <View style={{ flexDirection: 'row', justifyContent: "space-between", alignItems: 'center', }}>
              <Typography children={"Notifications"} textType='semiBold' />
              <Switch
                value={notifications}
                onValueChange={(val) => setNotifications(val)}
                disabled={false}
                activeText={'On'}
                inActiveText={'Off'}
                circleSize={25}
                //barHeight={1}
                circleBorderActiveColor={colors.primary}
                circleBorderInactiveColor={"#ccc"}
                circleBorderWidth={1}
                backgroundActive={colors.primaryLight}
                backgroundInactive={'#ddd'}
                circleActiveColor={colors.primaryLightExtra}
                circleInActiveColor={colors.primaryLightExtra}
                // renderInsideCircle={() => <CustomComponent />} // custom component to render inside the Switch circle (Text, Image, etc.)
                changeValueImmediately={true} // if rendering inside circle, change state immediately or wait for animation to complete
                innerCircleStyle={{ alignItems: "center", justifyContent: "center" }} // style for inner animated circle for what you (may) be rendering inside the circle
                outerCircleStyle={{}} // style for outer animated circle
                renderActiveText={false}
                renderInActiveText={false}
                switchLeftPx={2} // denominator for logic when sliding to TRUE position. Higher number = more space from RIGHT of the circle to END of the slider
                switchRightPx={2} // denominator for logic when sliding to FALSE position. Higher number = more space from LEFT of the circle to BEGINNING of the slider
                switchWidthMultiplier={2} // multiplied by the `circleSize` prop to calculate total width of the Switch
                switchBorderRadius={30} // Sets the border Radius of the switch slider. If unset, it remains the circleSize.
              />
            </View>
          </TouchableOpacity>
          {/* <View style={{ width: "100%", height: 1, backgroundColor: "#ddd" }} />
          <View style={{ flexDirection: 'row', justifyContent: "space-between", alignItems: 'center', }}>
            <Typography children={"Dark Mode"} textType='semiBold' />
            <Switch
              value={mode}
              onValueChange={(val) => setMode(val)}
              disabled={false}
              activeText={'On'}
              inActiveText={'Off'}
              circleSize={25}
              //barHeight={1}
              circleBorderActiveColor={colors.primary}
              circleBorderInactiveColor={"#ccc"}
              circleBorderWidth={1}
              backgroundActive={colors.primaryLight}
              backgroundInactive={'#ddd'}
              circleActiveColor={colors.primaryLightExtra}
              circleInActiveColor={colors.primaryLightExtra}
              // renderInsideCircle={() => <CustomComponent />} // custom component to render inside the Switch circle (Text, Image, etc.)
              changeValueImmediately={true} // if rendering inside circle, change state immediately or wait for animation to complete
              innerCircleStyle={{ alignItems: "center", justifyContent: "center" }} // style for inner animated circle for what you (may) be rendering inside the circle
              outerCircleStyle={{}} // style for outer animated circle
              renderActiveText={false}
              renderInActiveText={false}
              switchLeftPx={2} // denominator for logic when sliding to TRUE position. Higher number = more space from RIGHT of the circle to END of the slider
              switchRightPx={2} // denominator for logic when sliding to FALSE position. Higher number = more space from LEFT of the circle to BEGINNING of the slider
              switchWidthMultiplier={2} // multiplied by the `circleSize` prop to calculate total width of the Switch
              switchBorderRadius={30} // Sets the border Radius of the switch slider. If unset, it remains the circleSize.
            />
          </View> */}
          <View style={{ width: "100%", height: 1, backgroundColor: "#ddd" }} />
          <TouchableOpacity onPress={() => props.navigation.navigate("Feedback")}>
            <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
              <Typography children={"Rate & Feedback"} textType='semiBold' />
              <MaterialCommunityIcons size={23} color='#5c5c5c' name='chevron-right' />
            </View>
          </TouchableOpacity>
        </View>
        <Typography children={"Account Settings"} size={17} textType='semiBold' />
        <View style={{ gap: 15, backgroundColor: "#fff", shadowColor: "#999", shadowOffset: { height: 5, width: 5 }, shadowOpacity: 0.4, shadowRadius: 5, elevation: 10, padding: 20, borderRadius: 20 }}>
          <TouchableOpacity onPress={() => props.navigation.navigate("Policies", { title: "About Us", type: ContentType.ABOUT_US })}>
            <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
              <Typography children={"About Us"} textType='semiBold' />
              <MaterialCommunityIcons size={23} color='#5c5c5c' name='chevron-right' />
            </View>
          </TouchableOpacity>
          <View style={{ width: "100%", height: 1, backgroundColor: "#ddd" }} />
          <TouchableOpacity onPress={() => props.navigation.navigate("Policies", { title: "Terms & Conditions", type: ContentType.TERMS_AND_CONDITIONS })}>
            <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
              <Typography children={"Terms & Conditions"} textType='semiBold' />
              <MaterialCommunityIcons size={23} color='#5c5c5c' name='chevron-right' />
            </View>
          </TouchableOpacity>
          <View style={{ width: "100%", height: 1, backgroundColor: "#ddd" }} />
          <TouchableOpacity onPress={() => props.navigation.navigate("Policies", { title: "Privacy Policy", type: ContentType.PRIVACY_POLICY })}>
            <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
              <Typography children={"Privacy Policy"} textType='semiBold' />
              <MaterialCommunityIcons size={23} color='#5c5c5c' name='chevron-right' />
            </View>
          </TouchableOpacity>
          <View style={{ width: "100%", height: 1, backgroundColor: "#ddd" }} />
          <TouchableOpacity onPress={() => props.navigation.navigate("Deactivate")}>
            <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
              <Typography children={"Deactivate Account"} textType='semiBold' />
              <MaterialCommunityIcons size={23} color='#5c5c5c' name='chevron-right' />
            </View>
          </TouchableOpacity>
          <View style={{ width: "100%", height: 1, backgroundColor: "#ddd" }} />
          <TouchableOpacity onPress={() => {
            setLoggingOut(true)
          }}>
            <View style={{ flexDirection: 'row', justifyContent: "space-between" }}>
              <Typography children={"Logout"} textType='semiBold' />
              <MaterialCommunityIcons size={23} color='#5c5c5c' name='chevron-right' />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Modal visible={loggingOut} transparent animationType='fade'>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)", justifyContent: "center", alignItems: 'center', }}>
          <View style={{ backgroundColor: "#fff", borderRadius: 20, width: widthPercentageToDP(90), padding: widthPercentageToDP(10), gap: heightPercentageToDP(5) }}>
            <View style={{ alignItems: 'center', justifyContent: "center", gap: 10 }}>
              <Typography textType='bold' size={30}>
                Logout
              </Typography>
              <Typography color='#aaa'>
                Are you sure you want to logout?
              </Typography>
            </View>
            <View style={{ gap: 20 }}>
              <PrimaryButton text={"Yes, Log me out"} onPress={() => logout()} />
              <TouchableOpacity style={{ alignItems: 'center', }} onPress={() => setLoggingOut(false)}>
                <Typography textType='semiBold' color='#aaa'>
                  NO
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AppContainer >
  );
};

export default Settings;

const styles = StyleSheet.create({
  divider: { height: 1, width: '100%', backgroundColor: '#E5E5E5' },
  settingCard: {
    marginVertical: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    shadowColor: '#7f7f7f',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  settingItem: {
    paddingVertical: 15,
  },
  text: {
    fontSize: fontsSize.lg1,
    fontFamily: fontsFamily.semibold,
    color: "#999",
  },
});