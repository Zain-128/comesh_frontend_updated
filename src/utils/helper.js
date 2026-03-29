import endPoints from "../constants/endPoints";

const FollowersPrefix = (value) => {
  const num = Number(value || 0);
  if (!Number.isFinite(num)) return "0";

  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${num}`;
};

const sentenceCase = (text) => {
  if (text === null || text === undefined) return "";
  const normalized = String(text).trim();
  if (!normalized.length) return "";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
};

const resolveMediaUrl = (input) => {
  if (!input) return "";
  let value = String(input).trim();
  if (!value.length) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const u = new URL(value);
      const parts = u.pathname.split("/").filter(Boolean);
      /** Backend used to save `https://host/file.jpg` but files live under `/uploads/`. */
      if (
        parts.length === 1 &&
        /\.(jpe?g|png|gif|webp|bmp|mp4|mov|m4v|webm)$/i.test(parts[0])
      ) {
        u.pathname = `/uploads/${parts[0]}`;
        value = u.toString();
      }
    } catch {
      /* ignore */
    }
    return value;
  }

  const apiBase = String(endPoints.baseUrl || "");
  const origin = apiBase.replace(/\/comesh\/api\/?$/, "").replace(/\/api\/?$/, "");
  if (!origin) return value;

  if (value.startsWith("/")) return `${origin}${value}`;
  return `${origin}/${value}`;
};

/** RN `Image` / `Video` do not use axios; ngrok free serves ERR_NGROK_6024 HTML without this header. */
const getMediaSource = (input) => {
  const uri = resolveMediaUrl(input);
  if (!uri) return null;
  if (String(uri).includes("ngrok")) {
    return {
      uri,
      headers: { "ngrok-skip-browser-warning": "true" },
    };
  }
  return { uri };
};

/** Use for any `{ uri: helper.resolveMediaUrl(...) }` — forwards ngrok header when needed. */
const getMediaSourceOrUri = (input) => getMediaSource(input) || undefined;

export default {
  FollowersPrefix,
  sentenceCase,
  resolveMediaUrl,
  getMediaSource,
  getMediaSourceOrUri,
};
