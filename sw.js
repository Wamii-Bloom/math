/* =========================================
   けいさんカード Service Worker (sw.js)
   バージョン: v1.0.0
   ========================================= */

const CACHE_NAME = 'keisan-card-v1';

// オフライン時に必須となるローカルリソース
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.PNG'
];

// 1. インストール処理（必須ファイルをプリキャッシュ）
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // 新しいService Workerを即座に有効化
      return self.skipWaiting();
    })
  );
});

// 2. アクティベート処理（古いキャッシュの削除）
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // すべてのクライアント（タブ）をすぐにコントロール化
      return self.clients.claim();
    })
  );
});

// 3. リクエスト制御（Network First 戦略）
self.addEventListener('fetch', (event) => {
  // GETリクエストのみ対象
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // 正常に取得できた場合、キャッシュを更新してレスポンスを返す
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // ネットワークエラー（オフラインなど）時はキャッシュから返す
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // トップページへのアクセスであれば index.html をフォールバックとして返す
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
