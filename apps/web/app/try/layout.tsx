import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Try without signing in · SayIt!',
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#1a1917',
};

export default function TryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
