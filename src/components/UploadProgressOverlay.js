import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';
import * as Progress from 'react-native-progress';
import { widthPercentageToDP } from 'react-native-responsive-screen';
import { Typography } from './Typography';

/**
 * Full-screen or inset upload overlay — no blocking modal sheet.
 */
export default function UploadProgressOverlay({
  visible,
  processingOnServer = false,
  progress = 0,
  title,
  subtitle,
  inset = false,
}) {
  if (!visible) {
    return null;
  }

  const label = title || (processingOnServer ? 'Saving…' : 'Uploading…');
  const sub =
    subtitle ||
    (processingOnServer ? 'Almost done' : undefined);

  return (
    <View
      style={inset ? styles.inset : styles.fullscreen}
      pointerEvents="auto"
    >
      <ActivityIndicator size="large" color="#fff" />
      <Typography children={label} textType="bold" color="#fff" size={18} />
      {sub ? (
        <Typography
          children={sub}
          textType="medium"
          color="#fff"
          size={13}
          style={{ textAlign: 'center', paddingHorizontal: 24 }}
        />
      ) : null}
      {progress > 0 && !processingOnServer ? (
        <Progress.Bar
          progress={progress}
          width={widthPercentageToDP(inset ? 70 : 80)}
          height={6}
          color="#fff"
          unfilledColor="rgba(255,255,255,0.3)"
          borderWidth={0}
        />
      ) : null}
      {processingOnServer ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  inset: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
  },
});
