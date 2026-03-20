import React, {useState} from 'react';
import {useRef} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Keyboard,
} from 'react-native';
import EtIcon from 'react-native-vector-icons/Entypo';
import LinearGradient from 'react-native-linear-gradient';
import {formatWithMask} from 'react-native-mask-input';

import {AppContainer} from '../../../components/layouts/AppContainer';
import colors from '../../../constants/colors';
import {Typography} from '../../../components/Typography';
import PrimaryButton from '../../../components/Buttons/PrimaryButton';
import {IMAGES} from '../../../constants/images';
import SimpleHeader from '../../../components/Headers/SimpleHeader';
import {InputText} from '../../../components/InputText';
import { CommonActions } from '@react-navigation/native';

const expiryMask = [/\d/, /\d/, '/', /\d/, /\d/];
const cardMask = [
  /\d/,
  /\d/,
  /\d/,
  /\d/,
  ' ',
  /\d/,
  /\d/,
  /\d/,
  /\d/,
  ' ',
  /\d/,
  /\d/,
  /\d/,
  /\d/,
  ' ',
  /\d/,
  /\d/,
  /\d/,
  /\d/,
];

const CardDetails = props => {
  const [errors, setErrors] = useState({});

  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [save, setSave] = useState(false);

  const inputRef = useRef([]);

  return (
    <AppContainer>
      <SimpleHeader title={'Payment Details'} />
      <ScrollView
        style={{
          flex: 1,
        }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}>
        <CreditCard expiry={expiry} number={cardNumber} holder={name} />

        <View style={styles.formContainer}>
          <InputText
            label={'Card Holder Name'}
            labelColor={'#000'}
            placeholder={''}
            placeholderColor={'#000'}
            textColor={'#000'}
            onChangeText={text => setName(text)}
            value={name}
            error={errors.name}
            keyboardType={'default'}
            returnKeyType={'next'}
            inputRef={e => (inputRef['name'] = e)}
            style={{marginBottom: 20}}
            onSubmitEditing={() => inputRef['cardNumber']?.focus()}
          />

          <InputText
            label={'Card Number'}
            labelColor={'#000'}
            placeholder={'**** **** **** ****'}
            placeholderColor={'#000'}
            textColor={'#000'}
            onChangeText={text =>
              setCardNumber(
                formatWithMask({
                  text: text,
                  mask: cardMask,
                }).masked,
              )
            }
            value={cardNumber}
            error={errors.email}
            keyboardType={'number-pad'}
            returnKeyType={'next'}
            inputRef={e => (inputRef['cardNumber'] = e)}
            style={{marginBottom: 20}}
            onSubmitEditing={() => inputRef['password']?.focus()}
            rightIcon={
              <EtIcon name={'mail'} color={colors.primary} size={16} />
            }
          />

          <View
            style={{
              flexDirection: 'row',
            }}>
            <InputText
              label={'Expiry Date'}
              labelColor={'#000'}
              placeholder={'MM/YY'}
              placeholderColor={'#000'}
              textColor={'#000'}
              maxLength={5}
              onChangeText={text => {
                setExpiry(
                  formatWithMask({
                    text: text,
                    mask: expiryMask,
                  }).masked,
                );
              }}
              value={expiry}
              error={errors.email}
              keyboardType={'number-pad'}
              returnKeyType={'next'}
              inputRef={e => (inputRef['expiry'] = e)}
              style={{marginBottom: 20, flex: 1}}
              onSubmitEditing={() => inputRef['cvc']?.focus()}
            />
            <InputText
              label={'CVV/CVC'}
              labelColor={'#000'}
              placeholder={'***'}
              placeholderColor={'#000'}
              textColor={'#000'}
              maxLength={3}
              onChangeText={text => setCvc(text)}
              value={cvc}
              error={errors.cvc}
              keyboardType={'number-pad'}
              returnKeyType={'next'}
              inputRef={e => (inputRef['cvc'] = e)}
              style={{marginBottom: 20, flex: 1}}
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>
        </View>

        <View style={{marginVertical: 20}}>
          <PrimaryButton
            text={'Pay Now'}
            onPress={() =>
              props.navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{name: 'Tabs'}],
                }),
              )
            }
          />
        </View>

        <TouchableOpacity
          onPress={() =>
            props.navigation.goBack()
          }>
          <Typography children={'Cancel'} align={'center'} color={'#000'} />
        </TouchableOpacity>
      </ScrollView>
    </AppContainer>
  );
};

const CreditCard = ({expiry, number, holder}) => {
  return (
    <LinearGradient
      colors={['#685EE1', '#3C91F1']}
      start={{x: 0, y: 1}}
      end={{x: 1, y: 0}}
      style={{
        height: 180,
        borderRadius: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
      }}>
      <View style={{flexDirection: 'row', justifyContent: 'flex-end', flex: 1}}>
        <Image
          source={IMAGES.logo}
          style={{width: 100, height: 50}}
          resizeMode={'contain'}
        />
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          flex: 1,
        }}>
        {Array(4)
          .fill('****')
          .map((i, index) => (
            <Typography
              children={number.split(' ')[index] || i}
              color={'#fff'}
              size={20}
              textType={'light'}
            />
          ))}
      </View>

      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
        }}>
        <View>
          <Typography
            children={'Card Holder Name'}
            color={'#fff'}
            size={10}
            textType={'light'}
          />
          <Typography children={holder || '******'} color={'#fff'} size={14} />
          {/* <Typography children={"Simon Lewis"} color={"#fff"} size={14} /> */}
        </View>
        <View>
          <Typography
            children={'Expiry Date'}
            color={'#fff'}
            size={10}
            textType={'light'}
          />
          <Typography children={expiry || '**/**'} color={'#fff'} size={14} />
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 30,
  },
  formContainer: {
    marginTop: 20,
  },
});

export default CardDetails;
