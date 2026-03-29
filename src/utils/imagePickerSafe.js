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
function wrapPickerCallback(callback) {
  if (Platform.OS !== "ios" || typeof callback !== "function") {
    return callback;
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

export function launchImageLibrary(options, callback) {
  return rnLaunchImageLibrary(options, wrapPickerCallback(callback));
}

export function launchCamera(options, callback) {
  return rnLaunchCamera(options, wrapPickerCallback(callback));
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
    rnLaunchImageLibrary(options, wrapPickerCallback((res) => {
      try {
        callback(res);
      } finally {
        busy.current = false;
      }
    }));
  }, []);
  const launchCameraLocked = useCallback((options, callback) => {
    if (busy.current) return;
    busy.current = true;
    rnLaunchCamera(options, wrapPickerCallback((res) => {
      try {
        callback(res);
      } finally {
        busy.current = false;
      }
    }));
  }, []);
  return { launchImageLibrary: launchImageLibraryLocked, launchCamera: launchCameraLocked };
}
