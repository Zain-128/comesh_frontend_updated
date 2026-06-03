import { Image as CompressorImage, Video } from "react-native-compressor";
import {
  PROFILE_VIDEO_MAX_BYTES,
  resolveAssetFileSize,
} from "../constants/videoUploadLimits";

/**
 * Legacy / chat video paths. Prefer singlePhotoPickerOptions() at pick time.
 * Profile images: picker quality + server sharp (no client compress on upload).
 */
export async function compressImageForUpload(uri) {
  if (!uri || typeof uri !== "string") return uri;
  try {
    const out = await CompressorImage.compress(uri, {
      compressionMethod: "auto",
      maxWidth: 1280,
      maxHeight: 1280,
      quality: 0.65,
      output: "jpg",
    });
    return out || uri;
  } catch (e) {
    console.warn("compressImageForUpload failed, using original", e);
    return uri;
  }
}

/**
 * Chat / legacy paths only. Profile videos upload raw; server transcodes once.
 */
export async function compressVideoForUpload(uri, onProgress) {
  if (!uri) return uri;
  try {
    const out = await Video.compress(
      uri,
      {
        compressionMethod: "auto",
        maxSize: 720,
        minimumFileSizeForCompress: 128 * 1024,
      },
      typeof onProgress === "function" ? (progress) => onProgress(progress) : undefined
    );
    return out || uri;
  } catch (e) {
    console.warn("compressVideoForUpload failed, using original", e);
    return uri;
  }
}

/**
 * Gallery / profile picks: compress until ≤5MB (auto + manual passes).
 */
export async function compressVideoForProfileUpload(uri, onProgress) {
  if (!uri) return uri;
  const onProg =
    typeof onProgress === "function" ? (progress) => onProgress(progress) : undefined;

  const passes = [
    { compressionMethod: "auto", maxSize: 640, minimumFileSizeForCompress: 0 },
    { compressionMethod: "auto", maxSize: 480, minimumFileSizeForCompress: 0 },
    { compressionMethod: "auto", maxSize: 360, minimumFileSizeForCompress: 0 },
    { compressionMethod: "auto", maxSize: 320, minimumFileSizeForCompress: 0 },
    {
      compressionMethod: "manual",
      maxSize: 360,
      bitrate: 900_000,
      stripAudio: true,
      minimumFileSizeForCompress: 0,
    },
    {
      compressionMethod: "manual",
      maxSize: 320,
      bitrate: 650_000,
      stripAudio: true,
      minimumFileSizeForCompress: 0,
    },
    {
      compressionMethod: "manual",
      maxSize: 280,
      bitrate: 480_000,
      stripAudio: true,
      minimumFileSizeForCompress: 0,
    },
  ];

  let current = uri;
  try {
    for (const opts of passes) {
      const out = await Video.compress(current, opts, onProg);
      if (out) {
        current = out;
      }
      const bytes = await resolveAssetFileSize({ uri: current });
      if (bytes != null && bytes <= PROFILE_VIDEO_MAX_BYTES) {
        return current;
      }
    }
    return current;
  } catch (e) {
    console.warn("compressVideoForProfileUpload failed, using original", e);
    return uri;
  }
}
