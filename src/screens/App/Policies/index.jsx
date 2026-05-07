import React, { useEffect } from 'react';
import { ScrollView, StatusBar, StyleSheet } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { useDispatch, useSelector } from 'react-redux';
import { WebView } from 'react-native-webview';
import SimpleHeader from '../../../components/Headers/SimpleHeader';
import { AppContainer } from '../../../components/layouts/AppContainer';
import Actions from "../../../redux/actions/globalActions";
import { setLoader } from '../../../redux/globalSlice';
import { ContentType } from '../../../constants/endPoints';

const Policies = props => {

  const { title, type } = props.route?.params || {}
  const { staticContent } = useSelector(state => state.globalState);
  const dispatch = useDispatch();

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    getData();
  }, [type]);

  const getData = async () => {
    if (type === ContentType.ABOUT_US || type === ContentType.TERMS_AND_CONDITIONS) {
      return; // No need to fetch static content since we are using WebView
    }
    dispatch(setLoader(true))
    await dispatch(Actions.getStaticContent(type));
    dispatch(setLoader(false))
  }

  const getUrl = () => {
    if (type === ContentType.TERMS_AND_CONDITIONS) return 'https://comesh-support.vercel.app/terms';
    if (type === ContentType.ABOUT_US) return 'https://comesh-support.vercel.app/about';
    // Fallback or potentially add privacy policy later
    return null; 
  }

  const webUrl = getUrl();

  return (
    <AppContainer>
      <SimpleHeader {...props} title={title} />
      {webUrl ? (
        <WebView 
          source={{ uri: webUrl }} 
          style={{ flex: 1 }} 
        />
      ) : (
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
      )}
    </AppContainer>
  );
};

export default Policies;

const styles = StyleSheet.create({
});