// Brainly's service worker. It makes the app installable on every Chrome version (older ones
// on Android require a service worker with a fetch handler) and shows a friendly page when a
// page is opened with no connection. Everything else goes straight to the network: no caching
// of the app or of API responses.
const OFFLINE = "/offline.html";
const CACHE = "brainly-offline-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE)));
});
