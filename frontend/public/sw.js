// public/sw.js — BloodBridge Service Worker
// Handles background push notifications

const CACHE_NAME = 'bloodbridge-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// ── Handle push messages from the backend (Web Push) ─────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'BloodBridge', body: event.data.text() };
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.tag || 'bloodbridge-notification',
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
    requireInteraction: data.urgent || false,
    actions: data.actions || [],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'BloodBridge 🩸', options)
  );
});

// ── Handle notification click ─────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// ── Handle messages from the main thread (SSE → SW notification) ──────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag, url, urgent } = event.data.payload;
    self.registration.showNotification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: tag || 'bloodbridge',
      data: { url: url || '/dashboard' },
      vibrate: urgent ? [300, 100, 300, 100, 300] : [200, 100, 200],
      requireInteraction: !!urgent,
    });
  }
});
