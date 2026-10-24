const CACHE_NAME = "nexus-os-v54";
const APP_SHELL = [
  "./",
  "./index.html?v=48",
  "./style.css?v=46",
  "./app.js?v=47",
  "./nexus-apps.css?v=46",
  "./nexus-apps-more.css?v=46",
  "./nexus-apps.js?v=46",
  "./nexus-apps-2.js?v=49",
  "./nexus-apps-3.js?v=46",
  "./nexus-apps-4.js?v=46",
  "./nexus-apps-5.js?v=46",
  "./nexus-apps-6.js?v=46",
  "./nexus-apps-7.js?v=46",
  "./nexus-ai-control.js?v=46",
  "./nexus-youtube.js?v=2",
  "./nexus-core.js?v=2",
  "./companion-screen.js?v=1",
  "./nexus-companion-brain.js?v=1",
  "./nexus-fullscreen.js?v=1",
  "./nexus-layout.js?v=1",
  "./nexus-control-center.js?v=2",
  "./face-companion.js?v=7",
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
