/* Prestige Abaya — Service Worker (smart notifications) */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = data;
    event.waitUntil(self.registration.showNotification(title, options));
  }
});
