'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import Sidebar from './components/Sidebar';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AuthProvider>
          <SettingsProvider>
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
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
