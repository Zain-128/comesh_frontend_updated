/**
 * RNFetchBlob uploadProgress: bytes hit 100% before server ffmpeg/ImageKit finishes.
 * Cap bar at 0.95 until done; then show "Finishing up…".
 */
export function applyUploadProgress(pe, setProgress, setProcessingOnServer) {
  if (!pe?.total) {
    return;
  }
  const ratio = pe.sent / pe.total;
  if (ratio >= 1) {
    setProcessingOnServer?.(true);
    setProgress?.(0.95);
  } else {
    setProcessingOnServer?.(false);
    setProgress?.(Math.min(0.95, ratio));
  }
}

export function resetUploadProgress(setProgress, setProcessingOnServer) {
  setProcessingOnServer?.(false);
  setProgress?.(0);
}

/** Server returned — clear overlay (videos may still process in background). */
export function completeUploadProgress(
  setProgress,
  setProcessingOnServer,
) {
  setProcessingOnServer?.(false);
  setProgress?.(1);
}

export function isMediaProcessingResponse(res) {
  return Boolean(res?.mediaProcessing || res?.data?.mediaProcessing);
}
