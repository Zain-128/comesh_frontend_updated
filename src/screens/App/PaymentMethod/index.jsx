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
import FaIcon from 'react-native-vector-icons/FontAwesome';
import {Typography} from '../../../components/Typography';
import SimpleHeader from '../../../components/Headers/SimpleHeader';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../../../constants/colors';

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

const PaymentMethod = props => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
  }, []);

  return (
    <AppContainer>
      <SimpleHeader {...props} title={'Payment Method'} />
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{padding: 20, gap: 20}}>
        {PAKCAGES.map((i, index) => {
          return (
            <TouchableOpacity style={styles.card} onPress={() => props.navigation.navigate('CardDetails') }>
              {i.icon}
              <View style={styles.cardContent}>
                <Typography children={i.title} size={16} textType="bold" />
                <Typography size={12} children={i.body} />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </AppContainer>
  );
};

export default PaymentMethod;

const styles = StyleSheet.create({
  card: {
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 15,
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
  },
});

const PAKCAGES = [
  {
    title: 'Credit Card',
    body: `Pay with MasterCard, Visa & Visa Electron.`,
    icon: <FaIcon name={'credit-card-alt'} size={16} />,
  },
  {
    title: 'Paypal',
    body: `Faster & safer way to send money.`,
    icon: <FaIcon name={'paypal'} size={22} />,
  },
  {
    title: 'Apple Pay',
    body: `Pay with apple pay account`,
    icon: <FaIcon name={'apple'} size={24} />,
  },
];
