'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSettings } from '@/app/contexts/SettingsContext';
import { useBoardNavStack } from '@/app/contexts/BoardNavStackContext';
import { useOnlineStatus } from './useOnlineStatus';
import type { BoardSummary, BoardTileSummary, PhraseSummary } from '@/app/components/phrases/types';

export function usePhraseBoardData() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { uiPreferences, updateUIPreference } = useSettings();
  const { isOnline } = useOnlineStatus();
  const navStack = useBoardNavStack();
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
  const reorderTiles = useMutation(api.boardTiles.reorderTiles);

  const loading = authLoading || (shouldLoadBoards && boards === undefined);
  const showOfflineBoardsState = !isOnline && shouldLoadBoards && boards === undefined;

  // Auto-select first board on load or restore saved board.
  // Auto-selecting is a non-tile pick — clear the back stack.
  useEffect(() => {
    if (!shouldLoadBoards) {
      if (selectedBoardId !== null) {
        navStack.clear();
        updateUIPreference('selectedBoardId', null);
      }
      return;
    }
    if (!boards || boards.length === 0) {
      if (selectedBoardId !== null) {
        navStack.clear();
        updateUIPreference('selectedBoardId', null);
      }
      return;
    }
    if (selectedBoardId && boards.some(board => board._id === selectedBoardId)) return;
    navStack.clear();
    updateUIPreference('selectedBoardId', boards[0]._id);
  }, [boards, shouldLoadBoards, selectedBoardId, updateUIPreference, navStack]);


  const phrases: PhraseSummary[] = selectedBoardData?.phrase_board_phrases
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

   
  const tiles: BoardTileSummary[] = (selectedBoardData?.tiles ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((tile: any): BoardTileSummary | null => {
      if (tile.kind === 'phrase') {
        if (!tile.phrase) return null; // skip orphaned phrase rows defensively
        return {
          id: String(tile._id),
          kind: 'phrase',
          position: tile.position,
          phrase: {
            id: String(tile.phrase._id),
            text: tile.phrase.text,
            symbolUrl: tile.phrase.symbolUrl,
            symbolStorageId: tile.phrase.symbolStorageId ? String(tile.phrase.symbolStorageId) : undefined,
          },
        };
      }
      // kind === 'navigate'
      return {
        id: String(tile._id),
        kind: 'navigate',
        position: tile.position,
        targetBoardId: String(tile.targetBoardId),
        targetBoardName: tile.targetBoardName ?? null,
      };
    })
    .filter((t: BoardTileSummary | null): t is BoardTileSummary => t !== null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformedBoards: BoardSummary[] = boards?.map((board: any) => ({
    id: String(board._id),
    name: board.name,
    position: board.position,
    phrases: board._id === selectedBoardId ? phrases : [],
    tiles: board._id === selectedBoardId ? tiles : undefined,
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

  // Manual board picks (sidebar, dropdown, board-grid popup) reset the back
  // stack — by spec, only navigate-tile taps build it up.
  const handleSelectBoard = (board: BoardSummary | string) => {
    navStack.clear();
    updateUIPreference('selectedBoardId', typeof board === 'string' ? board : board.id);
  };

  // Mobile swipe nav also counts as a non-tile board pick.
  const handleBoardIndexChange = (index: number) => {
    if (transformedBoards[index]) {
      navStack.clear();
      updateUIPreference('selectedBoardId', transformedBoards[index].id);
    }
  };

  // Tap on a navigate tile: push the current board onto the stack so the
  // header back button can return to it, then switch.
  const handleNavigateToBoard = (targetBoardId: string) => {
    if (!selectedBoardId) return;
    navStack.push(String(selectedBoardId));
    updateUIPreference('selectedBoardId', targetBoardId);
  };

  // Header back button: pop the previous board and switch to it. Bypasses
  // handleSelectBoard so the rest of the stack is preserved.
  const handleNavigateBack = () => {
    const previous = navStack.pop();
    if (previous) {
      updateUIPreference('selectedBoardId', previous);
    }
  };

  // Reorder by tile id (mixed-kind grids use this).
  const handleReorderTiles = (orderedTileIds: string[]) => {
    if (!selectedBoardId) return;
    void reorderTiles({
      boardId: selectedBoardId as Id<'phraseBoards'>,
      orderedTileIds: orderedTileIds as Id<'boardTiles'>[],
    });
  };

  // Compatibility: legacy callers that reorder by phrase id. Still supported
  // until all consumers move to handleReorderTiles.
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

  const handleAddNavigateTile = () => {
    if (!isOnline || !selectedBoardId || !canEditCurrentBoard) return;
    router.push(`/phrases/boards/${selectedBoardId}/tiles/navigate/add`);
  };

  const handleEditPhrase = (phrase: PhraseSummary) => {
    if (!isOnline || !selectedBoardId) return;
    router.push(`/phrases/edit/${phrase.id}?boardId=${selectedBoardId}`);
  };

  const handleEditNavigateTile = (tileId: string) => {
    if (!isOnline || !selectedBoardId) return;
    router.push(`/phrases/boards/${selectedBoardId}/tiles/navigate/${tileId}/edit`);
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
    tiles,
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
    canNavigateBack: navStack.canPop,
    handleSelectBoard,
    handleBoardIndexChange,
    handleReorderPhrases,
    handleReorderTiles,
    handleAddPhrase,
    handleAddNavigateTile,
    handleEditPhrase,
    handleEditNavigateTile,
    handleAddBoard,
    handleEditBoard,
    handleAddAsPhrase,
    handleToggleEditMode,
    handleNavigateToBoard,
    handleNavigateBack,
  };
}
