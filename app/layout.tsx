'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Sidebar from './components/Sidebar';
import AnimatedBackground from './components/AnimatedBackground';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="SayIt" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="SayIt" />
        <meta name="description" content="A communication app for everyone" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <SettingsProvider>
            <AnimatedBackground />
            <div className="min-h-screen flex">
              <Sidebar />
              <div className="flex-1 pl-16">
                <main>
                  {children}
                </main>
              </div>
            </div>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
