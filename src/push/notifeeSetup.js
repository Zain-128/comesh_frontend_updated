import { getApp, getApps } from '@react-native-firebase/app';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import {
  AuthorizationStatus,
  getMessaging,
  onMessage,
  registerDeviceForRemoteMessages,
  requestPermission,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';

import { getFcmRegistrationToken } from './fcmToken';
import { pushLog } from './pushLog';

/** Metro / Xcode: grep `[CoMesh/Push/TRACE]` */
const PUSH_TRACE = '[CoMesh/Push/TRACE]';

function tracePush(step, info) {
  try {
    console.log(PUSH_TRACE, step, info);
  } catch {
    /* ignore */
  }
}

function summarizeRemoteMessage(rm) {
  if (!rm || typeof rm !== 'object') {
    return null;
  }
  const data = rm.data && typeof rm.data === 'object' ? rm.data : undefined;
  let dataKeys;
  let dataPreview;
  if (data) {
    dataKeys = Object.keys(data);
    dataPreview = Object.fromEntries(
      Object.entries(data).map(([k, v]) => {
        const s = v == null ? '' : String(v);
        return [k, s.length > 96 ? `${s.slice(0, 96)}…` : s];
      }),
    );
  }
  return {
    messageId: rm.messageId,
    from: rm.from,
    collapseKey: rm.collapseKey,
    sentTime: rm.sentTime,
    hasNotification: Boolean(rm.notification?.title || rm.notification?.body),
    notificationTitle: rm.notification?.title,
    notificationBodyLen: rm.notification?.body != null ? String(rm.notification.body).length : 0,
    dataKeys,
    dataPreview,
  };
}

const CHANNEL_ID = 'comesh';
const IOS_FOREGROUND_PRESENTATION_OPTIONS = {
  alert: true,
  badge: true,
  sound: true,
  banner: true,
  list: true,
};

/** Maps Firebase `AuthorizationStatus` number → name (NOT_DETERMINED=-1, DENIED=0, AUTHORIZED=1, …). */
export function firebaseAuthStatusLabel(code) {
  const hit = Object.entries(AuthorizationStatus).find(([, v]) => v === code);
  return hit ? `${hit[0]} (${code})` : String(code);
}

function messagingInstance() {
  return getMessaging(getApp());
}

/** Native FirebaseApp.configure() can lag first JS frame — splash used to bail before permission UI. */
async function waitForFirebaseReady(timeoutMs = 10000) {
  const t0 = Date.now();
  let attempt = 0;
  while (Date.now() - t0 < timeoutMs) {
    const n = getApps().length;
    if (n > 0) {
      pushLog('Firebase app ready', {
        appCount: n,
        waitedMs: Date.now() - t0,
      });
      return true;
    }
    attempt += 1;
    if (attempt === 1 || attempt % 40 === 0) {
      pushLog('waiting for Firebase default app…', {
        attempt,
        elapsedMs: Date.now() - t0,
      });
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  pushLog('Firebase default app never appeared — check AppDelegate FirebaseApp.configure()', {
    timeoutMs,
  });
  return false;
}

export async function ensureAndroidChannel() {
  return notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Comesh',
    sound: 'default',
    vibration: true,
    badge: true,
    importance: AndroidImportance.HIGH,
  });
}

export async function requestNotificationPermission() {
  pushLog('requestNotificationPermission: start', { platform: Platform.OS });

  const ready = await waitForFirebaseReady();
  if (!ready) {
    pushLog('requestNotificationPermission: stopping — Firebase not ready');
    return false;
  }

  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const post = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    pushLog('Android POST_NOTIFICATIONS', { result: post });
  }

  try {
    const settings = await notifee.requestPermission();
    pushLog('notifee.requestPermission', {
      authorizationStatus: settings?.authorizationStatus,
      decoded: firebaseAuthStatusLabel(settings?.authorizationStatus),
      android: settings?.android,
    });
  } catch (e) {
    pushLog('notifee.requestPermission failed', e?.message ?? e);
  }

  try {
    const msg = messagingInstance();
    const authStatus = await requestPermission(msg);
    pushLog('Firebase messaging.requestPermission', {
      authStatus,
      decoded: firebaseAuthStatusLabel(authStatus),
      hint:
        authStatus === AuthorizationStatus.DENIED
          ? 'OS blocked alerts — user must enable Settings → CoMesh → Notifications'
          : authStatus === AuthorizationStatus.NOT_DETERMINED
            ? 'Prompt not resolved yet — rare on iOS'
            : undefined,
    });
    const enabled =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL ||
      authStatus === AuthorizationStatus.EPHEMERAL;
    pushLog('requestNotificationPermission: canDeliverRemoteNotifications', enabled);
    return enabled;
  } catch (e) {
    pushLog('Firebase messaging.requestPermission failed', e?.message ?? e);
    return false;
  }
}

/**
 * Splash / login: OS notification permission + FCM registration token.
 */
export async function obtainFcmToken() {
  pushLog('obtainFcmToken: start');
  await requestNotificationPermission();
  if (Platform.OS === 'ios' && getApps().length) {
    try {
      await registerDeviceForRemoteMessages(messagingInstance());
      pushLog('iOS: registerDeviceForRemoteMessages OK');
    } catch (e) {
      pushLog('iOS: registerDeviceForRemoteMessages', e?.message ?? e);
    }
  }
  const token = await getFcmRegistrationToken();
  pushLog('obtainFcmToken: done', {
    hasToken: Boolean(token),
  });
  return token;
}

function resolveTitleBody(remoteMessage) {
  const title =
    remoteMessage.notification?.title ??
    remoteMessage.data?.title ??
    'CoMesh';
  const body =
    remoteMessage.notification?.body ??
    remoteMessage.data?.body ??
    '';
  return { title: String(title), body: String(body) };
}

/** Metro / Xcode: grep `[CoMesh/Push/FOREGROUND]` */
const FOREGROUND_TAG = '[CoMesh/Push/FOREGROUND]';

function truncateForLog(value, maxLen) {
  if (value == null) {
    return value;
  }
  const s = String(value);
  if (s.length <= maxLen) {
    return s;
  }
  return `${s.slice(0, maxLen)}…(+${s.length - maxLen} more chars)`;
}

function deepTruncateStrings(value, maxLen) {
  if (value == null) {
    return value;
  }
  if (typeof value === 'string') {
    return truncateForLog(value, maxLen);
  }
  if (Array.isArray(value)) {
    return value.map((item) => deepTruncateStrings(item, maxLen));
  }
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = deepTruncateStrings(v, maxLen);
    }
    return out;
  }
  return value;
}

function buildForegroundRemoteMessageLog(message) {
  const n = message?.notification;
  return {
    receivedAt: new Date().toISOString(),
    platform: Platform.OS,
    messageId: message?.messageId,
    from: message?.from,
    collapseKey: message?.collapseKey,
    sentTime: message?.sentTime,
    ttl: message?.ttl,
    data: message?.data && typeof message.data === 'object' ? { ...message.data } : message?.data,
    notification: n
      ? {
          title: n.title,
          body: n.body,
          android: n.android,
          ios: n.ios,
        }
      : undefined,
  };
}

function logForegroundFcmReceived(message) {
  try {
    const plain = buildForegroundRemoteMessageLog(message);
    const forJson = deepTruncateStrings(plain, 800);
    const resolved = resolveTitleBody(message);
    console.log(FOREGROUND_TAG, '========== FCM foreground onMessage ==========');
    console.log(FOREGROUND_TAG, 'remoteMessage top-level keys:', Object.keys(message || {}));
    console.log(
      FOREGROUND_TAG,
      'payload (JSON, long strings truncated per field):',
      JSON.stringify(forJson, null, 2),
    );
    console.log(FOREGROUND_TAG, 'resolveTitleBody → Notifee will use:', resolved);
    console.log(FOREGROUND_TAG, 'summary:', summarizeRemoteMessage(message));
    console.log(FOREGROUND_TAG, '============================================');
  } catch (e) {
    console.log(FOREGROUND_TAG, 'logForegroundFcmReceived failed', e?.message ?? e);
  }
}

async function displayRemoteNotification(remoteMessage) {
  tracePush('displayRemoteNotification:start', summarizeRemoteMessage(remoteMessage));
  const channelId = await ensureAndroidChannel();
  const { title, body } = resolveTitleBody(remoteMessage);
  tracePush('displayRemoteNotification:resolved', {
    channelId,
    title,
    bodyLen: String(body).length,
    platform: Platform.OS,
  });
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
      pressAction: { id: 'default' },
    },
    ios: {
      sound: 'default',
      foregroundPresentationOptions: IOS_FOREGROUND_PRESENTATION_OPTIONS,
    },
    data: remoteMessage.data,
  });
  tracePush('displayRemoteNotification:notifee.displayNotification OK', {
    title,
    bodyLen: String(body).length,
  });
}

let backgroundHandlerRegistered = false;

/**
 * Background / quit: data-only FCM → Notifee (notification payloads are shown by the OS).
 */
export function registerBackgroundHandler() {
  pushLog('registerBackgroundHandler: called', {
    alreadyRegistered: backgroundHandlerRegistered,
  });
  if (backgroundHandlerRegistered) {
    return;
  }
  waitForFirebaseReady().then((ready) => {
    pushLog('registerBackgroundHandler: Firebase readiness resolved', {
      ready,
      isActive: true,
      alreadyRegistered: backgroundHandlerRegistered,
    });
    if (!ready || backgroundHandlerRegistered) {
      return;
    }
    try {
      const msg = messagingInstance();
      setBackgroundMessageHandler(msg, async (remoteMessage) => {
        tracePush('FCM background setBackgroundMessageHandler', summarizeRemoteMessage(remoteMessage));
        pushLog('FCM background handler fired', {
          messageId: remoteMessage.messageId,
          hasNotification: Boolean(
            remoteMessage.notification?.title || remoteMessage.notification?.body,
          ),
        });
        if (remoteMessage.notification?.title || remoteMessage.notification?.body) {
          tracePush('FCM background: skip Notifee (notification payload — OS shows)', {
            messageId: remoteMessage.messageId,
          });
          return;
        }
        await displayRemoteNotification(remoteMessage);
      });
      backgroundHandlerRegistered = true;
      pushLog('registerBackgroundHandler: registered');
    } catch (e) {
      pushLog('registerBackgroundHandler failed', e?.message ?? e);
    }
  });
}

/** Foreground FCM → Notifee banner. */
export function subscribeForegroundMessages() {
  let isActive = true;
  let unsubscribe = null;

  pushLog('subscribeForegroundMessages: called');
  tracePush('subscribeForegroundMessages: called', { platform: Platform.OS });
  waitForFirebaseReady().then((ready) => {
    pushLog('subscribeForegroundMessages: Firebase readiness resolved', {
      ready,
      isActive,
    });
    tracePush('subscribeForegroundMessages: Firebase readiness resolved', {
      ready,
      isActive,
    });
    if (!ready || !isActive) {
      pushLog('subscribeForegroundMessages: skipped registration', {
        ready,
        isActive,
      });
      tracePush('subscribeForegroundMessages: SKIPPED onMessage registration', {
        ready,
        isActive,
      });
      return;
    }
    try {
      const msg = messagingInstance();
      unsubscribe = onMessage(msg, async (message) => {




        console.log('messageeeeeeeeeeee', message);
        logForegroundFcmReceived(message);
        tracePush('FCM foreground onMessage RAW', summarizeRemoteMessage(message));
        pushLog('FCM foreground onMessage', {
          messageId: message.messageId,
          hasNotification: Boolean(message.notification),
        });
        try {
          await displayRemoteNotification(message);
          pushLog('FCM foreground notification displayed');
        } catch (e) {
          tracePush('FCM foreground displayRemoteNotification ERROR', {
            message: e?.message ?? String(e),
          });
          pushLog('FCM foreground display failed', e?.message ?? e);
        }
      });
      pushLog('subscribeForegroundMessages: registered');
      tracePush('subscribeForegroundMessages: onMessage LISTENER REGISTERED', {});
    } catch (e) {
      pushLog('subscribeForegroundMessages failed', e?.message ?? e);
      tracePush('subscribeForegroundMessages: REGISTER FAILED', {
        message: e?.message ?? String(e),
      });
    }
  });

  return () => {
    pushLog('subscribeForegroundMessages: cleanup called', {
      hadUnsubscribe: typeof unsubscribe === 'function',
    });
    isActive = false;
    if (typeof unsubscribe === 'function') {
      unsubscribe();
      pushLog('subscribeForegroundMessages: unsubscribed');
    }
  };
}
