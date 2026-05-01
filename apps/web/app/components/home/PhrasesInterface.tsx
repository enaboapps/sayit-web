import { useState, useEffect, useMemo } from 'react';
import { useQuery, useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Composer from '../composer';
import AACTabs from './AACTabs';
import PhrasesTabContent from './PhrasesTabContent';
import BoardGridPopup from '../phrases/BoardGridPopup';
import OpenBoardImportModal from '../phrases/OpenBoardImportModal';
import ConnectionRequestsBanner from '../connection/ConnectionRequestsBanner';
import { useTTS } from '@/lib/hooks/useTTS';
import { usePhraseBoardData } from '@/lib/hooks/usePhraseBoardData';
import { useMessageCapture } from '@/lib/hooks/useMessageCapture';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { usePhraseBar } from '../../contexts/PhraseBarContext';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import {
  createOpenBoardBlob,
  createOpenBoardZipBlob,
  downloadBlob,
  filenameForBoard,
} from '@/lib/open-board-format/export';
import type { BoardSummary, BoardTileSummary, PhraseSummary } from '../phrases/types';

export default function PhrasesInterface() {
  const tts = useTTS();
  const { user } = useAuth();
  const { settings, uiPreferences } = useSettings();
  const { isOnline } = useOnlineStatus();
  const isMobile = useIsMobile();

  const boardData = usePhraseBoardData();
  const phraseBar = usePhraseBar();
  const { captureError, handleCaptureCompletedMessage, localRecentMessages } = useMessageCapture();

  const [typingText, setTypingText] = useState('');
  const [activePhraseId, setActivePhraseId] = useState<string | null>(null);
  const [isOpenBoardImportOpen, setIsOpenBoardImportOpen] = useState(false);

  const activeTabId = uiPreferences.activeTypingTabId;
  const {
    hasSubscription,
    loadElevenLabsVoices,
    loadGeminiVoices,
  } = tts;

  // Pre-load premium voices so they're ready before first tap
  useEffect(() => {
    if (!hasSubscription) return;

    if (settings.ttsProvider === 'elevenlabs') {
      loadElevenLabsVoices();
    }

    if (settings.ttsProvider === 'gemini') {
      loadGeminiVoices();
    }
  }, [hasSubscription, settings.ttsProvider, loadElevenLabsVoices, loadGeminiVoices]);

  // Clear active phrase highlight when TTS finishes
  useEffect(() => {
    if (!tts.isSpeaking) setActivePhraseId(null);
  }, [tts.isSpeaking]);

  const recentMessages = useQuery(
    api.conversationHistory.getRecentMessages,
    boardData.shouldLoadBoards ? { limit: 20 } : 'skip'
  );

  // Multi-board .obz export needs the raw shape (every board's tiles +
  // phrase links) that `usePhraseBoardData` reshapes away. We fetch it
  // *on demand* via `convex.query(...)` inside the click handler instead
  // of subscribing at mount — keeping a thousands-of-tiles snapshot in
  // memory for users who never click "Export All Boards" was wasteful.
  const convex = useConvex();

  const handlePhrasePress = (phrase: PhraseSummary) => {
    if (settings.usePhraseBar) {
      // Phrase-bar mode: accumulate chips. Don't clobber Composer text.
      phraseBar.addItem({ text: phrase.text, symbolUrl: phrase.symbolUrl });
      if (settings.speakPhrasesOnTap) {
        setActivePhraseId(phrase.id ?? null);
        tts.speak(phrase.text);
      }
      return;
    }
    // Legacy speak-on-tap behavior.
    setActivePhraseId(phrase.id ?? null);
    setTypingText(phrase.text);
    tts.speak(phrase.text);
  };

  const handlePhraseStop = () => {
    tts.stop();
    setActivePhraseId(null);
  };

  const handleSpeakFromDock = (source: 'speak' | 'speakAndClear' = 'speak') => {
    if (!typingText.trim()) return;
    tts.speak(typingText);
    void handleCaptureCompletedMessage({ text: typingText, source, tabId: activeTabId });
  };

  const handleInsertSuggestion = (suggestion: string) => {
    setTypingText((current) => {
      const trimmed = current.trim();
      if (!trimmed) return suggestion;
      const sep = current.endsWith(' ') || current.endsWith('\n') ? '' : ' ';
      return `${current}${sep}${suggestion}`;
    });
  };

  const handleOpenBoardImported = (boardIds: string[]) => {
    if (boardIds[0]) {
      boardData.handleSelectBoard(boardIds[0]);
    }
  };

  const handleExportOpenBoard = () => {
    if (!boardData.selectedBoard) return;
    const blob = createOpenBoardBlob({
      ...boardData.selectedBoard,
      tiles: boardData.tiles,
    });
    downloadBlob(blob, filenameForBoard(boardData.selectedBoard.name, 'obf'));
  };

  const handleExportAllOpenBoards = async () => {
    // Fire the query at click time (not via useQuery at module mount) so we
    // don't pay for a permanent subscription to every board's tiles for
    // users who never export. One-shot read against the same handler that
    // `usePhraseBoardData` subscribes to — Convex caches what it can.
    const allBoardsWithTiles = await convex.query(api.phraseBoards.getPhraseBoards, {});
    if (!allBoardsWithTiles?.length) return;
    // Map each Convex result row to the BoardSummary shape `createOpenBoardZipBlob`
    // consumes. Phrases come in via `phrase_board_phrases` (legacy free-mode) and
    // `tiles` (fixed-grid + polymorphic). Both are populated server-side. The
    // Convex result shape is narrower than BoardSummary, so we cast to a duck
    // type rather than restate every field — matches the pattern in
    // `usePhraseBoardData` and `lib/offline/storage.ts`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const summaries: BoardSummary[] = (allBoardsWithTiles as any[]).map((board) => ({
      id: String(board._id),
      name: board.name,
      position: board.position,
      phrases: ((board.phrase_board_phrases ?? []) as Array<{ phrase?: { _id?: string; text?: string; symbolUrl?: string } | null }>)
        .map((link) => link.phrase)
        .filter((phrase): phrase is { _id?: string; text: string; symbolUrl?: string } => Boolean(phrase?.text))
        .map((phrase) => ({
          id: String(phrase._id ?? phrase.text),
          text: phrase.text,
          symbolUrl: phrase.symbolUrl,
        } as PhraseSummary)),
      tiles: (board.tiles ?? undefined) as BoardTileSummary[] | undefined,
      isShared: board.isShared,
      isOwner: board.isOwner,
      accessLevel: board.accessLevel,
      sharedBy: board.sharedBy,
      forClientId: board.forClientId,
      forClientName: board.forClientName,
      layoutMode: board.layoutMode ?? 'free',
      layoutPreset: board.layoutPreset,
      gridRows: board.gridRows,
      gridColumns: board.gridColumns,
      layoutVersion: board.layoutVersion,
      sourceTemplate: board.sourceTemplate,
    }));
    const blob = await createOpenBoardZipBlob(summaries);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `sayit-boards-${stamp}.obz`);
  };

  const suggestionContext = useMemo(() => {
    const fallbackLocal = localRecentMessages.map(e => ({ text: e.text, tabId: e.tabId ?? undefined }));
    const allMessages = recentMessages && recentMessages.length > 0 ? recentMessages : fallbackLocal;
    const sameTab = activeTabId ? allMessages.filter(e => e.tabId === activeTabId) : [];

    if (sameTab.length >= 3) {
      return { history: sameTab.slice(0, 10).map(e => e.text) };
    }
    return { history: allMessages.slice(0, 10).map(e => e.text) };
  }, [activeTabId, localRecentMessages, recentMessages]);

  const enableToneControl =
    isOnline
    && settings.ttsProvider === 'elevenlabs'
    && settings.ttsModelPreference === 'high_quality'
    && tts.status.elevenLabsAvailable;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="shrink-0">
        <ConnectionRequestsBanner />
      </div>
      {captureError && (
        <div
          className="sticky top-0 z-40 shrink-0 border-b border-red-900 bg-surface px-4 py-3 text-sm text-red-300"
          role="status"
          aria-live="polite"
        >
          Couldn&apos;t save message to history. It will be retried next time.
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col">
        <AACTabs
          phrasesContent={
            <PhrasesTabContent
              boards={boardData.visibleBoards}
              tiles={boardData.tiles}
              selectedBoard={boardData.selectedBoard}
              validBoardIndex={boardData.validBoardIndex}
              loading={boardData.loading}
              showAuthPrompt={boardData.showAuthPrompt}
              showOfflineBoardsState={boardData.showOfflineBoardsState}
              isEditMode={boardData.isEditMode}
              canEditCurrentBoard={boardData.canEditCurrentBoard}
              isMobile={isMobile}
              isOnline={isOnline}
              isSpeaking={tts.isSpeaking}
              activePhraseId={activePhraseId}
              canNavigateBack={boardData.canNavigateBack}
              onPhrasePress={handlePhrasePress}
              onPhraseStop={handlePhraseStop}
              onEditPhrase={boardData.handleEditPhrase}
              onNavigateTap={(tile: Extract<BoardTileSummary, { kind: 'navigate' }>) =>
                boardData.handleNavigateToBoard(tile.targetBoardId)
              }
              onNavigateEdit={boardData.handleEditNavigateTile}
              onAudioEdit={boardData.handleEditAudioTile}
              onNavigateBack={boardData.handleNavigateBack}
              onAddPhrase={isOnline && boardData.canEditCurrentBoard ? boardData.handleAddPhrase : undefined}
              onAddNavigateTile={isOnline && boardData.canEditCurrentBoard ? boardData.handleAddNavigateTile : undefined}
              onAddAudioTile={isOnline && boardData.canEditCurrentBoard ? boardData.handleAddAudioTile : undefined}
              onAddBoard={boardData.handleAddBoard}
              onImportOpenBoard={isOnline && !!user ? () => setIsOpenBoardImportOpen(true) : undefined}
              onExportOpenBoard={boardData.selectedBoard ? handleExportOpenBoard : undefined}
              onExportAllOpenBoards={
                // Use the already-loaded full board list to gate the menu —
                // including hidden drill-downs since they belong in the .obz.
                // The actual export query fires at click time inside the handler.
                boardData.boards.length > 0 ? handleExportAllOpenBoards : undefined
              }
              onReorderTiles={boardData.handleReorderTiles}
              onMoveTileToCell={boardData.handleMoveTileToCell}
              onBoardIndexChange={boardData.handleBoardIndexChange}
              onToggleEditMode={boardData.handleToggleEditMode}
              onSelectBoard={boardData.handleSelectBoard}
              onOpenBoardPicker={() => boardData.setIsBoardPickerOpen(true)}
              onEditBoard={boardData.handleEditBoard}
              textSizePx={settings.textSize}
            />
          }
          typeContent={
            <Composer
              text={typingText}
              onChange={setTypingText}
              onSpeak={handleSpeakFromDock}
              onSpeakWithTone={(taggedText: string, options?: { modelId?: string }) => {
                tts.speak(taggedText, options);
                void handleCaptureCompletedMessage({ text: typingText, source: 'speak', tabId: activeTabId });
              }}
              onMessageCompleted={(payload: { text: string; source: 'clear'; tabId?: string | null }) => void handleCaptureCompletedMessage(payload)}
              onStop={tts.stop}
              isSpeaking={tts.isSpeaking}
              isAvailable={tts.isAvailable}
              enableTabs={true}
              enableLiveTyping={!!user}
              enableFixText={true}
              enableToneControl={enableToneControl}
              onAddAsPhrase={isOnline && !!user && boardData.canEditCurrentBoard ? boardData.handleAddAsPhrase : undefined}
              replySuggestions={{
                history: suggestionContext.history,
                enabled: settings.aiReplySuggestionsEnabled,
                onSelect: handleInsertSuggestion,
              }}
            />
          }
        />
      </div>
      <BoardGridPopup
        boards={boardData.visibleBoards}
        selectedBoard={boardData.selectedBoard}
        isEditMode={boardData.isEditMode}
        isOpen={boardData.isBoardPickerOpen}
        onClose={() => boardData.setIsBoardPickerOpen(false)}
        onSelectBoard={boardData.handleSelectBoard}
        onEditBoard={boardData.handleEditBoard}
      />
      <OpenBoardImportModal
        isOpen={isOpenBoardImportOpen}
        onClose={() => setIsOpenBoardImportOpen(false)}
        onImported={handleOpenBoardImported}
      />
    </div>
  );
}
