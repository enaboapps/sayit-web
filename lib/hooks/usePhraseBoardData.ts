'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSettings } from '@/app/contexts/SettingsContext';
import { useOnlineStatus } from './useOnlineStatus';
import type { BoardSummary, PhraseSummary } from '@/app/components/phrases/types';

export function usePhraseBoardData() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { uiPreferences, updateUIPreference } = useSettings();
  const { isOnline } = useOnlineStatus();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isBoardPickerOpen, setIsBoardPickerOpen] = useState(false);

  const selectedBoardId = uiPreferences.selectedBoardId;
  const shouldLoadBoards = !authLoading && !!user;
  const showAuthPrompt = !authLoading && !user;

  const boards = useQuery(
    api.phraseBoards.getPhraseBoards,
    shouldLoadBoards ? undefined : 'skip'
  );

  const selectedBoardData = useQuery(
    api.phraseBoards.getPhraseBoard,
    shouldLoadBoards && selectedBoardId
      ? { id: selectedBoardId as Id<'phraseBoards'> }
      : 'skip'
  );

  const reorderPhrasesOnBoard = useMutation(api.phraseBoards.reorderPhrasesOnBoard);

  const loading = authLoading || (shouldLoadBoards && boards === undefined);
  const showOfflineBoardsState = !isOnline && shouldLoadBoards && boards === undefined;

  // Auto-select first board on load or restore saved board
  useEffect(() => {
    if (!shouldLoadBoards) {
      if (selectedBoardId !== null) updateUIPreference('selectedBoardId', null);
      return;
    }
    if (!boards || boards.length === 0) {
      if (selectedBoardId !== null) updateUIPreference('selectedBoardId', null);
      return;
    }
    if (selectedBoardId && boards.some(board => board._id === selectedBoardId)) return;
    updateUIPreference('selectedBoardId', boards[0]._id);
  }, [boards, shouldLoadBoards, selectedBoardId, updateUIPreference]);

  const mapPhrases = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    phraseBoardPhrases: any[] | undefined
  ): PhraseSummary[] => phraseBoardPhrases
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ?.map((pbp: any) => pbp.phrase)
    .filter(Boolean)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((phrase: any) => ({
      id: String(phrase._id),
      text: phrase.text,
      symbolUrl: phrase.symbolUrl,
      symbolStorageId: phrase.symbolStorageId ? String(phrase.symbolStorageId) : undefined,
    })) || [];

  const phrases: PhraseSummary[] = mapPhrases(selectedBoardData?.phrase_board_phrases);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformedBoards: BoardSummary[] = boards?.map((board: any) => ({
    id: String(board._id),
    name: board.name,
    position: board.position,
    phrases: board._id === selectedBoardId ? phrases : mapPhrases(board.phrase_board_phrases),
    isShared: board.isShared,
    isOwner: board.isOwner,
    accessLevel: board.accessLevel,
    sharedBy: board.sharedBy,
    forClientId: board.forClientId,
    forClientName: board.forClientName,
  })) || [];

  const selectedBoard = transformedBoards.find(b => b.id === selectedBoardId) || null;
  const currentBoardIndex = transformedBoards.findIndex(b => b.id === selectedBoardId);
  const validBoardIndex = currentBoardIndex >= 0 ? currentBoardIndex : 0;
  const canEditCurrentBoard = !selectedBoard?.isShared || selectedBoard?.accessLevel === 'edit';

  const handleSelectBoard = (board: BoardSummary | string) => {
    updateUIPreference('selectedBoardId', typeof board === 'string' ? board : board.id);
  };

  const handleBoardIndexChange = (index: number) => {
    if (transformedBoards[index]) {
      updateUIPreference('selectedBoardId', transformedBoards[index].id);
    }
  };

  const handleReorderPhrases = (orderedIds: string[]) => {
    if (!selectedBoardId) return;
    void reorderPhrasesOnBoard({
      boardId: selectedBoardId as Id<'phraseBoards'>,
      orderedPhraseIds: orderedIds as Id<'phrases'>[],
    });
  };

  const handleAddPhrase = async () => {
    if (!isOnline) return;
    if (!selectedBoardId) {
      console.error('Cannot add phrase: no board selected');
      return;
    }
    router.push(`/phrases/add?boardId=${selectedBoardId}`);
  };

  const handleEditPhrase = (phrase: PhraseSummary) => {
    if (!isOnline || !selectedBoardId) return;
    router.push(`/phrases/edit/${phrase.id}?boardId=${selectedBoardId}`);
  };

  const handleAddBoard = () => {
    if (!isOnline) return;
    router.push('/phrases/boards/add');
  };

  const handleEditBoard = (boardId: string) => {
    if (!isOnline) return;
    router.push(`/phrases/boards/edit/${boardId}`);
  };

  const handleAddAsPhrase = (text: string) => {
    if (!isOnline || !selectedBoardId || !canEditCurrentBoard) return;
    router.push(`/phrases/add?boardId=${selectedBoardId}&text=${encodeURIComponent(text)}`);
  };

  const handleToggleEditMode = () => setIsEditMode(prev => !prev);

  return {
    boards: transformedBoards,
    phrases,
    selectedBoard,
    selectedBoardId,
    shouldLoadBoards,
    validBoardIndex,
    loading,
    showAuthPrompt,
    showOfflineBoardsState,
    canEditCurrentBoard,
    isEditMode,
    isBoardPickerOpen,
    setIsBoardPickerOpen,
    handleSelectBoard,
    handleBoardIndexChange,
    handleReorderPhrases,
    handleAddPhrase,
    handleEditPhrase,
    handleAddBoard,
    handleEditBoard,
    handleAddAsPhrase,
    handleToggleEditMode,
  };
}
