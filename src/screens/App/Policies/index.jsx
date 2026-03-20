import React, { useEffect } from 'react';
import { ScrollView, StatusBar, StyleSheet } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { useDispatch, useSelector } from 'react-redux';
import SimpleHeader from '../../../components/Headers/SimpleHeader';
import { AppContainer } from '../../../components/layouts/AppContainer';
import Actions from "../../../redux/actions/globalActions";
import { setLoader } from '../../../redux/globalSlice';

const Policies = props => {

  const { title, type } = props.route?.params || {}
  const { staticContent } = useSelector(state => state.globalState);
  const dispatch = useDispatch();

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    getData();
  }, []);

  const getData = async () => {
    dispatch(setLoader(true))
    await dispatch(Actions.getStaticContent(type));
    dispatch(setLoader(false))
  }


  return (
    <AppContainer>
      <SimpleHeader {...props} title={title} />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, gap: 20 }}>
        <RenderHtml
          source={{
            html: staticContent ? staticContent : `
          <h1>No Content Available</h1>
          `
          }}
        />
      </ScrollView>
    </AppContainer>
  );
};

export default Policies;

const styles = StyleSheet.create({
});