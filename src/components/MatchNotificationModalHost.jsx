import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  heightPercentageToDP,
  widthPercentageToDP,
} from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/AntDesign';
import { Typography } from './Typography';
import colors from '../constants/colors';
import {
  hideMatchNotification,
  subscribeMatchNotification,
} from '../utils/matchNotificationModal';

const VARIANTS = {
  match: { icon: 'heart', colors: [colors.primary, colors.secondary] },
  like_back: { icon: 'like2', colors: ['#FF6B9D', colors.primary] },
  waiting: { icon: 'clockcircleo', colors: ['#7B8CFF', colors.secondary] },
  liked: { icon: 'like1', colors: [colors.primary, colors.secondaryLight] },
  limit: { icon: 'lock', colors: ['#FFB347', '#FF6B35'] },
  upgrade: { icon: 'star', colors: [colors.primary, colors.secondary] },
  super_like: { icon: 'star', colors: ['#FFD700', colors.primary] },
  info: { icon: 'infocirlceo', colors: [colors.secondary, colors.primary] },
};

const AUTO_CLOSE_MS = 3000;
const TOAST_AUTO_CLOSE_MS = 2200;

export default function MatchNotificationModalHost() {
  const [config, setConfig] = useState(null);
  const [busy, setBusy] = useState(false);
  const autoCloseTimer = useRef(null);
  const insets = useSafeAreaInsets();
  const isToast = config?.placement === 'toast';
  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => subscribeMatchNotification(setConfig), []);

  const close = useCallback(() => {
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }
    hideMatchNotification();
    setConfig(null);
    setBusy(false);
  }, []);

  useEffect(() => {
    if (!config) return undefined;

    autoCloseTimer.current = setTimeout(
      () => {
        close();
      },
      config.placement === 'toast' ? TOAST_AUTO_CLOSE_MS : AUTO_CLOSE_MS,
    );

    return () => {
      if (autoCloseTimer.current) {
        clearTimeout(autoCloseTimer.current);
        autoCloseTimer.current = null;
      }
    };
  }, [config, close]);

  useEffect(() => {
    if (!isToast) return undefined;
    toastAnim.setValue(0);
    Animated.spring(toastAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 80,
    }).start();
    return undefined;
  }, [isToast, config, toastAnim]);

  const onPrimary = async () => {
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }
    if (busy || !config?.onPrimary) {
      close();
      return;
    }
    setBusy(true);
    try {
      await config.onPrimary();
    } finally {
      close();
    }
  };

  const onSecondary = () => {
    if (autoCloseTimer.current) {
      clearTimeout(autoCloseTimer.current);
      autoCloseTimer.current = null;
    }
    config?.onSecondary?.();
    close();
  };

  if (!config) return null;

  const variant = VARIANTS[config.variant] || VARIANTS.info;

  if (isToast) {
    return (
      <View style={styles.toastWrap} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.toastContainer,
            {
              marginTop: insets.top + 8,
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-24, 0],
                  }),
                },
              ],
            },
          ]}
          pointerEvents="box-none">
          <Pressable style={styles.toastCard} onPress={close}>
            <LinearGradient
              colors={variant.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.toastIcon}>
              <Icon name={variant.icon} size={18} color="#fff" />
            </LinearGradient>
            <View style={styles.toastTextWrap}>
              <Typography
                textType="semiBold"
                size={15}
                color="#1B2030"
                children={config.title}
              />
              {!!config.message && (
                <Typography
                  textType="regular"
                  size={12.5}
                  color="#5C6470"
                  style={styles.toastMessage}
                  children={config.message}
                />
              )}
            </View>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  const primaryLabel = config.primaryLabel || 'OK';
  const secondaryLabel = config.secondaryLabel || 'Not now';

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent>
      <Pressable style={styles.overlay} onPress={close}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <LinearGradient
            colors={variant.colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconRing}>
            <View style={styles.iconInner}>
              <Icon name={variant.icon} size={34} color={colors.primary} />
            </View>
          </LinearGradient>

          <Typography
            textType="bold"
            size={22}
            align="center"
            style={styles.title}
            children={config.title}
          />
          <Typography
            textType="regular"
            size={15}
            color="#5C6470"
            align="center"
            style={styles.message}
            children={config.message}
          />

          <TouchableOpacity
            activeOpacity={0.9}
            disabled={busy}
            onPress={onPrimary}
            style={styles.primaryWrap}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.primaryBtn}>
              <Typography
                textType="semiBold"
                size={16}
                color="#fff"
                children={primaryLabel}
              />
            </LinearGradient>
          </TouchableOpacity>

          {config.secondaryLabel !== null && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onSecondary}
              style={styles.secondaryBtn}>
              <Typography
                textType="medium"
                size={15}
                color="#7A8494"
                children={secondaryLabel}
              />
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 18, 35, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: widthPercentageToDP(6),
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: widthPercentageToDP(6),
    paddingTop: heightPercentageToDP(3),
    paddingBottom: heightPercentageToDP(2.5),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  iconRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: heightPercentageToDP(2),
  },
  iconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  message: {
    lineHeight: 22,
    marginBottom: heightPercentageToDP(2.5),
    paddingHorizontal: 4,
  },
  primaryWrap: {
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  primaryBtn: {
    width: '100%',
    minHeight: heightPercentageToDP(6.2),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  secondaryBtn: {
    marginTop: heightPercentageToDP(1.5),
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  toastWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  toastContainer: {
    width: '100%',
    paddingHorizontal: widthPercentageToDP(4),
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 8,
  },
  toastIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toastTextWrap: {
    flex: 1,
  },
  toastMessage: {
    marginTop: 2,
  },
});
