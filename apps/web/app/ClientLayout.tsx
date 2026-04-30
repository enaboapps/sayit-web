'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ClerkProvider, useAuth } from '@clerk/nextjs';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { AuthProvider, StaticAuthProvider } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { MobileBottomProvider } from './contexts/MobileBottomContext';
import { PhraseBarProvider } from './contexts/PhraseBarContext';
import { BoardNavStackProvider } from './contexts/BoardNavStackContext';
import ConnectivityBanner from './components/navigation/ConnectivityBanner';
import InstallBanner from './components/navigation/InstallBanner';
import Sidebar from './components/Sidebar';
import MobileBottomStack from './components/navigation/MobileBottomStack';
import OfflineAppShell from './components/offline/OfflineAppShell';
import OfflineDataSync from './components/offline/OfflineDataSync';
import OnlineStartupWatch from './components/startup/OnlineStartupWatch';
import {
  deriveOfflineBootMode,
  readOfflineBootstrap,
  type OfflineBootMode,
} from '@/lib/offline/storage';

const STARTUP_FALLBACK_DELAY_MS = 4000;

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const convex = useMemo(
    () => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!),
    []
  );
  const [bootMode, setBootMode] = useState<OfflineBootMode>(() => {
    if (typeof window === 'undefined') {
      return 'online';
    }

    return deriveOfflineBootMode({
      isOnline: window.navigator.onLine,
      bootstrap: readOfflineBootstrap(),
    });
  });
  const [startupReady, setStartupReady] = useState<boolean>(() => bootMode !== 'online');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pwa_last_path', pathname);
    }
  }, [pathname]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      const lastPath = localStorage.getItem('pwa_last_path');
      if (lastPath && lastPath !== pathname && lastPath !== '/') {
        router.replace(lastPath);
      }
    }
  }, [pathname, router]);

  useEffect(() => {
    if (bootMode !== 'online' || startupReady) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setBootMode(deriveOfflineBootMode({
        isOnline: false,
        bootstrap: readOfflineBootstrap(),
      }));
    }, STARTUP_FALLBACK_DELAY_MS);

    return () => window.clearTimeout(timeout);
  }, [bootMode, startupReady]);

  useEffect(() => {
    const handleOnline = () => {
      setBootMode('online');
      setStartupReady(false);
    };

    const handleOffline = () => {
      if (!startupReady) {
        setBootMode(deriveOfflineBootMode({
          isOnline: false,
          bootstrap: readOfflineBootstrap(),
        }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [startupReady]);

  const handleStartupReady = useCallback(() => {
    setStartupReady(true);
  }, []);
  if (bootMode !== 'online') {
    const offlineMode: 'offline-text-only' | 'offline-ready' = bootMode === 'offline-ready'
      ? 'offline-ready'
      : 'offline-text-only';

    return (
      <ConvexProvider client={convex}>
        <StaticAuthProvider>
          <SettingsProvider>
            <MobileBottomProvider>
              <PhraseBarProvider>
                <BoardNavStackProvider>
                  <OfflineAppShell mode={offlineMode} />
                </BoardNavStackProvider>
              </PhraseBarProvider>
            </MobileBottomProvider>
          </SettingsProvider>
        </StaticAuthProvider>
      </ConvexProvider>
    );
  }

  return (
    <ClerkProvider>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AuthProvider>
          <SettingsProvider>
            <MobileBottomProvider>
              <PhraseBarProvider>
                <BoardNavStackProvider>
                  <OnlineStartupWatch onReady={handleStartupReady}>
                    <OfflineDataSync />
                    <div className="flex h-dvh min-h-0 flex-col overflow-hidden md:h-auto md:min-h-dvh md:flex-row md:overflow-visible">
                      <Sidebar />
                      <div className="flex min-h-0 flex-1 flex-col md:pl-16 lg:pl-16">
                        <div className="shrink-0">
                          <ConnectivityBanner />
                          <InstallBanner />
                        </div>
                        <main className="min-h-0 flex-1 overflow-y-auto pb-bottom-stack md:overflow-visible">
                          {children}
                        </main>
                      </div>
                      <MobileBottomStack />
                    </div>
                  </OnlineStartupWatch>
                </BoardNavStackProvider>
              </PhraseBarProvider>
            </MobileBottomProvider>
          </SettingsProvider>
        </AuthProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
