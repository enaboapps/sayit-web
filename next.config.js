/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const nextConfig = {
  images: {
    domains: [
      'globalsymbols.com',
      'equjsqktsqooirullrpy.supabase.co',
    ],
  },
};

const config = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ],
  fallbacks: {
    document: '/offline',
  },
})(nextConfig);

export default config;
