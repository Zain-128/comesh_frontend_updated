/** Thunk/RNFetchBlob callbacks may pass object or JSON string. */
export function normalizeUploadResponse(data) {
  if (data?.payload != null && data?.meta?.requestStatus) {
    return normalizeUploadResponse(data.payload);
  }
  if (
    data &&
    typeof data === 'object' &&
    typeof data.type === 'string' &&
    data.type.endsWith('/fulfilled') &&
    data.payload != null
  ) {
    return normalizeUploadResponse(data.payload);
  }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data;
  }
  if (typeof data === 'string') {
    const t = data.trim();
    if (!t || t.startsWith('<')) {
      return { success: false, message: 'Upload failed. Please try again.' };
    }
    try {
      return JSON.parse(t);
    } catch {
      return { success: false, message: 'Upload failed. Please try again.' };
    }
  }
  return { success: false, message: 'Upload failed. Please try again.' };
}
