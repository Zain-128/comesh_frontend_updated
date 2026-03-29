import axios from "axios";
import endPoints from "../constants/endPoints";

/** Set from `redux/store.js` after `configureStore` to avoid circular imports. */
let storeRef;
export function injectStore(store) {
  storeRef = store;
}

const apiRequest = axios.create({
  baseURL: String(endPoints.baseUrl || "").trim(),
  headers: {
    "Content-Type": "application/json",
    Accept: "*/*",
    Connection: "keep-alive",
  },
  timeout: 10000,
});

apiRequest.interceptors.request.use(
  function (config) {
    if (typeof config.url === "string") {
      config.url = config.url.trim();
    }
    if (typeof config.baseURL === "string") {
      config.baseURL = config.baseURL.trim();
    }
    const token = storeRef?.getState()?.user?.token;
    const base = config.baseURL || endPoints.baseUrl || "";
    config.headers = {
      ...config.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(String(base).includes("ngrok")
        ? { "ngrok-skip-browser-warning": "true" }
        : {}),
    };
    const data = config.data;
    if (data && typeof FormData !== "undefined" && data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

/** Axios merges baseURL + url with a slash; naive concat would show `.../apiusers/...`. */
function displayRequestUrl(baseURL, urlPath) {
  const b = String(baseURL || "").replace(/\/+$/, "");
  const u = String(urlPath || "").replace(/^\/+/, "");
  if (!u) return b;
  if (/^https?:\/\//i.test(u)) return u;
  return `${b}/${u}`;
}

function logApiLine(prefix, method, url, status, payload) {
  const safeUrl = url || "";
  console.log(prefix, method, safeUrl, status != null ? status : "", payload);
}

apiRequest.interceptors.response.use(
  function (response) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      const cfg = response.config || {};
      const method = (cfg.method || "get").toUpperCase();
      const url = displayRequestUrl(cfg.baseURL, cfg.url);
      logApiLine("[API ✓]", method, url, response.status, response.data);
    }
    return response;
  },
  function (error) {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      const cfg = error.config || {};
      const method = (cfg.method || "get").toUpperCase();
      const url = displayRequestUrl(cfg.baseURL, cfg.url);
      const res = error.response;
      logApiLine(
        "[API ✗]",
        method,
        url,
        res?.status,
        res?.data ?? error.message
      );
    }
    return Promise.reject(error);
  }
);

export default apiRequest;
