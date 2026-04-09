'use client';

import OfflineAppShell from '@/app/components/offline/OfflineAppShell';
import { deriveOfflineBootMode, readOfflineBootstrap } from '@/lib/offline/storage';

export default function OfflinePage() {
  const bootMode = deriveOfflineBootMode({
    isOnline: false,
    bootstrap: readOfflineBootstrap(),
  });
  const mode: 'offline-text-only' | 'offline-ready' = bootMode === 'offline-ready'
    ? 'offline-ready'
    : 'offline-text-only';

  return <OfflineAppShell mode={mode} />;
}
