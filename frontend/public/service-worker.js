/* Funland CRM service worker — offline shell for PWA */
const CACHE_NAME = "funland-shell-v3";
const SHELL = ["/", "/index.html", "/manifest.json", "/favicon.ico"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(SHELL).catch(() => null)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // NEVER cache API requests - always go network fresh
  if (url.pathname.startsWith("/api/")) return;

  // For same-origin GET navigation / assets: network-first, fallback to cache
  if (req.method === "GET" && url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp && resp.status === 200 && (req.destination === "document" || req.destination === "script" || req.destination === "style" || req.destination === "image" || req.destination === "font")) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone).catch(() => null));
          }
          return resp;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match("/index.html"))
        )
    );
  }
});
