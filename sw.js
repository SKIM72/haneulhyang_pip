const CACHE_NAME = 'haneulhyang-pwa-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/list.html',
  '/detail.html',
  '/assets/favicon.png',
  '/assets/icon1.png',
  '/assets/band.png',
  '/assets/band_hover.png'
];

// 서비스 워커 설치 및 캐시 저장
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// 활성화 및 구버전 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 네트워크 우선 (Network First) 전략 - 동적 데이터(Supabase) 보호
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});