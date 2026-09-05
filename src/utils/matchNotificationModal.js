let listener = null;

/**
 * @typedef {Object} MatchNotificationConfig
 * @property {string} title
 * @property {string} message
 * @property {'match' | 'like_back' | 'waiting' | 'liked' | 'limit' | 'upgrade' | 'info' | 'super_like'} [variant]
 * @property {'center' | 'toast'} [placement] - `toast` shows a lightweight top banner; defaults to center modal.
 * @property {string} [primaryLabel]
 * @property {string} [secondaryLabel]
 * @property {() => void | Promise<void>} [onPrimary]
 * @property {() => void} [onSecondary]
 */

/** @param {(config: MatchNotificationConfig | null) => void} fn */
export function subscribeMatchNotification(fn) {
  listener = fn;
  return () => {
    if (listener === fn) listener = null;
  };
}

/** @param {MatchNotificationConfig} config */
export function showMatchNotification(config) {
  listener?.({ ...config, visible: true });
}

export function hideMatchNotification() {
  listener?.(null);
}
