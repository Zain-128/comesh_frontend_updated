import React, {useEffect, useState} from 'react';
import {
  StatusBar,
  Image,
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
} from 'react-native';
import {AppContainer} from '../../../components/layouts/AppContainer';
import AdIcon from 'react-native-vector-icons/AntDesign';
import {Typography} from '../../../components/Typography';
import SimpleHeader from '../../../components/Headers/SimpleHeader';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../../constants/colors';
import PrimaryButton from '../../../components/Buttons/PrimaryButton';

const GradientContainer = ({style, children, active = false, onPress}) => {
  if (active) {
    return (
      <LinearGradient
        style={style}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        colors={[colors.primary, colors.secondary]}>
        {children}
      </LinearGradient>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} style={style}>
      {children}
    </TouchableOpacity>
  );
};

const Subscription = props => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  return (
    <AppContainer>
      <SimpleHeader {...props} title={'Subscription'} />
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 20, gap: 20}}>
        <Typography children={`Select a Plan`} textType="bold" size={18} />

        {PAKCAGES.map((i, index) => {
          const isActive = index === active;
          return (
            <GradientContainer
              style={styles.card}
              onPress={() => setActive(index)}
              active={isActive}>
              {i.save != undefined && (
                <View style={styles.saveLabel}>
                  <Typography
                    size={12}
                    color="#fff"
                    children={`Save ${i.save}`}
                  />
                </View>
              )}
              <View style={styles.cardContent}>
                <Typography
                  children={i.title}
                  size={16}
                  textType="bold"
                  color={isActive ? '#fff' : undefined}
                />
                <Typography
                  children={i.body}
                  color={isActive ? '#fff' : '#595959'}
                />
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  gap: 5,
                  marginTop: 5,
                }}>
                <Typography
                  children={'$'}
                  textType="bold"
                  color={isActive ? '#fff' : `#F200FF`}
                />
                <View
                  style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                  <Typography
                    children={i.price}
                    size={26}
                    textType="bold"
                    color={isActive ? '#fff' : `#F200FF`}
                  />
                  <Typography
                    children={`/${i.unit}`}
                    color={isActive ? '#fff' : undefined}
                  />
                </View>
              </View>
            </GradientContainer>
          );
        })}

        <View style={styles.includeCard}>
          <View style={styles.includeLabel}>
            <Typography
              size={12}
              textType="semiBold"
              children={'Included with subscription'}
              color={colors.secondary}
            />
          </View>
          {FEATURES?.map(i => (
            <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
              <AdIcon name={'check'} color={'#1424FF'} />
              <Typography children={i} textType="semiBold" />
            </View>
          ))}
        </View>
        <Typography children={`Select a Plan`} textType="bold" size={18} />

        <ScrollView
          horizontal
          style={{marginHorizontal: -20}}
          contentContainerStyle={{
            paddingTop: 30,
            paddingBottom: 30,
            paddingHorizontal: 20,
            gap: 10,
          }}>
          {PAKCAGES.map((i, index) => {
            const isActive = false;
            return (
              <GradientContainer
                style={styles.boostCard}
                onPress={() => setActive(index)}
                active={isActive}>
                <LinearGradient
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  colors={[colors.primary, colors.secondary]}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'absolute',
                    top: -30
                  }}>
                  <AdIcon name={'like2'} size={26} color={'#fff'} />
                </LinearGradient>
                <View style={styles.boostCardContent}>
                  <Typography
                    children={i.title}
                    size={16}
                    textType="bold"
                    color={isActive ? '#fff' : undefined}
                  />
                  <Typography
                    children={i.body}
                    color={isActive ? '#fff' : '#595959'}
                  />
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 5,
                    marginTop: 5,
                  }}>
                  <Typography
                    children={'$'}
                    textType="bold"
                    color={isActive ? '#fff' : `#F200FF`}
                  />
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                    }}>
                    <Typography
                      children={i.price}
                      size={26}
                      textType="bold"
                      color={isActive ? '#fff' : `#F200FF`}
                    />
                  </View>
                </View>
              </GradientContainer>
            );
          })}
        </ScrollView>
        <PrimaryButton text={'Continue - $ 99.99 Total'} onPress={ () => props.navigation.navigate('PaymentMethod')} />
      </ScrollView>
    </AppContainer>
  );
};

export default Subscription;

const styles = StyleSheet.create({
  card: {
    gap: 10,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 10,
  },
  cardContent: {
    flex: 1,
    gap: 3,
  },
  saveLabel: {
    backgroundColor: '#F200FF',
    borderRadius: 5,
    position: 'absolute',
    paddingVertical: 5,
    paddingHorizontal: 10,
    top: -15,
    right: 20,
  },
  includeCard: {
    borderWidth: 1,
    borderColor: '#b2b2b2',
    borderRadius: 20,
    marginTop: 20,
    paddingTop: 20,
    padding: 10,
    gap: 10,
  },
  includeLabel: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#fff',
    borderColor: '#b2b2b2',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    alignSelf: 'center',
  },
  boostCard: {
    gap: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 10,
  },
  boostCardContent: {
    flex: 1,
    gap: 3,
    alignItems: 'center',
    paddingTop: 20
  },
});

const FEATURES = [
  'See who likes you',
  'Unlimited rewinds',
  '1 Free boost per month',
  '5 Free super likes per week',
  'Hide Ads',
];

const PAKCAGES = [
  {
    title: '12 Month Plan',
    body: `Billed yearly`,
    price: '99.99',
    unit: 'yr',
    save: '67%',
  },
  {
    title: '6 Month Plan',
    body: `$74.99 for 6 month`,
    price: '76.99',
    unit: '6mo',
  },
  {
    title: '1 Month Plan',
    body: `Billed every month`,
    price: '24.99',
    unit: 'mo',
  },
];
