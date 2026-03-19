/** @type {import('next').NextConfig} */
import withSerwist from '@serwist/next';

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'globalsymbols.com',
      },
    ],
  },
  turbopack: {}, // Enable Turbopack as default in Next.js 16
};

export default withSerwist({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV !== 'production',
})(nextConfig);
