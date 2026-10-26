/* South Side Open Bar — service worker (offline support)
   UPDATING THE APP: change CACHE below (e.g. "ssb-openbar-2.0.1") every time you upload a new
   index.html, and set the same number in APP_VERSION inside index.html.
   Strategy: the app page is fetched from the network first (so updates arrive as soon as the
   device is online) and falls back to the saved copy when offline. Icons etc. are cache-first. */
const CACHE = "ssb-openbar-2.1.0";
const ASSETS = ["./", "./index.html", "./manifest.json", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === "navigate" || /\/(index\.html)?$/.test(new URL(req.url).pathname);
  if (isPage) {
    e.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put("./index.html", copy));
        return resp;
      }).catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(r => r || fetch(req).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
      return resp;
    }))
  );
});
