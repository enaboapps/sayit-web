'use client';

import { useEffect, useRef } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSettings } from '@/app/contexts/SettingsContext';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import {
  cacheBoardsForUser,
  clearOfflineCacheForUser,
  updateOfflineSyncStatus,
  updateOfflineSelectedBoard,
} from '@/lib/offline/storage';

export default function OfflineDataSync() {
  const { user } = useAuth();
  const { uiPreferences } = useSettings();
  const { isOnline } = useOnlineStatus();
  const previousUserIdRef = useRef<string | null>(null);
  const boards = useQuery(
    api.phraseBoards.getPhraseBoards,
    user ? undefined : 'skip'
  );

  useEffect(() => {
    const previousUserId = previousUserIdRef.current;
    const nextUserId = user?.id ?? null;

    if (previousUserId && previousUserId !== nextUserId) {
      void clearOfflineCacheForUser(previousUserId);
    }

    if (!nextUserId) {
      void clearOfflineCacheForUser(previousUserId);
    }

    previousUserIdRef.current = nextUserId;
  }, [user?.id]);

  useEffect(() => {
    updateOfflineSelectedBoard(uiPreferences.selectedBoardId);
  }, [uiPreferences.selectedBoardId]);

  useEffect(() => {
    if (!user || !isOnline) {
      return;
    }

    if (boards === undefined) {
      updateOfflineSyncStatus('syncing', {
        lastKnownUserId: user.id,
      });
      return;
    }

    void cacheBoardsForUser({
      userId: user.id,
      boards,
      selectedBoardId: uiPreferences.selectedBoardId,
    }).catch((error) => {
      console.error('Failed to cache offline boards:', error);
      updateOfflineSyncStatus('failed', {
        lastKnownUserId: user.id,
      });
    });
  }, [boards, isOnline, uiPreferences.selectedBoardId, user]);

  return null;
}
