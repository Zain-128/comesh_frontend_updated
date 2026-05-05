import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import RnRangeSlider from 'rn-range-slider';
import PrimaryButton from '../../../components/Buttons/PrimaryButton';
import { SelectPicker } from '../../../components/SelectPicket';
import Text from '../../../components/Text';
import { Typography } from '../../../components/Typography';
import { AppContainer } from '../../../components/layouts/AppContainer';
import { fontsFamily, fontsSize } from '../../../constants/fonts';
import globalActions from '../../../redux/actions/globalActions';
import { setDashLoader } from '../../../redux/globalSlice';
import helper from '../../../utils/helper';
import Header from './Header';
import { hasAdvancedFilters } from '../../../constants/subscriptionEntitlements';
import Label from './slider/Label';
import Notch from './slider/Notch';
import Rail from './slider/Rail';
import RailSelected from './slider/RailSelected';
import Thumb from './slider/Thumb';


const Filter = props => {

  const [filter, setFilter] = useState(null);
  const [open, setOpen] = useState(null);
  const dispatch = useDispatch();
  const { userData } = useSelector((s) => s.user);
  const showAdvanced = hasAdvancedFilters(userData);

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  const refreshPosts = async () => {
    dispatch(setDashLoader(true))
    await dispatch(globalActions.DashboardListing({
      page: 1,
      params: filter,
      callback: (data) => {
      }
    }));
    dispatch(setDashLoader(false))
  }

  return (
    <AppContainer>
      <Header {...props} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        <RangeSliderInput val={filter?.minAge ? filter?.minAge : 0} valH={filter?.maxAge ? filter?.maxAge : 100} label={'Age Range'} handleValueChange={(low, high, byUser) => {
          if (byUser) {
            setFilter({
              ...filter,
              minAge: low,
              maxAge: high
            })
          }
        }} />
        <RangeSliderInput val={filter?.minDistance ? filter?.minDistance : 0} valH={filter?.maxDistance ? filter?.maxDistance : 100} label={'Location Range'} valueLabel='miles' handleValueChange={(low, high, byUser) => {
          if (byUser) {
            setFilter({
              ...filter,
              minDistance: low,
              maxDistance: high
            })
          }
        }} />
        {showAdvanced ? (
        <RangeSliderInput val={filter?.minFollowers ? filter?.minFollowers : 0} valH={filter?.maxFollowers ? filter?.maxFollowers : 10000000} label={'Followers Range'} max={10000000} handleValueChange={(low, high, byUser) => {
          if (byUser) {
            setFilter({
              ...filter,
              minFollowers: low,
              maxFollowers: high
            })
          }
        }} />
        ) : (
          <Text style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
            Follower filters unlock on Collab Pro and above.
          </Text>
        )}


        {/* <SelectPicker
          val={filter && filter?.questionAndAnswers ? filter.questionAndAnswers.find(q => q.question == 'How often do you make content?')?.answer : null}
          style={{ zIndex: 6 }}
          label={'How often do you make content?'}
          options={[{ label: '1-2 days/weekly', value: "1-2 days/weekly" }, { label: '3-4 days/weekly', value: '3-4 days/weekly' }, { label: 'Randomly just for fun', value: 'Randomly just for fun' }]}
          onValueChange={(value) => {
            if (value)
              setFilter({
                ...filter,
                questionAndAnswers: [
                  ...filter?.questionAndAnswers ? filter?.questionAndAnswers : [],
                  { question: "How often do you make content?", answer: value }
                ]
              })
          }}
        /> */}

        <SelectPicker
          //val={filter && filter?.questionAndAnswers ? filter.questionAndAnswers.find(q => q.question == 'How often do you make content?').answer : null}
          style={{ zIndex: 5 }} label={'Interests/Niche'} options={[
            { label: "Fake relationship", value: "Fake relationship" },
            { label: "Friendly fun videos", value: "Friendly fun videos" },
            { label: "TikTok battle collab", value: "TikTok battle collab" },
            { label: "Couple collab", value: "Couple collab" },
            { label: "Fashion", value: "Fashion" },
            { label: "Comedian", value: "Comedian" },
            { label: "Chef", value: "Chef" },
            { label: "Craft/DIY", value: "Craft/DIY" },
            { label: "GYM", value: "GYM" },
            { label: "ART", value: "ART" },
            { label: "Music", value: "Music" },
            { label: "Sports", value: "Sports" },
            { label: "Gaming", value: "Gaming" },
            { label: "Beauty", value: "Beauty" },
            { label: "Truck driver", value: "Truck driver" },
            { label: "Pet", value: "Pet" },
            { label: "Fishing", value: "Fishing" },
          ]}
          multiple
          val={filter && filter?.niche ? filter?.niche : null}
          onValueChange={(value) => {
            setFilter({
              ...filter,
              niche: value
            })
          }}
        />
        {/* <View style={{ marginTop: 15 }} />
        <SelectPicker
          val={filter && filter?.gender ? filter.gender : null}
          style={{ zIndex: 4 }} label={'Gender'} options={[{ label: 'Male', value: "male" }, { label: 'Female', value: "female" }]}
          onValueChange={(value) => {
            setFilter({
              ...filter,
              gender: value
            })
          }}
        /> */}
        <View style={{ marginTop: 15 }} />

        <SelectPicker
          val={filter && Object.hasOwn(filter, "willingToTravel") ? [filter.willingToTravel] : null}
          style={{ zIndex: 3 }} label={'Willing to travel?'} options={[{ label: 'Yes', value: true }, { label: 'No', value: false }]}
          onValueChange={(value) => {
            setFilter({
              ...filter,
              willingToTravel: value[0]
            })
          }}
        />
        <View style={{ marginTop: 15 }} />

        <SelectPicker
          val={filter && Object.hasOwn(filter, "questionAndAnswers") ? [filter.questionAndAnswers.find(q => q.question == 'Select which applies?')?.answer] : null}
          style={{ zIndex: 2 }}
          label={'Type of content someone create?'}
          options={[{ label: 'Live streamer', value: 'Live streamer' }, { label: 'Video Creator', value: 'Video Creator' }, { label: 'Both', value: 'Both' }]}
          onValueChange={(value) => {
            if (value) {
              let ques = filter?.questionAndAnswers ? filter?.questionAndAnswers.find(qa => qa.question == "Select which applies?") : null;
              if (ques) {
                ques.answer = value[0];
              }
              else {
                console.warn("else")
                setFilter({
                  ...filter,
                  questionAndAnswers: [
                    ...filter?.questionAndAnswers ? filter?.questionAndAnswers : [],
                    { question: "Select which applies?", answer: value[0] }
                  ]
                })
              }
            }
          }}
        />

        <PrimaryButton
          style={{ marginTop: 20 }}
          text={'Apply Filter'}
          onPress={() => {
            props.navigation.navigate('Home');
            refreshPosts();
          }}
        />
        <TouchableOpacity onPress={async () => {
          setFilter(null)
          props.navigation.navigate('Home');
          dispatch(setDashLoader(true))
          await dispatch(globalActions.DashboardListing({
            page: 1,
            params: {},
            callback: (data) => {
            }
          }));
          dispatch(setDashLoader(false))
        }} style={{ justifyContent: "center", alignItems: 'center', padding: 15, marginTop: 10 }}>
          <Text style={styles.text}>Clear Filter</Text>
        </TouchableOpacity>
        {/* {
          open &&
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => setOpen(false)}
            style={{ ...StyleSheet.absoluteFill, left: "-10%", right: "-10%", backgroundColor: "rgba(0,0,0,0.3)" }} />
        } */}
      </ScrollView>
    </AppContainer>
  );
};

export default Filter;

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

export const RangeSliderInput = ({ label, val, valH, valueLabel = '', handleValueChange, isNotRange = false, min = 0, max = 100 }) => {
  const renderThumb = useCallback(() => <Thumb />, []);
  const renderRail = useCallback(() => <Rail />, []);
  const renderRailSelected = useCallback(() => <RailSelected />, []);
  const renderLabel = useCallback(value => <Label text={helper.FollowersPrefix(value) + " " + valueLabel} />, []);
  const renderNotch = useCallback(() => <Notch />, []);
  const handleValue = useCallback(handleValueChange);

  return (
    <View style={styles.settingItem}>
      <Typography children={label} textType="medium" size={16} />
      <RnRangeSlider
        style={{ paddingVertical: 10 }}
        low={val}
        high={valH}
        min={min}
        max={max}
        step={1}
        floatingLabel
        disableRange={isNotRange}
        renderThumb={renderThumb}
        renderRail={renderRail}
        renderRailSelected={renderRailSelected}
        renderLabel={renderLabel}
        renderNotch={renderNotch}
        onValueChanged={handleValue}
      />
    </View>
  );
};
