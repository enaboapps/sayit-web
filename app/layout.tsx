import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout';
import { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SayIt!',
  description: 'A communication app for everyone',
  icons: {
    icon: '/icons/app-icon.png',
    shortcut: '/icons/app-icon.png',
    apple: '/icons/app-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
