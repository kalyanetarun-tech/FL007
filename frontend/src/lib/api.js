import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  timeout: 30000, // 30s ceiling — don't hang forever
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("funland_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Simple retry helper for GETs on transient network errors
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const cfg = err.config || {};
    const status = err?.response?.status;
    const isNetwork = !err.response; // no response = network drop / timeout
    const method = (cfg.method || "get").toLowerCase();

    // Auto-retry GETs on network errors up to 2 times with backoff
    if (isNetwork && method === "get" && (cfg._retryCount || 0) < 2) {
      cfg._retryCount = (cfg._retryCount || 0) + 1;
      await new Promise((r) => setTimeout(r, 500 * cfg._retryCount));
      return api(cfg);
    }

    // 401: token invalid/expired -> only redirect on user-initiated requests, not background auth checks
    if (status === 401) {
      const isBackgroundAuth = cfg.url && cfg.url.endsWith("/auth/me") && cfg._background;
      if (!isBackgroundAuth && window.location.pathname !== "/login") {
        localStorage.removeItem("funland_token");
        localStorage.removeItem("funland_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  },
);

export const fmtErr = (e) => {
  if (!e?.response) return "Network problem — checking connection…";
  const d = e?.response?.data?.detail;
  if (typeof d === "string") return d;
  if (Array.isArray(d)) return d.map((x) => x.msg || JSON.stringify(x)).join(", ");
  return e?.message || "Something went wrong";
};

export const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
