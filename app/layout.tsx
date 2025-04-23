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
