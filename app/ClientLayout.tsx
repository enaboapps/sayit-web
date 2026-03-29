'use client';

import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { ConvexReactClient } from 'convex/react';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { MobileBottomProvider } from './contexts/MobileBottomContext';
import ConnectivityBanner from './components/navigation/ConnectivityBanner';
import InstallBanner from './components/navigation/InstallBanner';
import Sidebar from './components/Sidebar';
import MobileBottomStack from './components/navigation/MobileBottomStack';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Initialize Convex client - memoize to avoid recreating on each render
  const convex = useMemo(
    () => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!),
    []
  );

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
            <MobileBottomProvider>
              <div className="min-h-dvh flex flex-col md:flex-row">
                {/* Sidebar - hidden on mobile, shown on tablet+ */}
                <Sidebar />

                {/* Main content area */}
                <div className="flex-1 md:pl-16 lg:pl-16">
                  <ConnectivityBanner />
                  <InstallBanner />
                  <main className="min-h-dvh pb-32 md:pb-0">
                    {children}
                  </main>
                </div>

                {/* Mobile bottom stack - dock + tab bar */}
                <MobileBottomStack />
              </div>
            </MobileBottomProvider>
          </SettingsProvider>
        </AuthProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
