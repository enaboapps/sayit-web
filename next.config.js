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
})(nextConfig);

export default config;
