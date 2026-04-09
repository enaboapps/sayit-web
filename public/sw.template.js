const CACHE_NAME = 'sayit-shell-v__SW_CACHE_VERSION__';
const OFFLINE_URL = '/offline';
const APP_SHELL = [
  '/',
  OFFLINE_URL,
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

function getNavigationCacheKey(request) {
  const url = new URL(request.url);
  return url.pathname === '/' ? '/' : request;
}

function isStaticAsset(request, url) {
  return (
    url.pathname.startsWith('/_next/static/')
    || url.pathname.startsWith('/icons/')
    || url.pathname === '/manifest.json'
    || url.pathname === '/favicon.ico'
    || request.destination === 'style'
    || request.destination === 'script'
    || request.destination === 'font'
    || request.destination === 'image'
  );
}

function isSameOriginJson(request, url) {
  return (
    url.origin === self.location.origin
    && (
      url.pathname.endsWith('.json')
      || request.headers.get('accept')?.includes('application/json')
    )
  );
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }

  return response;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        void cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cachedResponse) {
    void networkPromise;
    return cachedResponse;
  }

  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }

  throw new Error('No cached JSON response available');
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  const cacheKey = getNavigationCacheKey(request);

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(cacheKey, response.clone());
    }
    return response;
  } catch {
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    const cachedHome = await cache.match('/');
    if (cachedHome) {
      return cachedHome;
    }

    return cache.match(OFFLINE_URL);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (isStaticAsset(request, requestUrl)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isSameOriginJson(request, requestUrl)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
