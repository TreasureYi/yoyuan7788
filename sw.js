const CACHE_NAME = "yoyuan-ledger-v2";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./project/styles/main.css",
  "./project/styles/tokens.css",
  "./project/styles/base.css",
  "./project/styles/layout.css",
  "./project/styles/components.css",
  "./project/scripts/app.js",
  "./project/scripts/config.js",
  "./project/scripts/state.js",
  "./project/scripts/services/calendar.js",
  "./project/scripts/services/weather.js",
  "./project/scripts/utils/date.js",
  "./project/scripts/utils/format.js",
  "./project/scripts/views/render.js",
  "./project/scripts/views/shell.js",
  "./project/assets/icons/app-icon.svg",
  "./project/assets/icons/app-icon-192.png",
  "./project/assets/icons/app-icon-512.png",
  "./project/assets/icons/apple-touch-icon.png"
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
