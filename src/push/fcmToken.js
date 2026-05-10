import { getApp, getApps } from '@react-native-firebase/app';
import { getMessaging, getToken } from '@react-native-firebase/messaging';

import { pushLog } from './pushLog';

/** FCM device token via modular API (no deprecated `messaging()` namespaced calls). */
export async function getFcmRegistrationToken() {
  const count = getApps().length;
  if (!count) {
    pushLog('getFcmRegistrationToken: skip — no Firebase app (getApps length 0)');
    return null;
  }
  try {
    const token = await getToken(getMessaging(getApp()));
    pushLog(
      'getFcmRegistrationToken: OK',
      token ? `len=${String(token).length}` : 'empty',
    );
    return token || null;
  } catch (e) {
    pushLog('getFcmRegistrationToken: error', e?.message ?? e);
    return null;
  }
}
