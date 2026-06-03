import { Platform } from 'react-native';
import { PROFILE_VIDEO_MAX_DURATION_SEC } from '../constants/videoUploadLimits';

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

/**
 * Shrink at pick time — videoQuality + durationLimit (iOS & Android).
 * No react-native-compressor on upload; server ffmpeg after upload.
 */
export function singleVideoPickerOptions(overrides = {}) {
  return {
    mediaType: 'video',
    selectionLimit: 1,
    includeExtra: true,
    videoQuality: 'medium',
    durationLimit: PROFILE_VIDEO_MAX_DURATION_SEC,
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
    videoQuality: 'medium',
    durationLimit: PROFILE_VIDEO_MAX_DURATION_SEC,
    ...(Platform.OS === 'ios'
      ? { assetRepresentationMode: 'current' }
      : {}),
    immediateCallback: true,
    ...overrides,
  };
}

/**
 * Shrink at pick time (react-native-image-picker) — no extra compressor wait on upload.
 * Profile images are also optimized on the server (sharp).
 */
export function singlePhotoPickerOptions(overrides = {}) {
  return {
    mediaType: 'photo',
    selectionLimit: 1,
    maxWidth: 1280,
    maxHeight: 1280,
    quality: 0.72,
    ...overrides,
  };
}
