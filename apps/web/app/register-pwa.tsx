'use client';

import { useEffect } from 'react';

const SAYIT_CACHE_PREFIX = 'sayit-shell-v';

async function clearDevelopmentPwaState() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  if ('caches' in window) {
    const cacheNames = await window.caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith(SAYIT_CACHE_PREFIX))
        .map((cacheName) => window.caches.delete(cacheName)),
    );
  }
}

export default function RegisterPWA() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      void clearDevelopmentPwaState().catch((error) => {
        console.error('Failed to clear development PWA state:', error);
      });
      return;
    }

    if (!('serviceWorker' in navigator)) {
      return;
    }

    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((error) => {
      console.error('Failed to register service worker:', error);
    });
  }, []);

  return null;
}
