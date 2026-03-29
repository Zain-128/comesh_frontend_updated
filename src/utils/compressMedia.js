import { Image as CompressorImage, Video } from "react-native-compressor";

/**
 * Resize + JPEG compress before chat image upload (smaller payload, faster send).
 * Falls back to original uri if compression fails.
 */
export async function compressImageForUpload(uri) {
  if (!uri || typeof uri !== "string") return uri;
  try {
    const out = await CompressorImage.compress(uri, {
      compressionMethod: "auto",
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 0.72,
      output: "jpg",
    });
    return out || uri;
  } catch (e) {
    console.warn("compressImageForUpload failed, using original", e);
    return uri;
  }
}

/**
 * Client-side video compression before upload (smaller payload, faster upload).
 * Falls back to original uri if compression fails.
 */
export async function compressVideoForUpload(uri, onProgress) {
  if (!uri) return uri;
  try {
    const out = await Video.compress(
      uri,
      {
        compressionMethod: "auto",
        maxSize: 1280,
        minimumFileSizeForCompress: 512 * 1024,
      },
      typeof onProgress === "function" ? (progress) => onProgress(progress) : undefined
    );
    return out || uri;
  } catch (e) {
    console.warn("compressVideoForUpload failed, using original", e);
    return uri;
  }
}
