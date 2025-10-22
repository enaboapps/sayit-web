import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import PhrasesActionMenu from '../phrases/PhrasesActionMenu';
import ReaderPopup from '../phrases/ReaderPopup';
import BoardSelector from '../phrases/BoardSelector';
import TypingArea from '../TypingArea';
import { useTTS } from '@/lib/hooks/useTTS';
import { useState, useEffect } from 'react';
import PhraseTile from '../phrases/PhraseTile';
import ActionTile from '../phrases/ActionTile';
import { useAuth } from '../../contexts/AuthContext';
import AnimatedLoading from '../phrases/AnimatedLoading';

export default function PhrasesInterface() {
  const router = useRouter();
  const tts = useTTS();
  const { user, loading: authLoading } = useAuth();
  const [typingText, setTypingText] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [isReaderOpen, setIsReaderOpen] = useState(false);

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
    shouldLoadBoards && selectedBoardId ? { id: selectedBoardId as any } : 'skip'
  );

  // Mutations
  const addPhrase = useMutation(api.phrases.addPhrase);
  const addPhraseToBoard = useMutation(api.phraseBoards.addPhraseToBoard);

  const loading = authLoading || (shouldLoadBoards && boards === undefined);
  const loadingPhrases =
    shouldLoadBoards && selectedBoardId !== null && selectedBoardData === undefined;

  // Auto-select first board on load or use saved board
  useEffect(() => {
    if (!shouldLoadBoards) {
      setSelectedBoardId(null);
      return;
    }

    if (!boards || boards.length === 0) {
      setSelectedBoardId(null);
      return;
    }

    // Try to get the saved board ID from localStorage
    const savedBoardId = localStorage.getItem('selectedBoardId');

    if (savedBoardId && boards.some(board => board._id === savedBoardId)) {
      // Found the saved board
      setSelectedBoardId(savedBoardId);
    } else {
      // No saved board or it doesn't exist, select first board
      setSelectedBoardId(boards[0]._id);
      localStorage.setItem('selectedBoardId', boards[0]._id);
    }
  }, [boards, shouldLoadBoards]);

  const handlePhrasePress = (phrase: any) => {
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
        phraseId: phraseId as any,
        boardId: selectedBoardId as any,
      });

      setTypingText(''); // Clear the typing area after adding
    } catch (error) {
      console.error('Error adding phrase:', error);
    }
  };

  const handleEditPhrase = (phrase: any) => {
    if (!selectedBoardId) return;
    router.push(`/phrases/edit/${phrase._id}?boardId=${selectedBoardId}`);
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

  const handleSelectBoard = (board: any) => {
    const boardId = typeof board === 'string' ? board : board.id;
    setSelectedBoardId(boardId);
    // Save the selected board ID to localStorage
    localStorage.setItem('selectedBoardId', boardId);
  };

  // Extract phrases from the board data
  const phrases = selectedBoardData?.phrase_board_phrases?.map(pbp => pbp.phrase).filter(Boolean) || [];

  // Transform boards to match the expected format (PhraseBoard type)
  const transformedBoards = boards?.map(board => {
    // Count phrases for this board
    const phraseCount = board._id === selectedBoardId ? phrases.length : 0;
    return {
      id: board._id,
      name: board.name,
      position: board.position,
      phrases: board._id === selectedBoardId ? phrases : [], // Only load phrases for selected board
    };
  }) || [];

  const selectedBoard = transformedBoards.find(board => board.id === selectedBoardId) || null;

  return (
    <>
      <div className="flex-none">
        <TypingArea
          initialText={typingText}
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
              isLoadingPhrases={loadingPhrases}
              onSelectBoard={handleSelectBoard}
              onEditBoard={(boardId) => router.push(`/phrases/boards/edit/${boardId}`)}
            />
          </div>

          <div className="flex-1 p-1 overflow-auto">
            {!loading && (
              <div className="flex flex-col h-full">
                <div className="flex-1 p-1 overflow-auto">
                  <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-1 h-full">
                    {phrases.map((phrase: any) => (
                      <PhraseTile
                        key={phrase._id}
                        phrase={{
                          id: phrase._id,
                          text: phrase.text,
                          symbolId: phrase.symbolId,
                          frequency: phrase.frequency,
                        }}
                        onPress={() => handlePhrasePress(phrase)}
                        onEdit={isEditMode ? () => handleEditPhrase(phrase) : undefined}
                        className="sm:aspect-square"
                      />
                    ))}
                    {typingText.trim() && (
                      <ActionTile
                        text="+ Add as Phrase"
                        onClick={handleAddTypingAsPhrase}
                        className="sm:aspect-square"
                      />
                    )}
                    {isEditMode && (
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
      />
      <ReaderPopup
        phrases={phrases.map((p: any) => ({
          id: p._id,
          text: p.text,
          symbolId: p.symbolId,
          frequency: p.frequency,
        }))}
        isOpen={isReaderOpen}
        onClose={handleCloseReader}
        onSpeak={handleSpeakInReader}
      />
    </>
  );
}
