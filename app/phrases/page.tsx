'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { phraseStore } from '@/lib/stores/phraseStore';
import { Phrase } from '@/lib/models/Phrase';
import { PhraseBoard } from '@/lib/models/PhraseBoard';
import PhraseTile from '@/app/components/phrases/PhraseTile';
import PhrasesBottomBar from '@/app/components/phrases/PhrasesBottomBar';
import BoardCarousel from '@/app/components/phrases/BoardCarousel';
import PhrasesSkeleton from '@/app/components/phrases/PhrasesSkeleton';
import TypingArea from '@/app/components/TypingArea';
import { databaseService } from '@/lib/services/DatabaseService';

export default function PhrasesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [boards, setBoards] = useState<PhraseBoard[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<PhraseBoard | null>(null);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPhrases, setLoadingPhrases] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [typingText, setTypingText] = useState('');

  useEffect(() => {
    console.log('Auth state changed:', { user, authLoading });

    if (authLoading) {
      console.log('Auth is still loading...');
      return;
    }

    if (!user) {
      console.log('No user found, redirecting to login...');
      // TODO: Redirect to login page
      return;
    }

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
  }, [user, authLoading]);

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

  const nextBoard = () => {
    if (boards.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % boards.length);
    setSelectedBoard(boards[(currentIndex + 1) % boards.length]);
  };

  const prevBoard = () => {
    if (boards.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + boards.length) % boards.length);
    setSelectedBoard(boards[(currentIndex - 1 + boards.length) % boards.length]);
  };

  const handleAddBoard = () => {
    router.push('/phrases/boards/add');
  };

  const handleEdit = () => {
    setIsEditMode(!isEditMode);
  };

  if (authLoading || loading) {
    return <PhrasesSkeleton />;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!user) {
    return <div className="text-black">Please log in to view your phrases</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {boards.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-4">No boards yet</h2>
            <p className="text-gray-600 mb-6">Create your first board to start adding phrases</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div>
            <TypingArea initialText={typingText} />
          </div>
          <div className="flex-none">
            <BoardCarousel
              boards={boards}
              selectedBoard={selectedBoard}
              currentIndex={currentIndex}
              isEditMode={isEditMode}
              phrasesCount={phrases.length}
              isLoadingPhrases={loadingPhrases}
              onPrevBoard={prevBoard}
              onNextBoard={nextBoard}
              onSelectBoard={(index) => {
                setCurrentIndex(index);
                setSelectedBoard(boards[index]);
              }}
              onEditBoard={(boardId) => router.push(`/phrases/boards/edit/${boardId}`)}
            />
          </div>

          <div className="flex-1 p-1 overflow-auto">
            {!loading && (
              <div className="flex flex-col h-full">
                <div className="flex-1 p-1 overflow-auto">
                  {loadingPhrases ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 h-full">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 h-full">
                      {phrases.map((phrase) => (
                        <PhraseTile
                          key={phrase.id}
                          phrase={phrase}
                          onPress={() => handlePhrasePress(phrase)}
                          onEdit={isEditMode ? () => handleEditPhrase(phrase) : undefined}
                          className="aspect-square"
                        />
                      ))}
                      {isEditMode && (
                        <button
                          onClick={handleAddPhrase}
                          className="aspect-square flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 transition-colors duration-200"
                          aria-label="Add new phrase"
                        >
                          <span className="text-gray-500 text-lg">+ Add Phrase</span>
                        </button>
                      )}
                    </div>
                  )}
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
        isEditMode={isEditMode}
      />
    </div>
  );
}
