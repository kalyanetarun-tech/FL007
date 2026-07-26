/**
 * Reliability layer for Funland CRM:
 * 1. Register service worker for offline shell
 * 2. Auto-reload on chunk load errors (stale bundle after deploy)
 * 3. Global unhandled error / promise rejection catcher (logs, prevents crash)
 * 4. Backend heartbeat ping every 45s → sets navigator-like offline state
 */
import { api } from "@/lib/api";

let backendOnline = true;
const listeners = new Set();

export function onBackendStatusChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
export function isBackendOnline() { return backendOnline; }

const setStatus = (v) => {
  if (backendOnline === v) return;
  backendOnline = v;
  listeners.forEach((l) => { try { l(v); } catch { /* ignore */ } });
};

async function ping() {
  try {
    const r = await api.get("/ping", { timeout: 8000, _background: true });
    setStatus(r.status === 200);
  } catch {
    setStatus(false);
  }
}

export function startReliability() {
  // 1. Register service worker (PWA offline shell)
  if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .catch(() => { /* silent */ });
    });
  }

  // 2. Auto-reload on chunk load errors (happens when new deploy invalidates old chunks)
  const chunkErrRe = /Loading chunk [\d]+ failed|ChunkLoadError|Failed to fetch dynamically imported module/i;
  window.addEventListener("error", (e) => {
    const msg = String(e?.message || e?.error?.message || "");
    if (chunkErrRe.test(msg)) {
      // eslint-disable-next-line no-console
      console.warn("[reliability] chunk load error, hard-reloading");
      try { window.location.reload(); } catch { /* ignore */ }
    }
  });

  // 3. Global unhandled promise rejection catcher — prevents silent freezes
  window.addEventListener("unhandledrejection", (e) => {
    // eslint-disable-next-line no-console
    console.warn("[reliability] unhandled rejection:", e?.reason);
    // Don't crash the app — just log
    e.preventDefault?.();
  });

  // 4. Heartbeat: check backend every 45s (only when logged in)
  const heartbeat = () => {
    if (localStorage.getItem("funland_token")) ping();
  };
  heartbeat(); // immediate
  setInterval(heartbeat, 45000);

  // Recheck on tab focus + on network back
  window.addEventListener("focus", heartbeat);
  window.addEventListener("online", heartbeat);
}
