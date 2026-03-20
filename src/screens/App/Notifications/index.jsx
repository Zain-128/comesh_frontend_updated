import moment from 'moment';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  View
} from 'react-native';
import AdIcon from 'react-native-vector-icons/AntDesign';
import { useDispatch, useSelector } from "react-redux";
import SimpleHeader from '../../../components/Headers/SimpleHeader';
import { Typography } from '../../../components/Typography';
import { AppContainer } from '../../../components/layouts/AppContainer';
import colors from '../../../constants/colors';
import { IMAGES } from '../../../constants/images';
import Actions from "../../../redux/actions/globalActions";


const Notifications = props => {
  const dispatch = useDispatch();
  const notifications = useSelector(state => state.globalState.notifications);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    getNotifi();
  }, []);

  getNotifi = async () => {
    await dispatch(Actions.getNotifications({
      callback: () => {

      }
    }));
    setLoading(false)
  }

  return (
    <AppContainer>
      <SimpleHeader {...props} title={'Notifications'} />
      <FlatList
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true)
          await dispatch(Actions.getNotifications({
            callback: () => {

            }
          }));
          setRefreshing(false)
        }}
        ListEmptyComponent={
          !loading && !refreshing &&
          <View style={{ paddingTop: "70%", justifyContent: "center", alignItems: 'center', }}>
            <Typography children={"No new notifications"} textType='bold' align='center' size={25} color='gray' />
          </View>
        }
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, gap: 20 }}
        data={notifications}
        ListFooterComponent={
          loading &&
          <View style={{ justifyContent: "center", alignItems: 'center', padding: 10 }}>
            <ActivityIndicator size={"large"} color={colors.primary} />
          </View>
        }
        renderItem={({ item }) => {
          console.warn(item)
          return (
            <View style={styles.card}>
              <Image
                source={IMAGES.bellCircle}
                style={{ width: 40, height: 60, borderRadius: 25 }}
              />
              <View style={styles.cardContent}>
                <Typography children={item.title} textType="semiBold" />
                <Typography children={item.description} size={11} color="#595959" />
                <View
                  style={{ flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 5 }}>
                  <AdIcon name={'clockcircleo'} color="#595959" />
                  <Typography
                    children={moment(item.createdAt).fromNow()}
                    size={11}
                    color="#595959"
                  />
                </View>
              </View>
            </View>
          )
        }} />
    </AppContainer>
  );
};

export default Notifications;

const styles = StyleSheet.create({
  card: {
    gap: 10,
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
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
});

const LIST = [
  {
    title: 'New Like',
    body: `Congratulations, You've recevied a new like from a profile.`,
  },
  {
    title: `It's a Match`,
    body: `Congratulations, We found a match for your profile.`,
  },
  {
    title: `New Message`,
    body: `Congratulations, We found a match for your profile.`,
  },
  {
    title: `It's a Match`,
    body: `Congratulations, We found a match for your profile.`,
  },
];
