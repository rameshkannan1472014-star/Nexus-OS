const CACHE_NAME = "nexus-os-v41";
const APP_SHELL = [
  "./",
  "./index.html?v=41",
  "./style.css?v=41",
  "./app.js?v=41",
  "./nexus-apps.css?v=41",
  "./nexus-apps-more.css?v=41",
  "./nexus-apps.js?v=41",
  "./nexus-apps-2.js?v=41",
  "./nexus-apps-3.js?v=41",
  "./nexus-apps-4.js?v=41",
  "./nexus-apps-5.js?v=41",
  "./nexus-apps-6.js?v=41",
  "./nexus-apps-7.js?v=41",
  "./manifest.json",
  "./icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key.startsWith("nexus-os-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;

  // Prefer fresh app files online; use the cache only if the network is unavailable.
  event.respondWith(
    fetch(request).then((response) => {
      if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") {
        const home = await caches.match("./index.html");
        if (home) return home;
      }
      return Response.error();
    })
  );
});
