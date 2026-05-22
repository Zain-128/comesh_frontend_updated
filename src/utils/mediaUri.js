/** True for device file paths; false for CDN/http URLs already on the server. */
export function isLocalMediaUri(uri) {
  if (!uri) {
    return false;
  }
  return !/^https?:\/\//i.test(String(uri));
}
