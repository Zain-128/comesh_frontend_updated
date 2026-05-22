import RNFetchBlob from 'react-native-blob-util';
import { logMultipartTextParts } from './onboardingApiDebug';
import { compressImageForUpload, compressVideoForUpload } from './compressMedia';

const wrapLocalFile = (fileUri) =>
  RNFetchBlob.wrap(
    decodeURIComponent(String(fileUri)).replace('file://', ''),
  );

function videoStem(uri, fallbackName) {
  const raw =
    (uri && String(uri).split('/').pop()) ||
    fallbackName ||
    'video';
  return String(raw).replace(/\.[^/.]+$/i, '') || 'video';
}

/** Unique multipart filenames — server multer uses originalname; duplicates overwrite disk. */
function uniqueUploadFilename(role, index, uri, fallbackName, ext) {
  const stamp = Date.now();
  const stem = videoStem(uri, fallbackName).replace(/[^a-zA-Z0-9_-]/g, '_');
  const suffix = index != null ? `_${index}` : '';
  return `${role}${suffix}_${stamp}_${stem}.${ext}`;
}

function dedupeGalleryVideos(profileVideo, galleryVideos = []) {
  const profileUri = profileVideo?.uri
    ? String(profileVideo.uri)
    : null;
  const seen = new Set();
  return galleryVideos.filter((vid) => {
    if (!vid?.uri) {
      return false;
    }
    const u = String(vid.uri);
    if (profileUri && u === profileUri) {
      return false;
    }
    if (seen.has(u)) {
      return false;
    }
    seen.add(u);
    return true;
  });
}

/** Append profile + gallery files for PUT /users/updateProfile */
export async function buildProfileMultipartParts({
  profileVideo,
  profileImage,
  galleryVideos = [],
  previousVideos,
}) {
  const parts = [];
  const gallery = dedupeGalleryVideos(profileVideo, galleryVideos);

  if (profileImage?.uri) {
    const imgCompressed = await compressImageForUpload(profileImage.uri);
    const imgUri = imgCompressed || profileImage.uri;
    parts.push({
      name: 'profileImage',
      filename: uniqueUploadFilename('profile_image', null, imgUri, 'avatar', 'jpg'),
      type: 'image/jpeg',
      data: wrapLocalFile(imgUri),
    });
  }

  if (profileVideo?.uri) {
    const compressedUri = await compressVideoForUpload(profileVideo.uri);
    const uri = compressedUri || profileVideo.uri;
    parts.push({
      name: 'profileVideo',
      filename: uniqueUploadFilename(
        'profile_video',
        null,
        uri,
        profileVideo.name || profileVideo.fileName,
        'mp4',
      ),
      type: profileVideo.type || 'video/mp4',
      data: wrapLocalFile(uri),
    });
  }

  if (gallery.length) {
    for (let i = 0; i < gallery.length; i++) {
      const vid = gallery[i];
      const outUri = (await compressVideoForUpload(vid.uri)) || vid.uri;
      parts.push({
        name: 'videos',
        filename: uniqueUploadFilename(
          'gallery',
          i,
          outUri,
          vid.name || vid.fileName,
          'mp4',
        ),
        type: vid.type || 'video/mp4',
        data: wrapLocalFile(outUri),
      });
    }
  }

  if (previousVideos?.length) {
    parts.push({
      name: 'previousVideos',
      data: JSON.stringify(previousVideos),
    });
  }

  return parts;
}

function appendScalarPart(parts, name, value) {
  if (value === undefined || value === null) {
    return;
  }
  if (typeof value === 'boolean') {
    parts.push({ name, data: value ? 'true' : 'false' });
    return;
  }
  parts.push({ name, data: String(value) });
}

/** Express/Nest multer: bracket keys → real arrays (works without server JSON.parse). */
function appendNestedParts(parts, prefix, value) {
  if (value === undefined || value === null) {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        appendNestedParts(parts, `${prefix}[${index}]`, item);
      } else {
        appendScalarPart(parts, `${prefix}[${index}]`, item);
      }
    });
    return;
  }
  if (typeof value === 'object') {
    Object.entries(value).forEach(([k, v]) => {
      appendNestedParts(parts, `${prefix}[${k}]`, v);
    });
    return;
  }
  appendScalarPart(parts, prefix, value);
}

/**
 * Multipart text fields for PUT /users/updateProfile.
 * Uses niche[0], questionAndAnswers[0][question], … so legacy Render backend accepts arrays.
 */
export function appendProfileFormFields(parts, fields = {}) {
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    if (key === 'niche' || key === 'questionAndAnswers') {
      appendNestedParts(parts, key, value);
      return;
    }
    if (key === 'previousVideos' || key === 'socialMediaProfiles' || key === 'location') {
      if (typeof value === 'object') {
        appendNestedParts(parts, key, value);
      } else {
        appendScalarPart(parts, key, value);
      }
      return;
    }
    if (typeof value === 'object') {
      parts.push({ name: key, data: JSON.stringify(value) });
    } else {
      appendScalarPart(parts, key, value);
    }
  });
}

export function getFetchBlobHttpStatus(resp) {
  try {
    const i = typeof resp.info === 'function' ? resp.info() : resp.respInfo;
    const n = Number(i?.status ?? i?.statusCode ?? 0);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export async function putProfileMultipart({
  url,
  token,
  parts,
  onProgress,
  timeoutMs = 300000,
}) {
  const fileCount = parts.filter((p) => p.filename).length;
  const fileNames = parts.filter((p) => p.filename).map((p) => p.filename);
  console.log('[API →] PUT (multipart)', url, {
    fileParts: fileCount,
    textParts: parts.length - fileCount,
    filenames: fileNames,
  });
  logMultipartTextParts('putProfileMultipart request', parts);
  const resp = await RNFetchBlob.config({ timeout: timeoutMs })
    .fetch(
      'PUT',
      url,
      {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      parts,
    )
    .uploadProgress((sent, total) => {
      if (typeof onProgress === 'function') {
        onProgress({ sent, total });
      }
    });
  const status = getFetchBlobHttpStatus(resp);
  const tag = status >= 400 ? '[API ✗]' : '[API ✓]';
  console.log(tag, 'PUT (multipart)', url, status);
  return resp;
}
