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

async function displayRemoteNotification(remoteMessage) {
  const channelId = await ensureAndroidChannel();
  const { title, body } = resolveTitleBody(remoteMessage);
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
        pushLog('FCM background handler fired', {
          messageId: remoteMessage.messageId,
          hasNotification: Boolean(
            remoteMessage.notification?.title || remoteMessage.notification?.body,
          ),
        });
        if (remoteMessage.notification?.title || remoteMessage.notification?.body) {
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
  waitForFirebaseReady().then((ready) => {
    pushLog('subscribeForegroundMessages: Firebase readiness resolved', {
      ready,
      isActive,
    });
    if (!ready || !isActive) {
      pushLog('subscribeForegroundMessages: skipped registration', {
        ready,
        isActive,
      });
      return;
    }
    try {
      const msg = messagingInstance();
      unsubscribe = onMessage(msg, async (message) => {
        pushLog('FCM foreground onMessage', {
          messageId: message.messageId,
          hasNotification: Boolean(message.notification),
        });
        try {
          await displayRemoteNotification(message);
          pushLog('FCM foreground notification displayed');
        } catch (e) {
          pushLog('FCM foreground display failed', e?.message ?? e);
        }
      });
      pushLog('subscribeForegroundMessages: registered');
    } catch (e) {
      pushLog('subscribeForegroundMessages failed', e?.message ?? e);
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
