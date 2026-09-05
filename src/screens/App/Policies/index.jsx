import React, { useEffect, useMemo } from 'react';
import { ScrollView, StatusBar, StyleSheet } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { useDispatch, useSelector } from 'react-redux';
import { WebView } from 'react-native-webview';
import SimpleHeader from '../../../components/Headers/SimpleHeader';
import { AppContainer } from '../../../components/layouts/AppContainer';
import Actions from "../../../redux/actions/globalActions";
import { setLoader } from '../../../redux/globalSlice';
import { ContentType } from '../../../constants/endPoints';
import { LEGAL_PAGE_URLS } from '../../../constants/legalPages';

const WEBVIEW_BY_TYPE = {
  [ContentType.ABOUT_US]: LEGAL_PAGE_URLS.about,
  [ContentType.TERMS_AND_CONDITIONS]: LEGAL_PAGE_URLS.terms,
  [ContentType.PRIVACY_POLICY]: LEGAL_PAGE_URLS.privacy,
};

const Policies = props => {
  const { title, type } = props.route?.params || {};
  const { staticContent } = useSelector(state => state.globalState);
  const dispatch = useDispatch();

  const webUrl = useMemo(
    () => (type ? WEBVIEW_BY_TYPE[type] : null),
    [type],
  );

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    getData();
  }, [type, webUrl]);

  const getData = async () => {
    if (webUrl) return;
    dispatch(setLoader(true));
    await dispatch(Actions.getStaticContent(type));
    dispatch(setLoader(false));
  };

  return (
    <AppContainer>
      <SimpleHeader {...props} title={title} />
      {webUrl ? (
        <WebView
          source={{ uri: webUrl }}
          style={{ flex: 1 }}
          startInLoadingState
        />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 20 }}>
          <RenderHtml
            source={{
              html: staticContent
                ? staticContent
                : `<h1>No Content Available</h1>`,
            }}
          />
        </ScrollView>
      )}
    </AppContainer>
  );
};

export default Policies;

const styles = StyleSheet.create({});
