import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import BoardSelector from '../phrases/BoardSelector';
import SwipeableBoardNavigator from '../phrases/SwipeableBoardNavigator';
import BoardGridPopup from '../phrases/BoardGridPopup';
import Composer from '../Composer';
import AACTabs from './AACTabs';
import { useTTS } from '@/lib/hooks/useTTS';
import { useState, useEffect, useMemo, useRef } from 'react';
import PhraseTile from '../phrases/PhraseTile';
import SortablePhraseGrid from '../phrases/SortablePhraseGrid';
import type { BoardSummary, PhraseSummary } from '../phrases/types';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import AnimatedLoading from '../phrases/AnimatedLoading';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { useLocalMessageHistory } from '@/lib/hooks/useLocalMessageHistory';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import ConnectionRequestsBanner from '../connection/ConnectionRequestsBanner';

export default function PhrasesInterface() {
  const router = useRouter();
  const tts = useTTS();
  const { user, loading: authLoading } = useAuth();
  const { settings, uiPreferences, updateUIPreference } = useSettings();
  const { isOnline } = useOnlineStatus();
  const [typingText, setTypingText] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [activePhraseId, setActivePhraseId] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState(false);
  const captureErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isBoardPickerOpen, setIsBoardPickerOpen] = useState(false);
  const { messages: localRecentMessages, recordMessage: recordLocalMessage } = useLocalMessageHistory();
  const selectedBoardId = uiPreferences.selectedBoardId;
  const activeTabId = uiPreferences.activeTypingTabId;
  const isMobile = useIsMobile();

  const shouldLoadBoards = !authLoading && !!user;
  const showAuthPrompt = !authLoading && !user;

  // Pre-load ElevenLabs voices on mount so isAvailableFlag is true before first tap
  const { hasSubscription, loadElevenLabsVoices } = tts;
  useEffect(() => {
    if (hasSubscription && settings.ttsProvider === 'elevenlabs') {
      loadElevenLabsVoices();
    }
  }, [hasSubscription, settings.ttsProvider, loadElevenLabsVoices]);

  // Fetch all boards from Convex
  const boards = useQuery(
    api.phraseBoards.getPhraseBoards,
    shouldLoadBoards ? undefined : 'skip'
  );

  // Fetch the selected board with its phrases
  const selectedBoardData = useQuery(
    api.phraseBoards.getPhraseBoard,
    shouldLoadBoards && selectedBoardId ? { id: selectedBoardId as Id<'phraseBoards'> } : 'skip'
  );

  // Mutations
  const recordMessage = useMutation(api.conversationHistory.recordMessage);
  const reorderPhrasesOnBoard = useMutation(api.phraseBoards.reorderPhrasesOnBoard);
  const recentMessages = useQuery(
    api.conversationHistory.getRecentMessages,
    shouldLoadBoards ? { limit: 20 } : 'skip'
  );

  const loading = authLoading || (shouldLoadBoards && boards === undefined);
  const showOfflineBoardsState = !isOnline && shouldLoadBoards && boards === undefined;

  // Auto-dismiss capture error after 4 s
  useEffect(() => {
    if (!captureError) return;
    if (captureErrorTimerRef.current) clearTimeout(captureErrorTimerRef.current);
    captureErrorTimerRef.current = setTimeout(() => setCaptureError(false), 4000);
    return () => {
      if (captureErrorTimerRef.current) clearTimeout(captureErrorTimerRef.current);
    };
  }, [captureError]);

  // Auto-select first board on load or use saved board
  useEffect(() => {
    if (!shouldLoadBoards) {
      if (selectedBoardId !== null) {
        updateUIPreference('selectedBoardId', null);
      }
      return;
    }

    if (!boards || boards.length === 0) {
      if (selectedBoardId !== null) {
        updateUIPreference('selectedBoardId', null);
      }
      return;
    }

    if (selectedBoardId && boards.some(board => board._id === selectedBoardId)) {
      // Current board selection is valid
      return;
    }

    // No saved board or it doesn't exist, select first board
    updateUIPreference('selectedBoardId', boards[0]._id);
  }, [boards, shouldLoadBoards, selectedBoardId, updateUIPreference]);

  // Clear active phrase when TTS finishes naturally
  useEffect(() => {
    if (!tts.isSpeaking) {
      setActivePhraseId(null);
    }
  }, [tts.isSpeaking]);

  const handlePhrasePress = (phrase: PhraseSummary) => {
    setActivePhraseId(phrase.id ?? null);
    setTypingText(phrase.text);
    tts.speak(phrase.text);
  };

  const handlePhraseStop = () => {
    tts.stop();
    setActivePhraseId(null);
  };

  const handleEdit = () => {
    setIsEditMode(!isEditMode);
  };

  const handleAddPhrase = async () => {
    if (!isOnline) {
      return;
    }

    if (!selectedBoardId) {
      console.error('Cannot add phrase: no board selected');
      return;
    }
    router.push(`/phrases/add?boardId=${selectedBoardId}`);
  };

  const handleReorderPhrases = (orderedIds: string[]) => {
    if (!selectedBoardId) return;
    void reorderPhrasesOnBoard({
      boardId: selectedBoardId as Id<'phraseBoards'>,
      orderedPhraseIds: orderedIds as Id<'phrases'>[],
    });
  };

  const handleAddAsPhrase = (text: string) => {
    if (!isOnline || !selectedBoardId || !canEditCurrentBoard) return;
    router.push(`/phrases/add?boardId=${selectedBoardId}&text=${encodeURIComponent(text)}`);
  };

  const handleEditPhrase = (phrase: PhraseSummary) => {
    if (!isOnline) return;
    if (!selectedBoardId) return;
    router.push(`/phrases/edit/${phrase.id}?boardId=${selectedBoardId}`);
  };

  const handleAddBoard = () => {
    if (!isOnline) return;
    router.push('/phrases/boards/add');
  };

  const handleSelectBoard = (board: BoardSummary | string) => {
    const boardId = typeof board === 'string' ? board : board.id;
    updateUIPreference('selectedBoardId', boardId);
  };

  // Extract phrases from the board data
  const phrases: PhraseSummary[] =
    selectedBoardData?.phrase_board_phrases
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.map((pbp: any) => pbp.phrase)
      .filter(Boolean)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((phrase: any) => ({
        id: String(phrase._id),
        text: phrase.text,
      })) || [];

  // Transform boards to match the expected format (PhraseBoard type)
  const transformedBoards: BoardSummary[] =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    boards?.map((board: any) => ({
      id: String(board._id),
      name: board.name,
      position: board.position,
      phrases: board._id === selectedBoardId ? phrases : [],
      isShared: board.isShared,
      isOwner: board.isOwner,
      accessLevel: board.accessLevel,
      sharedBy: board.sharedBy,
      forClientId: board.forClientId,
      forClientName: board.forClientName,
    })) || [];

  const selectedBoard = transformedBoards.find(board => board.id === selectedBoardId) || null;

  // Get current board index for swipeable navigator
  const currentBoardIndex = transformedBoards.findIndex(board => board.id === selectedBoardId);
  const validBoardIndex = currentBoardIndex >= 0 ? currentBoardIndex : 0;

  // Handle board index change for swipeable navigation
  const handleBoardIndexChange = (index: number) => {
    if (transformedBoards[index]) {
      updateUIPreference('selectedBoardId', transformedBoards[index].id);
    }
  };

  // Check if current board allows editing
  const canEditCurrentBoard = !selectedBoard?.isShared || selectedBoard?.accessLevel === 'edit';

  const handleCaptureCompletedMessage = async ({
    text,
    source,
    tabId,
  }: {
    text: string;
    source: 'speak' | 'speakAndClear' | 'clear';
    tabId?: string | null;
  }) => {
    const trimmedText = text.trim();
    if (!user || !trimmedText) {
      return;
    }

    const captureMode = settings.messageCaptureMode;
    const shouldCapture = (
      (captureMode === 'clearOnly' && source === 'clear')
      || (captureMode === 'speakOnly' && source === 'speak')
      || (captureMode === 'speakAndClearOnly' && source === 'speakAndClear')
      || (captureMode === 'speakAny' && (source === 'speak' || source === 'speakAndClear'))
    );

    if (!shouldCapture) {
      return;
    }

    recordLocalMessage({
      text: trimmedText,
      source,
      tabId,
    });

    try {
      await recordMessage({
        text: trimmedText,
        captureSource: source,
        tabId: tabId ?? undefined,
      });
      setCaptureError(false);
    } catch (error) {
      console.error('Failed to record conversation history:', error);
      setCaptureError(true);
    }
  };

  const handleSpeakFromDock = (source: 'speak' | 'speakAndClear' = 'speak') => {
    if (!typingText.trim()) {
      return;
    }

    tts.speak(typingText);
    void handleCaptureCompletedMessage({
      text: typingText,
      source,
      tabId: activeTabId,
    });
  };

  const handleInsertSuggestion = (suggestion: string) => {
    setTypingText((current) => {
      const trimmedCurrent = current.trim();
      if (!trimmedCurrent) {
        return suggestion;
      }

      const separator = current.endsWith(' ') || current.endsWith('\n') ? '' : ' ';
      return `${current}${separator}${suggestion}`;
    });
  };

  const suggestionContext = useMemo(() => {
    const fallbackLocalMessages = localRecentMessages.map((entry) => ({
      text: entry.text,
      tabId: entry.tabId ?? undefined,
    }));
    const allMessages = recentMessages && recentMessages.length > 0
      ? recentMessages
      : fallbackLocalMessages;
    const sameTabMessages = activeTabId
      ? allMessages.filter((entry) => entry.tabId === activeTabId)
      : [];

    if (sameTabMessages.length >= 3) {
      return {
        history: sameTabMessages.slice(0, 10).map((entry) => entry.text),
        label: 'Based on recent completed messages in this tab',
      };
    }

    return {
      history: allMessages.slice(0, 10).map((entry) => entry.text),
      label: activeTabId
        ? 'Using recent completed messages across tabs until this tab has more history'
        : 'Based on your recent completed messages',
    };
  }, [activeTabId, localRecentMessages, recentMessages]);

  const enableToneControl = isOnline
    && settings.ttsProvider === 'elevenlabs'
    && settings.ttsModelPreference === 'high_quality';

  const composer = (
    <Composer
      text={typingText}
      onChange={setTypingText}
      onSpeak={handleSpeakFromDock}
      onSpeakWithTone={(taggedText, options) => {
        tts.speak(taggedText, options);
        void handleCaptureCompletedMessage({
          text: typingText,
          source: 'speak',
          tabId: activeTabId,
        });
      }}
      onMessageCompleted={(payload) => {
        void handleCaptureCompletedMessage(payload);
      }}
      onStop={tts.stop}
      isSpeaking={tts.isSpeaking}
      isAvailable={tts.isAvailable}
      enableTabs={true}
      enableLiveTyping={!!user}
      enableFixText={true}
      enableToneControl={enableToneControl}
      onAddAsPhrase={isOnline && !!user && canEditCurrentBoard ? handleAddAsPhrase : undefined}
      replySuggestions={{
        history: suggestionContext.history,
        enabled: settings.aiReplySuggestionsEnabled,
        onSelect: handleInsertSuggestion,
      }}
    />
  );

  const phraseGrid = isEditMode && canEditCurrentBoard ? (
    <SortablePhraseGrid
      phrases={phrases}
      activePhraseId={activePhraseId}
      isSpeaking={tts.isSpeaking}
      onPhrasePress={handlePhrasePress}
      onPhraseStop={handlePhraseStop}
      onPhraseEdit={handleEditPhrase}
      onReorder={handleReorderPhrases}
    />
  ) : (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
      {phrases.map((phrase) => (
        <PhraseTile
          key={phrase.id}
          phrase={phrase}
          onPress={() => handlePhrasePress(phrase)}
          onStop={handlePhraseStop}
          isSpeaking={activePhraseId === phrase.id && tts.isSpeaking}
          onLongPress={canEditCurrentBoard ? () => handleEditPhrase(phrase) : undefined}
        />
      ))}
    </div>
  );

  // Phrases tab content
  const phrasesContent = showAuthPrompt ? (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-medium text-foreground mb-4">Sign in to view boards</h2>
        <p className="text-text-secondary mb-6">Your saved boards appear after logging in.</p>
      </div>
    </div>
  ) : showOfflineBoardsState ? (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-text-secondary">Boards are unavailable offline.</p>
    </div>
  ) : loading ? (
    <div className="flex-1 flex items-center justify-center">
      <AnimatedLoading />
    </div>
  ) : transformedBoards.length === 0 ? (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-medium text-foreground mb-4">No boards yet</h2>
        <p className="text-text-secondary mb-6">Create your first board to start adding phrases</p>
        {isOnline && (
          <button
            onClick={handleAddBoard}
            className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-colors"
          >
            Create board
          </button>
        )}
      </div>
    </div>
  ) : isMobile ? (
    <div className="flex-1 flex flex-col">
      <SwipeableBoardNavigator
        boards={transformedBoards}
        currentBoardIndex={validBoardIndex}
        onBoardChange={handleBoardIndexChange}
        onOpenBoardPicker={() => setIsBoardPickerOpen(true)}
        onAddPhrase={isOnline && canEditCurrentBoard ? handleAddPhrase : undefined}
        onAddBoard={isOnline ? handleAddBoard : undefined}
        onEdit={handleEdit}
        onEditBoard={isOnline && selectedBoard && canEditCurrentBoard ? () => router.push(`/phrases/boards/edit/${selectedBoard.id}`) : undefined}
        isEditMode={isEditMode}
        canEditBoard={canEditCurrentBoard}
      >
        <div className="p-2 overflow-auto flex-1">
          {phraseGrid}
        </div>
      </SwipeableBoardNavigator>
    </div>
  ) : (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="shrink-0">
        <BoardSelector
          boards={transformedBoards}
          selectedBoard={selectedBoard}
          isEditMode={isEditMode}
          onSelectBoard={handleSelectBoard}
          onEditBoard={(boardId) => {
            if (!isOnline) return;
            router.push(`/phrases/boards/edit/${boardId}`);
          }}
          onAddPhrase={isOnline && canEditCurrentBoard ? handleAddPhrase : undefined}
          onAddBoard={isOnline ? handleAddBoard : undefined}
          onEdit={handleEdit}
          embedded={true}
        />
      </div>
      <div className="flex-1 overflow-auto p-3">
        {phraseGrid}
      </div>
    </div>
  );

  return (
    <>
      <ConnectionRequestsBanner />
      {captureError && (
        <div
          className="sticky top-0 z-40 border-b border-red-900 bg-surface px-4 py-3 text-sm text-red-300"
          role="status"
          aria-live="polite"
        >
          Couldn&apos;t save message to history. It will be retried next time.
        </div>
      )}
      <AACTabs
        phrasesContent={phrasesContent}
        typeContent={composer}
      />
      <BoardGridPopup
        boards={transformedBoards}
        selectedBoard={selectedBoard}
        isEditMode={isEditMode}
        isOpen={isBoardPickerOpen}
        onClose={() => setIsBoardPickerOpen(false)}
        onSelectBoard={handleSelectBoard}
        onEditBoard={(boardId) => {
          if (!isOnline) return;
          router.push(`/phrases/boards/edit/${boardId}`);
        }}
      />
    </>
  );
}
