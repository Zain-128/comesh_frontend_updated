import React, { useRef, useState } from "react";
import { StyleSheet, View, TouchableOpacity, Keyboard } from "react-native";
import EtIcon from "react-native-vector-icons/Entypo";
import IonIcon from "react-native-vector-icons/Ionicons";
import SimpleHeader from "../../../components/Headers/SimpleHeader";
import { InputText } from "../../../components/InputText";
import PrimaryButton from "../../../components/Buttons/PrimaryButton";
import { AppContainer } from "../../../components/layouts/AppContainer";

const ChangePassword = (props) => {
  const inputRef = useRef([]);
  const [errors, setErrors] = useState({});

  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secureEntry, setSecureEntry] = useState(true);

  const _onUpdate = () => {
    props.navigation.goBack();
  }

  return (
    <AppContainer safeArea={true} mode="light">
      <SimpleHeader title={'Change Password'} {...props} />

      <View style={{ padding: 20 }}>
        <InputText
          label={"Current Password"}
          placeholder={"********"}
          onChangeText={(text) => setPassword(text)}
          value={password}
          error={errors.password}
          errorColor={'red'}
          keyboardType={"default"}
          inputRef={(e) => (inputRef["password"] = e)}
          style={{ marginBottom: 20 }}
          returnKeyType={"next"}
          onSubmitEditing={() => inputRef["new_password"].focus()}
          secureTextEntry={secureEntry}
          rightIcon={
            <TouchableOpacity onPress={() => setSecureEntry(!secureEntry)}>
              <EtIcon
                name={secureEntry ? "eye-with-line" : "eye"}
                color={"#000"}
                size={16}
              />
            </TouchableOpacity>
          }
        />
        <InputText
          label={"New Password"}
          placeholder={"********"}
          onChangeText={(text) => setNewPassword(text)}
          value={newPassword}
          error={errors.new_password}
          errorColor={'red'}
          keyboardType={"default"}
          inputRef={(e) => (inputRef["new_password"] = e)}
          style={{ marginBottom: 20 }}
          returnKeyType={"next"}
          onSubmitEditing={() => inputRef["confirm_password"].focus()}
          secureTextEntry={secureEntry}
          rightIcon={
            <TouchableOpacity onPress={() => setSecureEntry(!secureEntry)}>
              <EtIcon
                name={secureEntry ? "eye-with-line" : "eye"}
                color={"#000"}
                size={16}
              />
            </TouchableOpacity>
          }
        />
        <InputText
          label={"Confirm Password"}
          placeholder={"********"}
          onChangeText={(text) => setConfirmPassword(text)}
          value={confirmPassword}
          error={errors.confirm_new_password}
          errorColor={'red'}
          keyboardType={"default"}
          returnKeyType={"done"}
          inputRef={(e) => (inputRef["confirm_password"] = e)}
          style={{ marginBottom: 20 }}
          onSubmitEditing={() => Keyboard.dismiss()}
          secureTextEntry={secureEntry}
          rightIcon={
            <TouchableOpacity onPress={() => setSecureEntry(!secureEntry)}>
              <EtIcon
                name={secureEntry ? "eye-with-line" : "eye"}
                color={"#000"}
                size={16}
              />
            </TouchableOpacity>
          }
        />

        <PrimaryButton text={"Submit"} onPress={ _onUpdate } />
      </View>
    </AppContainer>
  );
};

const styles = StyleSheet.create({
  itemView: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 10,
    marginHorizontal: 20,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default ChangePassword;
