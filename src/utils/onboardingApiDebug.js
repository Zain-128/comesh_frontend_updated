const TAG = '[CoMesh/Onboard]';

function previewValue(value, max = 160) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    return `array(len=${value.length}) ${JSON.stringify(value).slice(0, max)}`;
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value).slice(0, max);
    } catch {
      return '[object]';
    }
  }
  return String(value).slice(0, max);
}

/** Log JSON / multipart field payload shape before API call. */
export function logOnboardingPayload(label, payload = {}) {
  const fields = {};
  Object.entries(payload).forEach(([key, value]) => {
    fields[key] = {
      typeof: typeof value,
      isArray: Array.isArray(value),
      preview: previewValue(value),
    };
  });
  console.log(`${TAG} ${label} — payload fields:`, fields);
  try {
    console.log(`${TAG} ${label} — payload JSON:`, JSON.stringify(payload, null, 2));
  } catch (e) {
    console.log(`${TAG} ${label} — payload (non-JSONable)`, payload);
  }
}

/** Log RNFetchBlob multipart text parts (no file bytes). */
export function logMultipartTextParts(label, parts = []) {
  const textParts = parts
    .filter((p) => !p.filename)
    .map((p) => ({
      name: p.name,
      dataPreview: previewValue(p.data, 200),
    }));
  console.log(`${TAG} ${label} — multipart text parts (${textParts.length}):`, textParts);
}

/** Log API response / error body. */
export function logOnboardingResponse(label, data, extra = {}) {
  console.log(`${TAG} ${label} — response:`, {
    success: data?.success,
    message: data?.message,
    mediaProcessing: data?.mediaProcessing ?? data?.data?.mediaProcessing,
    httpStatus: extra.httpStatus,
    ...extra,
  });
  try {
    console.log(`${TAG} ${label} — response JSON:`, JSON.stringify(data, null, 2));
  } catch {
    console.log(`${TAG} ${label} — response raw:`, data);
  }
}

/** Server expects niche: string[] */
export function normalizeNicheForApi(niche) {
  if (niche == null || niche === '') {
    return undefined;
  }
  if (Array.isArray(niche)) {
    return niche.filter(Boolean).map(String);
  }
  if (typeof niche === 'string') {
    const t = niche.trim();
    if (!t) return undefined;
    if (t.startsWith('[')) {
      try {
        const parsed = JSON.parse(t);
        return Array.isArray(parsed) ? parsed.map(String) : [t];
      } catch {
        return [t];
      }
    }
    return [t];
  }
  return [String(niche)];
}
