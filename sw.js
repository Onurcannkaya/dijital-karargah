// sw.js — Dijital Karargâh Service Worker (Production + Push)
const CACHE_NAME = 'karargah-v2.2-fix';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/db.js',
  '/js/app.js',
  '/manifest.json'
];

// INSTALL — tüm statik varlıkları önbelleğe al
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// ACTIVATE — eski tüm önbellekleri sil
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// FETCH — JS/CSS: network-first, diğer: cache-first
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // JS ve CSS dosyaları → Önce ağı dene (NETWORK-FIRST)
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Diğer dosyalar (HTML, manifest, resimler) → CACHE-FIRST
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ─────────────────────────────────────────────
// 🔔 WEB PUSH — Arka Plan Bildirimleri
// ─────────────────────────────────────────────

/**
 * PUSH EVENT — Sunucudan gelen push mesajlarını yakalar.
 * Uygulama kapalı olsa bile bildirim gösterir.
 */
self.addEventListener('push', (event) => {
  let data = { title: 'Dijital Karargâh', body: 'Yeni bir bildiriminiz var', url: '/' };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: '📋 Görüntüle' },
      { action: 'dismiss', title: '❌ Kapat' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

/**
 * NOTIFICATION CLICK — Bildirime tıklanınca uygulamayı aç/odakla.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Zaten açık bir pencere varsa odakla
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Yoksa yeni pencere aç
      return clients.openWindow(targetUrl);
    })
  );
});

// ─────────────────────────────────────────────
// 📩 MESSAGE — app.js'den gelen mesajları dinle
// ─────────────────────────────────────────────

/**
 * Uygulama açıkken app.js'den postMessage ile gelen
 * bildirim isteklerini yakalar (local push simulation).
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, url } = event.data.payload || {};
    self.registration.showNotification(title || 'Dijital Karargâh', {
      body: body || '',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: { url: url || '/' }
    });
  }
});
