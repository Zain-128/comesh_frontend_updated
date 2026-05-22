import { useCallback, useRef } from "react";
import { InteractionManager, Platform } from "react-native";
import {
  launchCamera as rnLaunchCamera,
  launchImageLibrary as rnLaunchImageLibrary,
} from "react-native-image-picker";

/**
 * iOS: PHPicker / photo export can invoke the JS callback more than once in quick succession,
 * which triggers "Callback arg cannot be called more than once" (RCTTurboModule).
 * Coalesce to a single macrotask and defer app work until after transitions complete
 * (reduces priority-inversion / QoS warnings around heavy native video mapping).
 */
function wrapPickerCallback(callback, { immediate = false } = {}) {
  if (Platform.OS !== "ios" || typeof callback !== "function") {
    return callback;
  }
  if (immediate) {
    let delivered = false;
    return (response) => {
      if (delivered) {
        return;
      }
      delivered = true;
      callback(response);
    };
  }
  let timeoutId = null;
  let latest = null;
  return (response) => {
    latest = response;
    if (timeoutId != null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      const res = latest;
      latest = null;
      InteractionManager.runAfterInteractions(() => {
        callback(res);
      });
    }, 0);
  };
}

function splitPickerOptions(options) {
  const opts = { ...(options || {}) };
  const immediate = Boolean(opts.immediateCallback);
  delete opts.immediateCallback;
  return { pickerOptions: opts, immediate };
}

export function launchImageLibrary(options, callback) {
  const { pickerOptions, immediate } = splitPickerOptions(options);
  return rnLaunchImageLibrary(
    pickerOptions,
    wrapPickerCallback(callback, { immediate }),
  );
}

export function launchCamera(options, callback) {
  const { pickerOptions, immediate } = splitPickerOptions(options);
  return rnLaunchCamera(
    pickerOptions,
    wrapPickerCallback(callback, { immediate }),
  );
}

/**
 * Blocks overlapping picker sessions (double-tap / rapid taps) which can trigger
 * duplicate native callbacks on iOS.
 */
export function useImagePickerLock() {
  const busy = useRef(false);
  const launchImageLibraryLocked = useCallback((options, callback) => {
    if (busy.current) return;
    busy.current = true;
    const { pickerOptions, immediate } = splitPickerOptions(options);
    rnLaunchImageLibrary(pickerOptions, wrapPickerCallback((res) => {
      try {
        callback(res);
      } finally {
        busy.current = false;
      }
    }, { immediate }));
  }, []);
  const launchCameraLocked = useCallback((options, callback) => {
    if (busy.current) return;
    busy.current = true;
    const { pickerOptions, immediate } = splitPickerOptions(options);
    rnLaunchCamera(pickerOptions, wrapPickerCallback((res) => {
      try {
        callback(res);
      } finally {
        busy.current = false;
      }
    }, { immediate }));
  }, []);
  return { launchImageLibrary: launchImageLibraryLocked, launchCamera: launchCameraLocked };
}
