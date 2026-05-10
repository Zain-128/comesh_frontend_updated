import { Platform } from 'react-native';

/**
 * System UI stack (no bundled .ttf) — Inter was listed in Info.plist but not in the app bundle, which caused iOS font errors.
 * Use `fontWeight` where you need weight (see Typography, PrimaryButton).
 */
export const fontsFamily = {
  thin: Platform.select({ ios: 'System', android: 'sans-serif-thin', default: 'System' }),
  light: Platform.select({ ios: 'System', android: 'sans-serif-light', default: 'System' }),
  extraLight: Platform.select({ ios: 'System', android: 'sans-serif-light', default: 'System' }),
  regular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  medium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  semibold: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  bold: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  extrabold: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  black: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
};

/**
 * Fixed scale — avoids calling RFPercentage at module load (accesses native Dimensions before JS runtime is ready on some builds).
 */
export const fontsSize = {
  xxs: 10,
  xs: 11,
  sm1: 12,
  sm2: 13,
  md1: 14,
  md2: 16,
  lg1: 17,
  lg2: 18,
  xl1: 19,
  xl2: 20,
  xxl1: 21,
  xxl2: 22,
};
