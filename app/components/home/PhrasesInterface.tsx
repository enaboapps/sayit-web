import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import BoardSelector from '../phrases/BoardSelector';
import SwipeableBoardNavigator from '../phrases/SwipeableBoardNavigator';
import BoardGridPopup from '../phrases/BoardGridPopup';
import TypingArea from '../TypingArea';
import TypingDock from '../TypingDock';
import { useTTS } from '@/lib/hooks/useTTS';
import { useState, useEffect, useMemo } from 'react';
import { MobileDockPortal } from '@/app/contexts/MobileBottomContext';
import PhraseTile from '../phrases/PhraseTile';
import ActionTile from '../phrases/ActionTile';
import type { BoardSummary, PhraseSummary } from '../phrases/types';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import AnimatedLoading from '../phrases/AnimatedLoading';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import ReplySuggestions from '../typing/ReplySuggestions';

export default function PhrasesInterface() {
  const router = useRouter();
  const tts = useTTS();
  const { user, loading: authLoading } = useAuth();
  const { settings, uiPreferences, updateUIPreference } = useSettings();
  const [typingText, setTypingText] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isBoardPickerOpen, setIsBoardPickerOpen] = useState(false);
  const selectedBoardId = uiPreferences.selectedBoardId;
  const activeTabId = uiPreferences.activeTypingTabId;
  const isMobile = useIsMobile();

  const shouldLoadBoards = !authLoading && !!user;
  const showAuthPrompt = !authLoading && !user;

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
  const addPhrase = useMutation(api.phrases.addPhrase);
  const addPhraseToBoard = useMutation(api.phraseBoards.addPhraseToBoard);
  const recordMessage = useMutation(api.conversationHistory.recordMessage);
  const recentMessages = useQuery(
    api.conversationHistory.getRecentMessages,
    shouldLoadBoards ? { limit: 20 } : 'skip'
  );

  const loading = authLoading || (shouldLoadBoards && boards === undefined);

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

  const handlePhrasePress = (phrase: PhraseSummary) => {
    setTypingText(phrase.text);
    tts.speak(phrase.text);
  };

  const handleEdit = () => {
    setIsEditMode(!isEditMode);
  };

  const handleAddPhrase = async () => {
    if (!selectedBoardId) {
      console.error('Cannot add phrase: no board selected');
      return;
    }
    router.push(`/phrases/add?boardId=${selectedBoardId}`);
  };

  const handleAddTypingAsPhrase = async () => {
    if (!selectedBoardId || !typingText.trim()) {
      console.error('Cannot add phrase: no board selected or empty text');
      return;
    }

    try {
      // Get the current number of phrases to set position
      const currentPhrases = selectedBoardData?.phrase_board_phrases || [];
      const position = currentPhrases.length;

      // Create the phrase
      const phraseId = await addPhrase({
        text: typingText,
        frequency: 0,
        position,
      });

      // Add it to the board
      await addPhraseToBoard({
        phraseId: phraseId as Id<'phrases'>,
        boardId: selectedBoardId as Id<'phraseBoards'>,
      });

      setTypingText(''); // Clear the typing area after adding
    } catch (error) {
      console.error('Error adding phrase:', error);
    }
  };

  const handleEditPhrase = (phrase: PhraseSummary) => {
    if (!selectedBoardId) return;
    router.push(`/phrases/edit/${phrase.id}?boardId=${selectedBoardId}`);
  };

  const handleAddBoard = () => {
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
        frequency: phrase.frequency,
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
    );

    if (!shouldCapture) {
      return;
    }

    try {
      await recordMessage({
        text: trimmedText,
        captureSource: source,
        tabId: tabId ?? undefined,
      });
    } catch (error) {
      console.error('Failed to record conversation history:', error);
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
    const allMessages = recentMessages ?? [];
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
  }, [activeTabId, recentMessages]);

  return (
    <>
      {/* Desktop: TypingArea at top */}
      {!isMobile && (
        <div className="flex-none">
          <TypingArea
            initialText={typingText}
            text={typingText}
            tts={tts}
            onChange={(text) => setTypingText(text)}
            onMessageCompleted={(payload) => {
              void handleCaptureCompletedMessage(payload);
            }}
          />
          <div className="px-2 pb-2">
            <ReplySuggestions
              history={suggestionContext.history}
              enabled={settings.aiReplySuggestionsEnabled}
              onSelectSuggestion={handleInsertSuggestion}
              contextLabel={suggestionContext.label}
            />
          </div>
        </div>
      )}
      {showAuthPrompt ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-medium text-foreground mb-4">Sign in to view boards</h2>
            <p className="text-text-secondary mb-6">Your saved boards appear after logging in.</p>
          </div>
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
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Mobile: Swipeable Board Navigator */}
          {isMobile ? (
            <SwipeableBoardNavigator
              boards={transformedBoards}
              currentBoardIndex={validBoardIndex}
              onBoardChange={handleBoardIndexChange}
              onOpenBoardPicker={() => setIsBoardPickerOpen(true)}
              onAddBoard={handleAddBoard}
              onAddPhrase={handleAddPhrase}
              onEdit={handleEdit}
              isEditMode={isEditMode}
              canEditBoard={canEditCurrentBoard}
            >
              <div className="p-2 pb-32 overflow-auto">
                <div className="grid grid-cols-2 gap-2">
                  {phrases.map((phrase) => (
                    <PhraseTile
                      key={phrase.id}
                      phrase={phrase}
                      onPress={() => handlePhrasePress(phrase)}
                      onEdit={isEditMode && canEditCurrentBoard ? () => handleEditPhrase(phrase) : undefined}
                      onLongPress={canEditCurrentBoard ? () => handleEditPhrase(phrase) : undefined}
                      className="aspect-square"
                    />
                  ))}
                  {typingText.trim() && canEditCurrentBoard && !phrases.some(p => p.text === typingText.trim()) && (
                    <ActionTile
                      text="+ Add as Phrase"
                      onClick={handleAddTypingAsPhrase}
                      className="aspect-square"
                    />
                  )}
                  {isEditMode && canEditCurrentBoard && (
                    <ActionTile
                      text="+ Add Phrase"
                      onClick={handleAddPhrase}
                      className="aspect-square"
                    />
                  )}
                </div>
              </div>
            </SwipeableBoardNavigator>
          ) : (
            /* Desktop: Traditional Board Selector */
            <>
              <div className="flex-none">
                <BoardSelector
                  boards={transformedBoards}
                  selectedBoard={selectedBoard}
                  isEditMode={isEditMode}
                  onSelectBoard={handleSelectBoard}
                  onEditBoard={(boardId) => router.push(`/phrases/boards/edit/${boardId}`)}
                  onAddBoard={handleAddBoard}
                  onAddPhrase={handleAddPhrase}
                  onEdit={handleEdit}
                />
              </div>

              <div className="flex-1 p-1 overflow-auto">
                {!loading && (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 p-1 overflow-auto">
                      <div className="grid grid-cols-2 gap-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {phrases.map((phrase) => (
                          <PhraseTile
                            key={phrase.id}
                            phrase={phrase}
                            onPress={() => handlePhrasePress(phrase)}
                            onEdit={isEditMode && canEditCurrentBoard ? () => handleEditPhrase(phrase) : undefined}
                            onLongPress={canEditCurrentBoard ? () => handleEditPhrase(phrase) : undefined}
                            className="aspect-square"
                          />
                        ))}
                        {typingText.trim() && canEditCurrentBoard && !phrases.some(p => p.text === typingText.trim()) && (
                          <ActionTile
                            text="+ Add as Phrase"
                            onClick={handleAddTypingAsPhrase}
                            className="aspect-square"
                          />
                        )}
                        {isEditMode && canEditCurrentBoard && (
                          <ActionTile
                            text="+ Add Phrase"
                            onClick={handleAddPhrase}
                            className="aspect-square"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
      {/* Mobile: Board picker popup */}
      <BoardGridPopup
        boards={transformedBoards}
        selectedBoard={selectedBoard}
        isEditMode={isEditMode}
        isOpen={isBoardPickerOpen}
        onClose={() => setIsBoardPickerOpen(false)}
        onSelectBoard={handleSelectBoard}
        onEditBoard={(boardId) => router.push(`/phrases/boards/edit/${boardId}`)}
      />
      {/* Mobile: TypingDock portaled into bottom stack */}
      {isMobile && (
          <MobileDockPortal>
            <TypingDock
              text={typingText}
              onChange={setTypingText}
              onSpeak={handleSpeakFromDock}
              onMessageCompleted={(payload) => {
                void handleCaptureCompletedMessage(payload);
              }}
              onStop={tts.stop}
              isSpeaking={tts.isSpeaking}
              isAvailable={tts.isAvailable}
              enableTabs={true}
              enableLiveTyping={!!user}
              enableFixText={true}
            />
            <div className="px-3 pb-3">
              <ReplySuggestions
                history={suggestionContext.history}
                enabled={settings.aiReplySuggestionsEnabled}
                onSelectSuggestion={handleInsertSuggestion}
                contextLabel={suggestionContext.label}
              />
            </div>
          </MobileDockPortal>
      )}
    </>
  );
}
