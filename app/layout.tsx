import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout';
import { Metadata } from 'next';
import RegisterPWA from './register-pwa';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SayIt!',
  description: 'AAC text communication with AI-assisted tools and offline text-to-speech fallback.',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="SayIt!" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1a1a1a" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${inter.className} bg-surface text-foreground`} suppressHydrationWarning>
        <RegisterPWA />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
