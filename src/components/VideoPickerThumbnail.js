import React from 'react';
import {
  Image,
  StyleSheet,
  View,
} from 'react-native';
import { getVideoThumbnailUri } from '../utils/videoPickerAsset';

/**
 * Instant grid preview after library pick — uses still thumbnail, not Video decoder.
 */
export default function VideoPickerThumbnail({
  asset,
  style,
  children,
  placeholderColor = '#1a1a1a',
}) {
  const thumb = getVideoThumbnailUri(asset);

  return (
    <View style={[styles.wrap, style]}>
      {thumb ? (
        <Image
          source={{ uri: thumb }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { backgroundColor: placeholderColor },
          ]}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: '#000',
  },
});
