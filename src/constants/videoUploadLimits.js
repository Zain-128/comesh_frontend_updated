import RNFetchBlob from 'react-native-blob-util';

/** Profile / gallery video limits — enforced on pick and before multipart upload. */
export const PROFILE_VIDEO_MAX_DURATION_SEC = 15;
export const PROFILE_VIDEO_MAX_BYTES = 5 * 1024 * 1024;
/** Onboarding gallery (OnBoard3): multiple clips, larger per-file cap. */
export const ONBOARDING_GALLERY_VIDEO_MAX_MB = 25;
export const ONBOARDING_GALLERY_VIDEO_MAX_BYTES =
  ONBOARDING_GALLERY_VIDEO_MAX_MB * 1024 * 1024;

export const PROFILE_VIDEO_LIMITS_LABEL = `up to ${PROFILE_VIDEO_MAX_DURATION_SEC}s and 5MB`;
export const ONBOARDING_GALLERY_VIDEO_LIMITS_LABEL = `up to ${PROFILE_VIDEO_MAX_DURATION_SEC}s and ${ONBOARDING_GALLERY_VIDEO_MAX_MB}MB`;

function maxMegabytesLabel(maxBytes) {
  return Math.round(maxBytes / (1024 * 1024));
}

/** iOS/Android sometimes report duration in ms for longer clips. */
export function normalizeVideoDurationSec(duration) {
  const n = Number(duration);
  if (!Number.isFinite(n) || n <= 0) {
    return undefined;
  }
  if (n > 300) {
    return n / 1000;
  }
  return n;
}

export function formatBytesForLog(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) {
    return 'unknown';
  }
  if (n < 1024) {
    return `${n} B`;
  }
  if (n < 1024 * 1024) {
    return `${(n / 1024).toFixed(1)} KB`;
  }
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

/** Measure local file when picker omits fileSize. */
export async function resolveAssetFileSize(asset) {
  const fromPicker = Number(asset?.fileSize);
  if (Number.isFinite(fromPicker) && fromPicker > 0) {
    return fromPicker;
  }
  const uri = asset?.uri;
  if (!uri) {
    return null;
  }
  try {
    const path = decodeURIComponent(String(uri)).replace('file://', '');
    const stat = await RNFetchBlob.fs.stat(path);
    const size = Number(stat?.size);
    return Number.isFinite(size) && size > 0 ? size : null;
  } catch (e) {
    if (__DEV__) {
      console.warn('[videoUploadLimits] resolveAssetFileSize failed', e?.message || e);
    }
    return null;
  }
}

export async function enrichVideoAssetForValidation(asset) {
  if (!asset?.uri) {
    return asset;
  }
  const fileSize = await resolveAssetFileSize(asset);
  return {
    ...asset,
    fileSize: fileSize ?? asset.fileSize,
    durationSec: normalizeVideoDurationSec(asset.duration),
  };
}

/**
 * @returns {string|null} rejection message, or null if OK
 */
export function getProfileVideoRejectReason(asset, options = {}) {
  if (!asset?.uri) {
    return 'No video selected';
  }
  const maxBytes = options.maxBytes ?? PROFILE_VIDEO_MAX_BYTES;
  const maxMb = maxMegabytesLabel(maxBytes);
  const duration =
    asset.durationSec ?? normalizeVideoDurationSec(asset.duration);
  if (
    duration !== undefined &&
    duration > PROFILE_VIDEO_MAX_DURATION_SEC
  ) {
    return `Video must be ${PROFILE_VIDEO_MAX_DURATION_SEC} seconds or less (yours: ${Math.round(duration)}s)`;
  }
  const size = Number(asset.fileSize);
  if (Number.isFinite(size) && size > maxBytes) {
    return `Video must be ${maxMb}MB or less (yours: ${formatBytesForLog(size)}). Use a shorter clip.`;
  }
  return null;
}

export function validateProfileVideoPick(asset, options = {}) {
  const message = getProfileVideoRejectReason(asset, options);
  return { valid: !message, message };
}

/** Sum fileSize for gallery picks (onboarding batch display / server checks). */
export function sumGalleryVideoBytes(assets = []) {
  return assets.reduce((sum, asset) => {
    const n = Number(asset?.fileSize);
    return sum + (Number.isFinite(n) && n > 0 ? n : 0);
  }, 0);
}

/** Multi-select: keep valid assets; surface last rejection if any were dropped. */
export function filterProfileVideoPicks(assets = [], options = {}) {
  const accepted = [];
  let rejectedMessage = null;
  for (const asset of assets) {
    const reason = getProfileVideoRejectReason(asset, options);
    if (reason) {
      rejectedMessage = reason;
    } else {
      accepted.push(asset);
    }
  }
  return { accepted, rejectedMessage };
}

export function logVideoAssetCheck(tag, asset, reason) {
  if (!__DEV__) {
    return;
  }
  console.log(`[OnBoard3] ${tag}`, {
    uri: asset?.uri ? String(asset.uri).slice(-48) : null,
    fileName: asset?.fileName,
    fileSize: asset?.fileSize,
    fileSizeLabel: formatBytesForLog(asset?.fileSize),
    duration: asset?.duration,
    durationSec: asset?.durationSec ?? normalizeVideoDurationSec(asset?.duration),
    ok: !reason,
    reason: reason || null,
  });
}
