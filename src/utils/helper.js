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
  const value = String(input).trim();
  if (!value.length) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;

  const apiBase = String(endPoints.baseUrl || "");
  const origin = apiBase.replace(/\/comesh\/api\/?$/, "").replace(/\/api\/?$/, "");
  if (!origin) return value;

  if (value.startsWith("/")) return `${origin}${value}`;
  return `${origin}/${value}`;
};

export default {
  FollowersPrefix,
  sentenceCase,
  resolveMediaUrl,
};
