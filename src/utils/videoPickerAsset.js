import { Platform } from 'react-native';

/** Thumbnail URI from react-native-image-picker (iOS / Android extras). */
export function getVideoThumbnailUri(asset) {
  if (!asset) {
    return null;
  }
  return (
    asset.thumbnailUri ||
    asset.thumb ||
    asset.thumbnail ||
    asset.posterUri ||
    null
  );
}

export function normalizeVideoAsset(asset) {
  if (!asset?.uri) {
    return asset;
  }
  const thumbnailUri = getVideoThumbnailUri(asset);
  return {
    ...asset,
    thumbnailUri,
    posterUri: thumbnailUri || asset.posterUri,
  };
}

export function normalizeVideoAssets(assets = []) {
  return (assets || []).map(normalizeVideoAsset).filter((a) => a?.uri);
}

/** Faster library pick — no re-encode on select (compress runs at upload). */
export function singleVideoPickerOptions(overrides = {}) {
  return {
    mediaType: 'video',
    selectionLimit: 1,
    includeExtra: true,
    ...(Platform.OS === 'ios'
      ? { assetRepresentationMode: 'current' }
      : {}),
    immediateCallback: true,
    ...overrides,
  };
}

export function multiVideoPickerOptions(selectionLimit, overrides = {}) {
  return {
    mediaType: 'video',
    selectionLimit,
    includeExtra: true,
    ...(Platform.OS === 'ios'
      ? { assetRepresentationMode: 'current' }
      : {}),
    immediateCallback: true,
    ...overrides,
  };
}
