'use client';

import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'pwaInstallBannerDismissed';

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

function isStandaloneMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function isIOSDevice() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setIsDismissed(window.localStorage.getItem(STORAGE_KEY) === 'true');
    setIsInstalled(isStandaloneMode());

    const mediaQuery = window.matchMedia('(display-mode: standalone)');

    const handleBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      window.localStorage.setItem(STORAGE_KEY, 'true');
      setIsDismissed(true);
    };

    const handleDisplayModeChange = () => {
      setIsInstalled(isStandaloneMode());
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsDismissed(true);
    setDeferredPrompt(null);
  };

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return null;
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
    } else {
      setIsDismissed(true);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, 'true');
      }
    }

    setDeferredPrompt(null);
    return choice;
  };

  const mode = useMemo(() => {
    if (isInstalled || isDismissed) {
      return 'hidden' as const;
    }

    if (deferredPrompt) {
      return 'prompt' as const;
    }

    if (isIOSDevice()) {
      return 'ios' as const;
    }

    return 'hidden' as const;
  }, [deferredPrompt, isDismissed, isInstalled]);

  return {
    mode,
    dismiss,
    promptInstall,
    isVisible: mode !== 'hidden',
  };
}
