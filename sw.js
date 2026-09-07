const CACHE_NAME = 'haneulhyang-pwa-v4';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/list.html',
  '/detail.html',
  '/offline.html',
  '/manifest.json',
  '/assets/tailwind.css',
  '/assets/app.js',
  '/assets/favicon-32.png',
  '/assets/apple-touch-icon.png',
  '/assets/icon-192.png',
  '/assets/icon1.png',
  '/assets/band.png',
  '/assets/band_hover.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// 네트워크 우선. 실패 시 캐시, 그래도 없으면(페이지 이동일 때) 오프라인 안내.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // 동적 데이터(Supabase API)는 서비스워커가 관여하지 않는다.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        if (req.mode === 'navigate') return caches.match('/offline.html');
        return Response.error();
      })
  );
});
