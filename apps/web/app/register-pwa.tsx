'use client';

import { useEffect } from 'react';

export default function RegisterPWA() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
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
