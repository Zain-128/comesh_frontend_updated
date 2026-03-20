import React from 'react';
import { View } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { heightPercentageToDP, widthPercentageToDP } from 'react-native-responsive-screen';

const Maps = () => (
  <View style={{ flex: 1, paddingVertical: heightPercentageToDP(8), paddingHorizontal: widthPercentageToDP(5) }}>
    <GooglePlacesAutocomplete
      placeholder='Search...'
      onPress={(data, details = null) => {
        // 'details' is provided when fetchDetails = true
        console.log(data, details);
      }}
      query={{
        key: 'AIzaSyD_Dqp3sP6urE8NhdVO14CnODtSkVTAJno',
        language: 'en',
      }}
    />
    {/* <MapView
    /> */}
  </View>
);

export default Maps;
