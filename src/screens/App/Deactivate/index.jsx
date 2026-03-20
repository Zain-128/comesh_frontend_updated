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
import { fontsFamily } from '../../../constants/fonts';
import globalActions from '../../../redux/actions/globalActions';
import { setLoader } from '../../../redux/globalSlice';
import { logoutUser } from '../../../redux/userSlice';
import Header from './Header';

const BLOCK_REASONS = [
  `I've found a TikTok collab partner`,
  `Taking a break`,
  `No longer needed`,
  `Can’t find a TikTok partner`,
  `Something else`,
];

const Deactivate = props => {

  const { userID = "" } = props.route?.params || {};

  const [option, setOption] = useState();
  const [reason, setReason] = useState('');
  const { othersProfile } = useSelector(state => state.globalState);
  const dispatch = useDispatch();


  useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  const Deactive = () => {
    let value = option == BLOCK_REASONS[BLOCK_REASONS.length - 1] ? reason : option;
    if (!value) {
      Toast.show({
        text1: "Warning",
        text2: "Please select a reason to continue",
        type: "error"
      })
      return;
    }
    Alert.alert("Deactivate Account", "Are you sure you want to deactivate this account?", [
      {
        text: "Yes, Deactivate",
        onPress: async () => {
          dispatch(setLoader(true))
          await dispatch(globalActions.DeactivateAccount({
            reasreasonToDeleteAccounton: value,
            callback: () => {
              dispatch(logoutUser())
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
      <Header title='Deactivate Account' {...props} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 30 }}>
        <Typography size={22} textType="bold" align="center">
          {`Deactivation reason`}
        </Typography>
        <Typography
          children={`Please let us know why you're leaving us. 
We're always looking to improve and welcome your honest feedback`}
          color={'#999B9F'}
          align="center"
          size={15}
          style={{ marginVertical: 20 }}
        />

        <View style={{ gap: 20, marginVertical: 20 }}>
          {(BLOCK_REASONS).map(i => (
            <RadioButton
              label={i}
              onPress={() => setOption(i)}
              checked={option == i}
            />
          ))}
        </View>

        {
          option == BLOCK_REASONS[BLOCK_REASONS.length - 1] ?
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
          Deactive();
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

export default Deactivate;

const styles = StyleSheet.create({
  cancelBtn: {
    marginTop: 10,
    padding: 10,
    alignItems: 'center',
  },
});
