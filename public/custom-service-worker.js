// Store the last visited URL
const CACHE_NAME = 'app-cache-v1';
const LAST_PATH_KEY = 'pwa_last_path';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/offline',
        '/manifest.json',
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('app-cache-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try to get the response from the network
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) {
            return preloadResponse;
          }

          const networkResponse = await fetch(event.request);
          
          // If successful, store the path
          if (networkResponse.ok) {
            const url = new URL(event.request.url);
            const path = url.pathname + url.search;
            
            // Store in IndexedDB
            const db = await openDatabase();
            await storeLastPath(db, path);
          }
          
          return networkResponse;
        } catch (error) {
          // If offline, try to get the last known path
          const db = await openDatabase();
          const lastPath = await getLastPath(db);
          
          if (lastPath) {
            return Response.redirect(lastPath);
          }
          
          // If no last path, return the offline page
          const cache = await caches.open(CACHE_NAME);
          return cache.match('/offline') || new Response('Offline');
        }
      })()
    );
  }
});

// IndexedDB setup
const DB_NAME = 'PWAState';
const STORE_NAME = 'paths';

async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

async function storeLastPath(db, path) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(path, LAST_PATH_KEY);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getLastPath(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(LAST_PATH_KEY);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
} 