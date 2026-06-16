const CACHE_NAME = "yoyuan-ledger-v2";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./styles/main.css",
  "./styles/tokens.css",
  "./styles/base.css",
  "./styles/layout.css",
  "./styles/components.css",
  "./scripts/app.js",
  "./scripts/config.js",
  "./scripts/state.js",
  "./scripts/services/calendar.js",
  "./scripts/services/weather.js",
  "./scripts/utils/date.js",
  "./scripts/utils/format.js",
  "./scripts/views/render.js",
  "./scripts/views/shell.js",
  "./assets/icons/app-icon.svg",
  "./assets/icons/app-icon-192.png",
  "./assets/icons/app-icon-512.png",
  "./assets/icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
