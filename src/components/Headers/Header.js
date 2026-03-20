import { CommonActions, useNavigation } from '@react-navigation/native';
import React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import {
  heightPercentageToDP,
  widthPercentageToDP
} from 'react-native-responsive-screen';
import { useDispatch, useSelector } from "react-redux";
import images from '../../assets/images';
import userActions from '../../redux/actions/userActions';
import { setLoader } from '../../redux/globalSlice';
import Text from '../Text';

const Header = props => {


  const navigation = useNavigation();
  const dispatch = useDispatch();
  const userProfile = useSelector(state => state.user.userRegister);


  const CreateAccount = async () => {
    dispatch(setLoader(true))
    await dispatch(userActions.UpdateProfile({
      ...userProfile,
      isFirstTime: true,
      callback: (data) => {
        props.navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              { name: 'GestureGuide' },
            ],
          })
        )
      }
    }))
    dispatch(setLoader(false))
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: heightPercentageToDP(8),
        paddingHorizontal: '5%',
      }}>
      {
        !props?.left ?
          <TouchableOpacity onPress={() => {
            if (props?.onBack)
              props.onBack();
            else
              navigation.goBack()
          }}>
            <Image
              source={images.back_arrow}
              style={{
                width: widthPercentageToDP(7),
                height: widthPercentageToDP(7),
                resizeMode: 'contain',
                tintColor: props?.white ? '#fff' : '#000',
              }}
            />
          </TouchableOpacity>
          :
          <TouchableOpacity>
            <View
              style={{
                width: widthPercentageToDP(7),
                height: widthPercentageToDP(7),
                resizeMode: 'contain',
              }}
            />
          </TouchableOpacity>
      }
      <Image
        style={{
          width: widthPercentageToDP(20),
          height: widthPercentageToDP(14),
          resizeMode: 'contain',
          tintColor: props?.white ? '#fff' : null,
        }}
        source={images.SLogo}
      />
      <View>
        {props?.right ? (
          <TouchableOpacity onPress={() => {
            if (props?.SkipToScreen)
              navigation.navigate(props?.SkipToScreen)
            else
              props?.onSkip()
          }}>
            <Text style={{ color: props?.white ? '#fff' : '#000' }}>Skip</Text>
          </TouchableOpacity>
        ) : <View style={{ width: 30 }} />}
      </View>
    </View>
  )
};

export default Header;
