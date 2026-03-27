import { Video } from "react-native-compressor";

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
