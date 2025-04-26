'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { phraseStore } from '@/lib/stores/phraseStore';
import { Phrase } from '@/lib/models/Phrase';
import { PhraseBoard } from '@/lib/models/PhraseBoard';
import { databaseService } from '@/lib/services/DatabaseService';
import PhrasesSkeleton from '@/app/components/phrases/PhrasesSkeleton';
import HomeFeatures from '@/app/components/home/HomeFeatures';
import PhrasesInterface from '@/app/components/home/PhrasesInterface';

export default function Home() {
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

  const handleSelectBoard = (index: number) => {
    setCurrentIndex(index);
    setSelectedBoard(boards[index]);
  };

  if (authLoading) {
    return <PhrasesSkeleton />;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {!user ? (
        <HomeFeatures typingText={typingText} />
      ) : (
        <PhrasesInterface
          boards={boards}
          selectedBoard={selectedBoard}
          phrases={phrases}
          loading={loading}
          loadingPhrases={loadingPhrases}
          currentIndex={currentIndex}
          isEditMode={isEditMode}
          typingText={typingText}
          onPhrasePress={handlePhrasePress}
          onAddPhrase={handleAddPhrase}
          onEditPhrase={handleEditPhrase}
          onNextBoard={nextBoard}
          onPrevBoard={prevBoard}
          onAddBoard={handleAddBoard}
          onEdit={handleEdit}
          onSelectBoard={handleSelectBoard}
        />
      )}
    </div>
  );
}
