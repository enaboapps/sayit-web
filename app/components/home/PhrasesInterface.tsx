import { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Composer from '../composer';
import AACTabs from './AACTabs';
import PhrasesTabContent from './PhrasesTabContent';
import BoardGridPopup from '../phrases/BoardGridPopup';
import ConnectionRequestsBanner from '../connection/ConnectionRequestsBanner';
import { useTTS } from '@/lib/hooks/useTTS';
import { usePhraseBoardData } from '@/lib/hooks/usePhraseBoardData';
import { useMessageCapture } from '@/lib/hooks/useMessageCapture';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import type { PhraseSummary } from '../phrases/types';

export default function PhrasesInterface() {
  const tts = useTTS();
  const { user } = useAuth();
  const { settings, uiPreferences } = useSettings();
  const { isOnline } = useOnlineStatus();
  const isMobile = useIsMobile();

  const boardData = usePhraseBoardData();
  const { captureError, handleCaptureCompletedMessage, localRecentMessages } = useMessageCapture();

  const [typingText, setTypingText] = useState('');
  const [activePhraseId, setActivePhraseId] = useState<string | null>(null);

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

  const handlePhrasePress = (phrase: PhraseSummary) => {
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
              boards={boardData.boards}
              phrases={boardData.phrases}
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
              onPhrasePress={handlePhrasePress}
              onPhraseStop={handlePhraseStop}
              onEditPhrase={boardData.handleEditPhrase}
              onAddPhrase={isOnline && boardData.canEditCurrentBoard ? boardData.handleAddPhrase : undefined}
              onAddBoard={boardData.handleAddBoard}
              onReorderPhrases={boardData.handleReorderPhrases}
              onBoardIndexChange={boardData.handleBoardIndexChange}
              onToggleEditMode={boardData.handleToggleEditMode}
              onSelectBoard={boardData.handleSelectBoard}
              onOpenBoardPicker={() => boardData.setIsBoardPickerOpen(true)}
              onEditBoard={boardData.handleEditBoard}
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
        boards={boardData.boards}
        selectedBoard={boardData.selectedBoard}
        isEditMode={boardData.isEditMode}
        isOpen={boardData.isBoardPickerOpen}
        onClose={() => boardData.setIsBoardPickerOpen(false)}
        onSelectBoard={boardData.handleSelectBoard}
        onEditBoard={boardData.handleEditBoard}
      />
    </div>
  );
}
