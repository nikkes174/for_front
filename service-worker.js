const CACHE_NAME = "cabinet-pwa-v11-visits-settings";
const APP_SHELL = [
  "/cabinet.html",
  "/auth.html",
  "/css/styles.css",
  "/css/cabinet.css",
  "/auth/pwa-manifest.webmanifest",
  "/js/cabinet.js",
  "/js/dom-legacy.js",
  "/pwa-icon.svg",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
  "/pwa-maskable-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/cabinet.html")));
    return;
  }
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request, { ignoreSearch: true })));
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(data.title || "Уведомление", {
    body: data.body || "",
    icon: data.icon || "/pwa-icon.svg",
    badge: data.badge || "/pwa-icon.svg",
    image: data.image || undefined,
    tag: data.tag || "organization-broadcast",
    data: { url: data.url || "/cabinet.html" },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const notificationData = event.notification.data || {};
  const url = notificationData.url || "/cabinet.html";
  event.waitUntil(clients.openWindow(url));
});
