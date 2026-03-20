import React from 'react';
import {View, TextInput, StyleSheet, Platform} from 'react-native';
import {Typography} from './Typography';
import colors from '../constants/colors';
import {fontsFamily} from '../constants/fonts';

export const InputText = (props: any) => {
  const {
    label = null,
    labelColor = '#707070',
    error = '',
    errorColor = colors.danger,
    placeholder,
    placeholderColor = colors.bg,
    textColor = colors.black,
    onChangeText = () => {},
    onFocus = () => {},
    onBlur = () => {},
    onKeyPress = () => {},
    value,
    autoCapitalize = 'none',
    keyboardType = 'default',
    returnKeyType = 'done',
    inputRef = (input: any) => {},
    onSubmitEditing = () => {},
    secureTextEntry = false,
    autoFocus = false,
    maxLength = 100,
    style = {},
    cardStyle = {},
    leftIcon = null,
    rightIcon = null,
    multiline = false,
    editable = true,
    inputStyle = {}
  } = props;

  return (
    <View style={style}>
      {label && (
        <Typography size={12} color={labelColor} textType={'light'}>
          {label}
        </Typography>
      )}
      <View style={[styles.inputView, cardStyle]}>
        {leftIcon}
        <TextInput
          style={{
            fontFamily: fontsFamily.regular,
            flex: 1,
            color: textColor,
            ...inputStyle
          }}
          placeholder={placeholder}
          placeholderTextColor={placeholderColor}
          underlineColorAndroid="transparent"
          onChangeText={onChangeText}
          onKeyPress={onKeyPress}
          value={value}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          blurOnSubmit={false}
          maxLength={maxLength}
          ref={inputRef}
          onSubmitEditing={onSubmitEditing}
          secureTextEntry={secureTextEntry}
          autoFocus={autoFocus}
          onFocus={onFocus}
          onBlur={onBlur}
          multiline={multiline}
          editable={editable}
        />
        {rightIcon}
      </View>
      {error != '' && (
        <Typography color={errorColor} size={12} textType="light" align="right">
          {error}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  inputView: {
    paddingVertical: Platform.OS == 'ios' ? 10 : 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#897C6D',
    borderBottomColor: colors.bg,
  },
});
