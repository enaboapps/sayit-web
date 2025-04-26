'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Sidebar from './components/Sidebar';
import AnimatedBackground from './components/AnimatedBackground';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // Store the current path in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('pwa_last_path', pathname);
    }
  }, [pathname]);

  useEffect(() => {
    // Check if we're launched from PWA
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      const lastPath = localStorage.getItem('pwa_last_path');
      if (lastPath && lastPath !== pathname && lastPath !== '/') {
        window.location.href = lastPath;
      }
    }
  }, [pathname]);

  return (
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
  );
} 