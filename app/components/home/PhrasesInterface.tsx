import { useRouter } from 'next/navigation';
import { Phrase } from '@/lib/models/Phrase';
import { PhraseBoard } from '@/lib/models/PhraseBoard';
import PhraseDataGrid from '../phrases/PhraseDataGrid';
import PhrasesBottomBar from '../phrases/PhrasesBottomBar';
import BoardSelector from '../phrases/BoardSelector';
import TypingArea from '../TypingArea';
import { useTTS } from '@/lib/hooks/useTTS';
import { useState, useEffect } from 'react';
import { phraseStore } from '@/lib/stores/phraseStore';
import { databaseService } from '@/lib/services/DatabaseService';
import { useAuth } from '@/app/contexts/AuthContext';

export default function PhrasesInterface() {
  const router = useRouter();
  const { user } = useAuth();
  const tts = useTTS();
  const [typingText, setTypingText] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [boards, setBoards] = useState<PhraseBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<PhraseBoard | null>(null);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPhrases, setLoadingPhrases] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    console.log('Fetching phrase boards for user:', user.id);
    phraseStore.getState().fetchBoards(user.id)
      .then(() => {
        const boards = phraseStore.getState().boards;
        setBoards(boards);
        if (boards.length > 0) {
          setSelectedBoard(boards[0]);
        }
        setLoading(false);
      })
      .catch((err: Error) => {
        console.error('Error fetching boards:', err);
        setError('Failed to load phrase boards');
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    if (!user || !selectedBoard) return;

    console.log('Fetching phrases for board:', selectedBoard.id);
    setLoadingPhrases(true);
    setPhrases([]); // Clear existing phrases while loading

    if (selectedBoard.id) {
      databaseService.getPhraseBoard(selectedBoard.id)
        .then(async boardData => {
          if (boardData) {
            const board = await PhraseBoard.fromSupabase(boardData);
            setPhrases(board.phrases);
          }
          setLoadingPhrases(false);
        })
        .catch(err => {
          console.error('Error fetching board data:', err);
          setError('Failed to load phrases');
          setLoadingPhrases(false);
        });
    }
  }, [user, selectedBoard]);

  const handlePhrasePress = (phrase: Phrase) => {
    setTypingText(phrase.text);
    tts.speak(phrase.text);
  };

  const handleEdit = () => {
    setIsEditMode(!isEditMode);
  };

  const handleAddPhrase = async () => {
    if (!user || !selectedBoard) {
      console.error('Cannot add phrase: no user or board selected');
      return;
    }
    router.push(`/phrases/add?boardId=${selectedBoard.id}`);
  };

  const handleEditPhrase = (phrase: Phrase) => {
    if (!selectedBoard) return;
    router.push(`/phrases/edit/${phrase.id}?boardId=${selectedBoard.id}`);
  };

  const handleAddBoard = () => {
    router.push('/phrases/boards/add');
  };

  const handleSelectBoard = (board: PhraseBoard) => {
    setSelectedBoard(board);
  };

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <>
      <div className="flex-none">
        <TypingArea initialText={typingText} tts={tts} />
      </div>
      {boards.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-4">No boards yet</h2>
            <p className="text-gray-600 mb-6">Create your first board to start adding phrases</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex-none">
            <BoardSelector
              boards={boards}
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
                  <PhraseDataGrid
                    phrases={phrases}
                    boardId={selectedBoard?.id ?? ''}
                    isEditMode={isEditMode}
                    isLoading={loadingPhrases}
                    onPhrasePress={handlePhrasePress}
                    onEditPhrase={handleEditPhrase}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <PhrasesBottomBar
        onAddPhrase={handleAddPhrase}
        onAddBoard={handleAddBoard}
        onEdit={handleEdit}
        boardPresent={boards.length > 0}
        isEditMode={isEditMode}
      />
    </>
  );
} 