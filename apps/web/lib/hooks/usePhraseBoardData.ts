'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSettings } from '@/app/contexts/SettingsContext';
import { useBoardNavStack } from '@/app/contexts/BoardNavStackContext';
import { useOnlineStatus } from './useOnlineStatus';
import type { BoardSummary, BoardTileSummary, PhraseSummary, TileLayoutSummary } from '@/app/components/phrases/types';
import type { TileRole, WordClass } from '@/lib/aacLayout';

type PhraseBoardsResult = FunctionReturnType<typeof api.phraseBoards.getPhraseBoards>;
type ConvexBoardSummary = PhraseBoardsResult[number];
type SelectedBoardData = NonNullable<FunctionReturnType<typeof api.phraseBoards.getPhraseBoard>>;
type ConvexPhraseLink = SelectedBoardData['phrase_board_phrases'][number];
type ConvexPhrase = NonNullable<ConvexPhraseLink['phrase']>;
type ConvexBoardTile = SelectedBoardData['tiles'][number];

type ConvexTileLayout = {
  cellRow?: unknown;
  cellColumn?: unknown;
  cellRowSpan?: unknown;
  cellColumnSpan?: unknown;
  tileRole?: unknown;
  wordClass?: unknown;
  isLocked?: unknown;
};

function tileLayoutSummary(tile: ConvexTileLayout): TileLayoutSummary {
  return {
    cellRow: typeof tile.cellRow === 'number' ? tile.cellRow : undefined,
    cellColumn: typeof tile.cellColumn === 'number' ? tile.cellColumn : undefined,
    cellRowSpan: typeof tile.cellRowSpan === 'number' ? tile.cellRowSpan : undefined,
    cellColumnSpan: typeof tile.cellColumnSpan === 'number' ? tile.cellColumnSpan : undefined,
    tileRole: typeof tile.tileRole === 'string' ? tile.tileRole as TileRole : undefined,
    wordClass: typeof tile.wordClass === 'string' ? tile.wordClass as WordClass : undefined,
    isLocked: typeof tile.isLocked === 'boolean' ? tile.isLocked : undefined,
  };
}

function hasPhrase(link: ConvexPhraseLink): link is ConvexPhraseLink & { phrase: ConvexPhrase } {
  return link.phrase !== null;
}

export function toPhraseSummary(phrase: ConvexPhrase): PhraseSummary {
  return {
    id: String(phrase._id),
    text: phrase.text,
    symbolUrl: phrase.symbolUrl,
    symbolStorageId: phrase.symbolStorageId ? String(phrase.symbolStorageId) : undefined,
  };
}

export function toTileSummary(tile: ConvexBoardTile): BoardTileSummary | null {
  if (tile.kind === 'phrase') {
    if (!tile.phrase) return null;

    return {
      id: String(tile._id),
      kind: 'phrase',
      position: tile.position,
      ...tileLayoutSummary(tile),
      phrase: toPhraseSummary(tile.phrase),
    };
  }

  if (tile.kind === 'audio') {
    return {
      id: String(tile._id),
      kind: 'audio',
      position: tile.position,
      audioLabel: tile.audioLabel,
      audioUrl: tile.audioUrl ?? null,
      audioMimeType: tile.audioMimeType,
      audioDurationMs: tile.audioDurationMs,
      audioByteSize: tile.audioByteSize,
      ...tileLayoutSummary(tile),
    };
  }

  return {
    id: String(tile._id),
    kind: 'navigate',
    position: tile.position,
    targetBoardId: String(tile.targetBoardId),
    targetBoardName: tile.targetBoardName ?? null,
    ...tileLayoutSummary(tile),
  };
}

export function toBoardSummary(
  board: ConvexBoardSummary,
  selectedBoardId: string | null,
  phrases: PhraseSummary[],
  tiles: BoardTileSummary[]
): BoardSummary {
  const isSelectedBoard = String(board._id) === selectedBoardId;

  return {
    id: String(board._id),
    name: board.name,
    position: board.position,
    phrases: isSelectedBoard ? phrases : [],
    tiles: isSelectedBoard ? tiles : undefined,
    isShared: board.isShared,
    isOwner: board.isOwner,
    accessLevel: board.accessLevel,
    sharedBy: board.sharedBy,
    forClientId: board.forClientId,
    forClientName: board.forClientName,
    layoutMode: board.layoutMode ?? 'free',
    gridRows: board.gridRows,
    gridColumns: board.gridColumns,
    layoutVersion: board.layoutVersion,
    hiddenFromPicker: board.hiddenFromPicker,
  };
}

type BoardSelectionSummary = Pick<BoardSummary, 'id' | 'hiddenFromPicker'>;

export function preferredBoardSelection<TBoard extends BoardSelectionSummary>(
  boards: TBoard[],
  selectedBoardId: string | null
): {
  selectedBoard: TBoard | null;
  visibleBoards: TBoard[];
  validBoardIndex: number;
  preferredSelectedBoardId: string | null;
} {
  const visibleBoards = boards.filter((board) => !board.hiddenFromPicker);
  const selectedVisibleBoard = selectedBoardId
    ? visibleBoards.find((board) => board.id === selectedBoardId) ?? null
    : null;
  const selectedBoard = selectedVisibleBoard
    ?? visibleBoards[0]
    ?? (selectedBoardId ? boards.find((board) => board.id === selectedBoardId) : undefined)
    ?? boards[0]
    ?? null;
  const currentBoardIndex = visibleBoards.findIndex((board) => board.id === selectedBoard?.id);

  return {
    selectedBoard,
    visibleBoards,
    validBoardIndex: currentBoardIndex >= 0 ? currentBoardIndex : 0,
    preferredSelectedBoardId: selectedBoard?.id ?? null,
  };
}

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
  const moveTileToCell = useMutation(api.boardTiles.moveTileToCell);

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
    const visibleBoards = boards.filter((board) => !board.hiddenFromPicker);
    const preferredBoard = (
      selectedBoardId
        ? visibleBoards.find((board) => board._id === selectedBoardId)
        : null
    ) ?? visibleBoards[0] ?? boards[0];
    if (selectedBoardId === preferredBoard._id) return;
    navStack.clear();
    updateUIPreference('selectedBoardId', preferredBoard._id);
  }, [boards, shouldLoadBoards, selectedBoardId, updateUIPreference, navStack]);


  const phrases: PhraseSummary[] = selectedBoardData?.phrase_board_phrases
    ?.filter(hasPhrase)
    .map((pbp) => toPhraseSummary(pbp.phrase)) || [];

   
  const tiles: BoardTileSummary[] = (selectedBoardData?.tiles ?? [])
    .map(toTileSummary)
    .filter((t: BoardTileSummary | null): t is BoardTileSummary => t !== null);

  const transformedBoards: BoardSummary[] = boards
    ?.map((board) => toBoardSummary(board, selectedBoardId, phrases, tiles)) || [];

  // `visibleBoards` is what picker UIs walk through — drill-down boards
  // imported from OBF vocabularies (CommuniKate, etc.) are flagged
  // `hiddenFromPicker` so they don't clutter the picker. Default selection
  // prefers visible boards, with an all-hidden fallback for malformed or
  // manually-hidden libraries.
  const {
    selectedBoard,
    visibleBoards,
    validBoardIndex,
  } = preferredBoardSelection(transformedBoards, selectedBoardId);
  const canEditCurrentBoard = !selectedBoard?.isShared || selectedBoard?.accessLevel === 'edit';

  // Manual board picks (sidebar, dropdown, board-grid popup) reset the back
  // stack — by spec, only navigate-tile taps build it up.
  const handleSelectBoard = (board: BoardSummary | string) => {
    navStack.clear();
    updateUIPreference('selectedBoardId', typeof board === 'string' ? board : board.id);
  };

  // Mobile swipe nav also counts as a non-tile board pick. Index is into
  // `visibleBoards` since that's what the swipe carousel renders.
  const handleBoardIndexChange = (index: number) => {
    if (visibleBoards[index]) {
      navStack.clear();
      updateUIPreference('selectedBoardId', visibleBoards[index].id);
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

  const handleMoveTileToCell = (tileId: string, row: number, column: number) => {
    if (!selectedBoardId) return;
    void moveTileToCell({
      tileId: tileId as Id<'boardTiles'>,
      row,
      column,
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

  const handleAddAudioTile = () => {
    if (!isOnline || !selectedBoardId || !canEditCurrentBoard) return;
    router.push(`/phrases/boards/${selectedBoardId}/tiles/audio/add`);
  };

  const handleEditPhrase = (phrase: PhraseSummary) => {
    if (!isOnline || !selectedBoardId) return;
    router.push(`/phrases/edit/${phrase.id}?boardId=${selectedBoardId}`);
  };

  const handleEditNavigateTile = (tileId: string) => {
    if (!isOnline || !selectedBoardId) return;
    router.push(`/phrases/boards/${selectedBoardId}/tiles/navigate/${tileId}/edit`);
  };

  const handleEditAudioTile = (tileId: string) => {
    if (!isOnline || !selectedBoardId) return;
    router.push(`/phrases/boards/${selectedBoardId}/tiles/audio/${tileId}/edit`);
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
    visibleBoards,
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
    handleMoveTileToCell,
    handleAddPhrase,
    handleAddNavigateTile,
    handleAddAudioTile,
    handleEditPhrase,
    handleEditNavigateTile,
    handleEditAudioTile,
    handleAddBoard,
    handleEditBoard,
    handleAddAsPhrase,
    handleToggleEditMode,
    handleNavigateToBoard,
    handleNavigateBack,
  };
}
