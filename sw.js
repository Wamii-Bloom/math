const CACHE_NAME = 'keisan-app-v2';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.PNG'
];

// インストール時にキャッシュを保存
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 古いキャッシュを綺麗にお掃除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 常に最新版をチェックする仕組み（Network First）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 通信できたら最新版を返しつつ、キャッシュも最新に更新
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
      .catch(() => {
        // オフラインの時や通信エラーの時はキャッシュを返す
        return caches.match(event.request);
      })
  );
});
