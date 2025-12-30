import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import PhrasesActionMenu from '../phrases/PhrasesActionMenu';
import ReaderPopup from '../phrases/ReaderPopup';
import BoardSelector from '../phrases/BoardSelector';
import TypingArea from '../TypingArea';
import { useTTS } from '@/lib/hooks/useTTS';
import { useState, useEffect } from 'react';
import PhraseTile from '../phrases/PhraseTile';
import ActionTile from '../phrases/ActionTile';
import type { BoardSummary, PhraseSummary } from '../phrases/types';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import AnimatedLoading from '../phrases/AnimatedLoading';

export default function PhrasesInterface() {
  const router = useRouter();
  const tts = useTTS();
  const { user, loading: authLoading } = useAuth();
  const { uiPreferences, updateUIPreference } = useSettings();
  const [typingText, setTypingText] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const selectedBoardId = uiPreferences.selectedBoardId;

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

  const handleReader = () => {
    setIsReaderOpen(true);
  };

  const handleCloseReader = () => {
    setIsReaderOpen(false);
  };

  const handleSpeakInReader = (text: string) => {
    tts.speak(text);
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

  // Check if current board allows editing
  const canEditCurrentBoard = !selectedBoard?.isShared || selectedBoard?.accessLevel === 'edit';

  return (
    <>
      <div className="flex-none">
        <TypingArea
          initialText={typingText}
          text={typingText}
          tts={tts}
          onChange={(text) => setTypingText(text)}
        />
      </div>
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
          <div className="flex-none">
            <BoardSelector
              boards={transformedBoards}
              selectedBoard={selectedBoard}
              isEditMode={isEditMode}
              onSelectBoard={handleSelectBoard}
              onEditBoard={(boardId) => router.push(`/phrases/boards/edit/${boardId}`)}
            />
          </div>

          <div className="flex-1 p-1 overflow-auto">
            {!loading && (
              <div className="flex flex-col h-full">
                <div className="flex-1 p-1 overflow-auto">
                  <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-1 h-full">
                    {phrases.map((phrase) => (
                      <PhraseTile
                        key={phrase.id}
                        phrase={phrase}
                        onPress={() => handlePhrasePress(phrase)}
                        onEdit={isEditMode && canEditCurrentBoard ? () => handleEditPhrase(phrase) : undefined}
                        className="sm:aspect-square"
                      />
                    ))}
                    {typingText.trim() && canEditCurrentBoard && (
                      <ActionTile
                        text="+ Add as Phrase"
                        onClick={handleAddTypingAsPhrase}
                        className="sm:aspect-square"
                      />
                    )}
                    {isEditMode && canEditCurrentBoard && (
                      <ActionTile
                        text="+ Add Phrase"
                        onClick={handleAddPhrase}
                        className="sm:aspect-square"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <PhrasesActionMenu
        onAddPhrase={handleAddPhrase}
        onAddBoard={handleAddBoard}
        onEdit={handleEdit}
        onReader={handleReader}
        boardPresent={transformedBoards.length > 0}
        isEditMode={isEditMode}
        canEditBoard={canEditCurrentBoard}
      />
      <ReaderPopup
        phrases={phrases}
        isOpen={isReaderOpen}
        onClose={handleCloseReader}
        onSpeak={handleSpeakInReader}
      />
    </>
  );
}
