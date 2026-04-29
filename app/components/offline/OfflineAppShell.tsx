'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AACTabs from '@/app/components/home/AACTabs';
import Composer from '@/app/components/composer';
import BoardSelector from '@/app/components/phrases/BoardSelector';
import PhraseGrid from '@/app/components/phrases/PhraseGrid';
import PhraseTile from '@/app/components/phrases/tiles/PhraseTile';
import { useSettings } from '@/app/contexts/SettingsContext';
import type { BoardSummary, PhraseSummary } from '@/app/components/phrases/types';
import { useLocalMessageHistory } from '@/lib/hooks/useLocalMessageHistory';
import { useOfflineTTS } from '@/lib/hooks/useOfflineTTS';
import {
  readLastCachedBoards,
  readOfflineBootstrap,
  type OfflineBootMode,
  type OfflineSyncStatus,
  updateOfflineSelectedBoard,
} from '@/lib/offline/storage';

function formatSyncStatus(syncStatus: OfflineSyncStatus): string {
  switch (syncStatus) {
  case 'syncing':
    return 'Preparing offline access';
  case 'failed':
    return 'Offline sync failed';
  case 'ready':
    return 'Available offline';
  case 'idle':
  default:
    return 'Offline text communication';
  }
}

function toBoardSummary(boards: Awaited<ReturnType<typeof readLastCachedBoards>>): BoardSummary[] {
  return boards.map((board) => ({
    id: board.id,
    name: board.name,
    position: board.position,
    phrases: board.phrases.map((phrase) => ({
      id: phrase.id,
      text: phrase.text,
    })),
    isShared: board.isShared,
    isOwner: board.isOwner,
    accessLevel: board.accessLevel,
    sharedBy: board.sharedBy,
    forClientId: board.forClientId,
    forClientName: board.forClientName,
  }));
}

export default function OfflineAppShell({
  mode,
}: {
  mode: Exclude<OfflineBootMode, 'booting' | 'online'>;
}) {
  const [text, setText] = useState('');
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(mode === 'offline-ready');
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(() => readOfflineBootstrap().selectedBoardId);
  const [activePhraseId, setActivePhraseId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<OfflineSyncStatus>(() => readOfflineBootstrap().syncStatus);
  const tts = useOfflineTTS();
  const { messages, recordMessage } = useLocalMessageHistory();
  const { settings } = useSettings();

  useEffect(() => {
    let isMounted = true;

    if (mode !== 'offline-ready') {
      setBoards([]);
      setIsLoadingBoards(false);
      setSyncStatus(readOfflineBootstrap().syncStatus);
      return;
    }

    setIsLoadingBoards(true);
    setSyncStatus(readOfflineBootstrap().syncStatus);

    void readLastCachedBoards()
      .then((cachedBoards) => {
        if (!isMounted) {
          return;
        }

        const nextBoards = toBoardSummary(cachedBoards);
        setBoards(nextBoards);
        setSelectedBoardId((current) => {
          if (current && nextBoards.some((board) => board.id === current)) {
            return current;
          }

          return nextBoards[0]?.id ?? null;
        });
      })
      .catch((error) => {
        console.error('Failed to load cached offline boards:', error);
        if (isMounted) {
          setBoards([]);
          setSyncStatus('failed');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingBoards(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [mode]);

  useEffect(() => {
    updateOfflineSelectedBoard(selectedBoardId);
  }, [selectedBoardId]);

  const selectedBoard = useMemo(
    () => boards.find((board) => board.id === selectedBoardId) ?? boards[0] ?? null,
    [boards, selectedBoardId]
  );
  const phrases: PhraseSummary[] = selectedBoard?.phrases ?? [];

  const handlePhrasePress = useCallback((phrase: PhraseSummary) => {
    setText(phrase.text);
    setActivePhraseId(phrase.id);
    tts.speak(phrase.text);
  }, [tts]);

  useEffect(() => {
    if (!tts.isSpeaking) {
      setActivePhraseId(null);
    }
  }, [tts.isSpeaking]);

  const phrasesContent = isLoadingBoards ? (
    <div className="flex h-full items-center justify-center px-6 text-center text-text-secondary">
      Loading your offline boards...
    </div>
  ) : boards.length === 0 ? (
    <div className="flex h-full items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-lg font-medium text-foreground">No boards prepared for offline use</p>
        <p className="mt-2 text-sm text-text-secondary">
          Text communication still works. Open SayIt! online to sync boards to this device for offline browsing.
        </p>
      </div>
    </div>
  ) : (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 p-3 pb-0">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
          <span className="inline-flex rounded-full bg-surface-hover px-3 py-1.5">
            {formatSyncStatus(syncStatus)}
          </span>
          <span className="inline-flex rounded-full bg-surface-hover px-3 py-1.5">
            Read-only offline
          </span>
        </div>
        <BoardSelector
          boards={boards}
          selectedBoard={selectedBoard}
          isEditMode={false}
          onSelectBoard={(board) => setSelectedBoardId(board.id)}
          onEditBoard={() => {}}
          embedded={true}
        />
      </div>
      <div className="flex-1 overflow-auto p-3 pt-4">
        <PhraseGrid textSizePx={settings.textSize}>
          {phrases.map((phrase) => (
            <PhraseTile
              key={phrase.id}
              phrase={phrase}
              onPress={() => handlePhrasePress(phrase)}
              onStop={tts.stop}
              isSpeaking={activePhraseId === phrase.id && tts.isSpeaking}
              textSizePx={settings.textSize}
            />
          ))}
        </PhraseGrid>
      </div>
    </div>
  );

  const typeContent = (
    <div className="flex h-full min-h-0 flex-col">
      <Composer
        text={text}
        onChange={setText}
        onSpeak={(source: 'speak' | 'speakAndClear' = 'speak') => {
          if (!text.trim()) {
            return;
          }

          tts.speak(text);
          recordMessage({ text, source });
          if (source === 'speakAndClear') {
            setTimeout(() => setText(''), 100);
          }
        }}
        onMessageCompleted={recordMessage}
        onStop={tts.stop}
        isSpeaking={tts.isSpeaking}
        isAvailable={tts.isAvailable}
        enableTabs={true}
        enableFixText={false}
        enableLiveTyping={false}
        enableToneControl={false}
      />
    </div>
  );

  return (
    <div className="h-dvh min-h-0 overflow-hidden bg-background">
      <section className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col px-4 py-6">
        <div className="flex min-h-0 flex-1 flex-col rounded-3xl border border-border bg-surface shadow-2xl">
          <AACTabs
            phrasesContent={phrasesContent}
            typeContent={typeContent}
          />
        </div>

        {messages.length > 0 && (
          <div className="mt-4 max-h-[30%] shrink-0 overflow-y-auto rounded-3xl border border-border bg-surface px-5 py-4 shadow-lg">
            <h2 className="text-sm font-semibold text-foreground">Recent on this device</h2>
            <p className="mt-1 text-xs text-text-secondary">
              Tap a recent message to bring it back into the typing area.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {messages.slice(0, 5).map((message) => (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => setText(message.text)}
                  className="max-w-full rounded-full bg-surface-hover px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary-950 hover:text-primary-500"
                >
                  {message.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
