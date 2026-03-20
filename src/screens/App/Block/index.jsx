import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from 'react-redux';
import PrimaryButton from '../../../components/Buttons/PrimaryButton';
import RadioButton from '../../../components/RadioButton';
import { Typography } from '../../../components/Typography';
import { AppContainer } from '../../../components/layouts/AppContainer';
import colors from '../../../constants/colors';
import { fontsFamily } from '../../../constants/fonts';
import globalActions from '../../../redux/actions/globalActions';
import { setLoader } from '../../../redux/globalSlice';
import Header from './Header';

const BLOCK_REASONS = [
  `I just don't want him/her to see me`,
  `Underage user`,
  `Inappropriate content`,
  `The user asked for money`,
  `Something else`,
];

const REPORT_REASONS = [
  `Fake Profile`,
  `Inappropriate content`,
  `Underage user`,
  `The user asked for money`,
  `Something else`,
];

const Block = props => {

  const { report = false, userID = "" } = props.route?.params || {};

  const [option, setOption] = useState();
  const [reason, setReason] = useState('');
  const { othersProfile } = useSelector(state => state.globalState);
  const dispatch = useDispatch();


  useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  const Block = () => {
    let value = option == BLOCK_REASONS[BLOCK_REASONS.length - 1] ? reason : option;
    Alert.alert("Block User", "Are you sure you want to block this user?", [
      {
        text: "Yes, Block this user",
        onPress: async () => {
          dispatch(setLoader(true))
          await dispatch(globalActions.blockUser({
            userId: userID,
            reason: value,
            callback: (data) => {
              if (data.success) {
                Toast.show({
                  text1: "Blocked",
                  text2: "User has been blocked",
                  type: "success"
                })
                props.navigation.goBack();
                props.navigation.goBack();
              }
            }
          }));
          dispatch(setLoader(false));
        }
      },
      {
        text: "No"
      }
    ], {
      cancelable: true
    })

  }

  const Report = () => {
    let value = option == REPORT_REASONS[REPORT_REASONS.length - 1] ? reason : option;
    Alert.alert("Report User", "Are you sure you want to report this user?", [
      {
        text: "Yes, Report this user",
        onPress: async () => {
          dispatch(setLoader(true))
          await dispatch(globalActions.reportUser({
            userId: userID,
            reason: value,
            callback: (data) => {
              if (data.success) {
                Toast.show({
                  text1: "Reported",
                  text2: "User has been reported",
                  type: "success"
                })
                props.navigation.goBack();
                props.navigation.goBack();
              }
            }
          }));
          dispatch(setLoader(false));
        }
      },
      {
        text: "No"
      }
    ], {
      cancelable: true
    })

  }


  return (
    <AppContainer>
      <Header {...props} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 30 }}>
        <Typography size={22} textType="bold" align="center">
          {report ? `Reporting ` : `Blocking `}
          <Typography
            textType="bold"
            children={othersProfile?.firstName + " " + othersProfile?.lastName + "?"}
            color={colors.secondary}
            align="center"
          />
        </Typography>
        <Typography
          children={`Tell us why you are ${report ? `reporting` : `blocking`} ${othersProfile?.firstName}. \n Don't worry we won't tell them`}
          color={'#999B9F'}
          align="center"
          size={16}
          style={{ marginVertical: 20 }}
        />

        <View style={{ gap: 20, marginTop: 20 }}>
          {(report ? REPORT_REASONS : BLOCK_REASONS).map(i => (
            <RadioButton
              label={i}
              onPress={() => setOption(i)}
              checked={option == i}
            />
          ))}
        </View>

        {
          option == BLOCK_REASONS[BLOCK_REASONS.length - 1] || option == REPORT_REASONS[REPORT_REASONS.length - 1] ?
            <TextInput
              editable
              multiline
              numberOfLines={4}
              maxLength={40}
              onChangeText={setReason}
              value={reason}
              placeholder="Write your reason"
              placeholderTextColor={'#7f7f7f'}
              verticalAlign="top"
              textAlignVertical="top"
              style={{
                height: 100,
                padding: 10,
                fontFamily: fontsFamily.regular,
                marginVertical: 20,
                borderWidth: 1,
                borderColor: '#E8E8E8',
                borderRadius: 10,
                backgroundColor: '#fff',
                shadowColor: '#7f7f7f',
                shadowOffset: {
                  width: 0,
                  height: 3,
                },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
              }}
            />
            : null
        }


        <PrimaryButton text={`Submit Request`} onPress={() => {
          if (report)
            Report()
          else
            Block();
        }} />

        <TouchableOpacity
          onPress={() => props.navigation.goBack()}
          style={styles.cancelBtn}>
          <Typography children={'Cancel'} />
        </TouchableOpacity>
      </ScrollView>
    </AppContainer>
  );
};

export default Block;

const styles = StyleSheet.create({
  cancelBtn: {
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
  },
});
