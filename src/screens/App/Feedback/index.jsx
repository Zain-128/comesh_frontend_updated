import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View
} from 'react-native';
import { Rating } from 'react-native-ratings';
import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen';
import Toast from "react-native-toast-message";
import { useDispatch, useSelector } from 'react-redux';
import PrimaryButton from '../../../components/Buttons/PrimaryButton';
import { Typography } from '../../../components/Typography';
import { AppContainer } from '../../../components/layouts/AppContainer';
import { fontsFamily } from '../../../constants/fonts';
import { IMAGES } from '../../../constants/images';
import globalActions from '../../../redux/actions/globalActions';
import { setLoader } from '../../../redux/globalSlice';
import Header from './Header';

const BLOCK_REASONS = [
  `I've found a life partner on intro LLC`,
  `I've found a life partner somewhere else`,
  `I want to take a break`,
  `I don't like intro`,
  `Something else`,
];

const Deactivate = props => {



  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const { othersProfile } = useSelector(state => state.globalState);
  const { userData } = useSelector(state => state.user);
  const dispatch = useDispatch();


  useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  const Send = async () => {
    dispatch(setLoader(true))
    await dispatch(globalActions.RateSendFeedback({
      feedback,
      rating,
      callback: (data) => {
        if (data.success) {
          Toast.show({
            text1: "Submitted",
            text2: "Thank you for your feedback",
            type: "success"
          })
          props.navigation.goBack();
        }
      }
    }));
    dispatch(setLoader(false));

  }


  return (
    <AppContainer>
      <Header title='Rate & Feedback' {...props} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 30 }}>
        <Image style={{ width: widthPercentageToDP(45), height: widthPercentageToDP(20), resizeMode: "contain", alignSelf: 'center', }} source={IMAGES.logo} />
        <View style={{ gap: 20, marginTop: heightPercentageToDP(10) }}>
          <Rating
            ratingCount={5}
            startingValue={5}
            imageSize={60}
            onFinishRating={(rate) => setRating(rate)}
          />
          <Typography size={22} textType="bold" align="center">
            {`Rate Your Experience`}
          </Typography>
          <TextInput
            editable
            multiline
            numberOfLines={4}
            maxLength={40}
            onChangeText={(text) => setFeedback(text)}
            value={feedback}
            placeholder="Tell us about your experience"
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
        </View>
        <PrimaryButton text={`Submit`} onPress={() => {
          Send();
        }} />
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
