import BoardSelector from '../phrases/BoardSelector';
import SwipeableBoardNavigator from '../phrases/SwipeableBoardNavigator';
import PhraseGrid from '../phrases/PhraseGrid';
import FixedAACGrid from '../phrases/FixedAACGrid';
import SortablePhraseGrid from '../phrases/SortablePhraseGrid';
import BoardTileRenderer from '../phrases/tiles/BoardTileRenderer';
import AnimatedLoading from '../phrases/AnimatedLoading';
import PhraseBar from '../phrase-bar/PhraseBar';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';
import type { BoardSummary, BoardTileSummary, PhraseSummary } from '../phrases/types';

interface PhrasesTabContentProps {
  boards: BoardSummary[];
  tiles: BoardTileSummary[];
  selectedBoard: BoardSummary | null;
  validBoardIndex: number;
  loading: boolean;
  showAuthPrompt: boolean;
  showOfflineBoardsState: boolean;
  isEditMode: boolean;
  canEditCurrentBoard: boolean;
  isMobile: boolean;
  isOnline: boolean;
  isSpeaking: boolean;
  activePhraseId: string | null;
  canNavigateBack: boolean;
  onPhrasePress: (phrase: PhraseSummary) => void;
  onPhraseStop: () => void;
  onEditPhrase: (phrase: PhraseSummary) => void;
  onNavigateTap: (tile: Extract<BoardTileSummary, { kind: 'navigate' }>) => void;
  onNavigateEdit: (tileId: string) => void;
  onAudioEdit: (tileId: string) => void;
  onNavigateBack: () => void;
  onAddPhrase: (() => void) | undefined;
  onAddNavigateTile: (() => void) | undefined;
  onAddAudioTile: (() => void) | undefined;
  onAddBoard: () => void;
  onImportOpenBoard?: () => void;
  onExportOpenBoard?: () => void;
  onExportAllOpenBoards?: () => void;
  onReorderTiles: (orderedTileIds: string[]) => void;
  onMoveTileToCell: (tileId: string, row: number, column: number) => void;
  onBoardIndexChange: (index: number) => void;
  onToggleEditMode: () => void;
  onSelectBoard: (board: BoardSummary | string) => void;
  onOpenBoardPicker: () => void;
  onEditBoard: (boardId: string) => void;
  textSizePx: number;
}

// onEditBoard already guards isOnline internally (from usePhraseBoardData)
export default function PhrasesTabContent({
  boards,
  tiles,
  selectedBoard,
  validBoardIndex,
  loading,
  showAuthPrompt,
  showOfflineBoardsState,
  isEditMode,
  canEditCurrentBoard,
  isMobile,
  isOnline,
  isSpeaking,
  activePhraseId,
  canNavigateBack,
  onPhrasePress,
  onPhraseStop,
  onEditPhrase,
  onNavigateTap,
  onNavigateEdit,
  onAudioEdit,
  onNavigateBack,
  onAddPhrase,
  onAddNavigateTile,
  onAddAudioTile,
  onAddBoard,
  onImportOpenBoard,
  onExportOpenBoard,
  onExportAllOpenBoards,
  onReorderTiles,
  onMoveTileToCell,
  onBoardIndexChange,
  onToggleEditMode,
  onSelectBoard,
  onOpenBoardPicker,
  onEditBoard,
  textSizePx,
}: PhrasesTabContentProps) {
  const handleNavigateEditTile = (tile: Extract<BoardTileSummary, { kind: 'navigate' }>) => {
    onNavigateEdit(tile.id);
  };

  const handleAudioEditTile = (tile: Extract<BoardTileSummary, { kind: 'audio' }>) => {
    onAudioEdit(tile.id);
  };

  // The `tiles` prop is typed `BoardTileSummary[]` (non-optional) and the
  // hook always returns an array — see `usePhraseBoardData`'s `tiles` derivation.
  const safeTiles = tiles;

  const isFixedGrid = selectedBoard?.layoutMode === 'fixedGrid'
    && typeof selectedBoard.gridRows === 'number'
    && typeof selectedBoard.gridColumns === 'number';

  const phraseGrid = isFixedGrid ? (
    <FixedAACGrid
      tiles={safeTiles}
      rows={selectedBoard.gridRows as number}
      columns={selectedBoard.gridColumns as number}
      activePhraseId={activePhraseId}
      isSpeaking={isSpeaking}
      isEditMode={isEditMode}
      canEdit={canEditCurrentBoard}
      onPhrasePress={onPhrasePress}
      onPhraseStop={onPhraseStop}
      onPhraseEdit={onEditPhrase}
      onNavigateTap={onNavigateTap}
      onNavigateEdit={handleNavigateEditTile}
      onAudioEdit={handleAudioEditTile}
      onMoveTileToCell={onMoveTileToCell}
      textSizePx={textSizePx}
    />
  ) : isEditMode && canEditCurrentBoard ? (
    <SortablePhraseGrid
      tiles={safeTiles}
      activePhraseId={activePhraseId}
      isSpeaking={isSpeaking}
      onPhrasePress={onPhrasePress}
      onPhraseStop={onPhraseStop}
      onPhraseEdit={onEditPhrase}
      onNavigateTap={onNavigateTap}
      onNavigateEdit={handleNavigateEditTile}
      onAudioEdit={handleAudioEditTile}
      onReorder={onReorderTiles}
      textSizePx={textSizePx}
    />
  ) : (
    <PhraseGrid textSizePx={textSizePx}>
      {safeTiles.map((tile) => {
        const isPhraseSpeaking = tile.kind === 'phrase'
          && activePhraseId === tile.phrase.id
          && isSpeaking;
        return (
          <BoardTileRenderer
            key={tile.id}
            tile={tile}
            textSizePx={textSizePx}
            onPhrasePress={onPhrasePress}
            onPhraseStop={onPhraseStop}
            onPhraseEdit={canEditCurrentBoard ? onEditPhrase : undefined}
            isPhraseSpeaking={isPhraseSpeaking}
            onNavigateTap={onNavigateTap}
            onNavigateEdit={canEditCurrentBoard ? handleNavigateEditTile : undefined}
            onAudioEdit={canEditCurrentBoard ? handleAudioEditTile : undefined}
            isEditMode={false}
          />
        );
      })}
    </PhraseGrid>
  );

  const backRow = canNavigateBack ? (
    <div className="px-2 pt-2">
      <button
        type="button"
        onClick={onNavigateBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 px-2 py-1 rounded-md hover:bg-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        aria-label="Back to previous board"
      >
        <ArrowUturnLeftIcon className="w-4 h-4" aria-hidden="true" />
        <span>Back</span>
      </button>
    </div>
  ) : null;

  if (showAuthPrompt) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium text-foreground mb-4">Sign in to view boards</h2>
          <p className="text-text-secondary mb-6">Your saved boards appear after logging in.</p>
        </div>
      </div>
    );
  }

  if (showOfflineBoardsState) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-secondary">Boards are unavailable offline.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <AnimatedLoading />
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium text-foreground mb-4">No boards yet</h2>
          <p className="text-text-secondary mb-6">Create your first board to start adding phrases</p>
          {isOnline && (
            <button
              onClick={onAddBoard}
              className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-colors"
            >
              Create board
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col min-h-0">
        <SwipeableBoardNavigator
          boards={boards}
          currentBoardIndex={validBoardIndex}
          onBoardChange={onBoardIndexChange}
          onOpenBoardPicker={onOpenBoardPicker}
          onAddPhrase={isOnline && canEditCurrentBoard ? onAddPhrase : undefined}
          onAddNavigateTile={isOnline && canEditCurrentBoard ? onAddNavigateTile : undefined}
          onAddAudioTile={isOnline && canEditCurrentBoard ? onAddAudioTile : undefined}
          onAddBoard={isOnline ? onAddBoard : undefined}
          onImportOpenBoard={isOnline ? onImportOpenBoard : undefined}
          onExportOpenBoard={onExportOpenBoard}
          onExportAllOpenBoards={onExportAllOpenBoards}
          onEdit={onToggleEditMode}
          onEditBoard={isOnline && selectedBoard && canEditCurrentBoard ? () => onEditBoard(selectedBoard.id) : undefined}
          isEditMode={isEditMode}
          canEditBoard={canEditCurrentBoard}
        >
          <div className="flex flex-col flex-1 min-h-0">
            <PhraseBar />
            {backRow}
            <div className="p-2 overflow-auto flex-1">
              {phraseGrid}
            </div>
          </div>
        </SwipeableBoardNavigator>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="shrink-0">
        <BoardSelector
          boards={boards}
          selectedBoard={selectedBoard}
          isEditMode={isEditMode}
          onSelectBoard={onSelectBoard}
          onEditBoard={onEditBoard}
          onAddPhrase={isOnline && canEditCurrentBoard ? onAddPhrase : undefined}
          onAddNavigateTile={isOnline && canEditCurrentBoard ? onAddNavigateTile : undefined}
          onAddAudioTile={isOnline && canEditCurrentBoard ? onAddAudioTile : undefined}
          onAddBoard={isOnline ? onAddBoard : undefined}
          onImportOpenBoard={isOnline ? onImportOpenBoard : undefined}
          onExportOpenBoard={onExportOpenBoard}
          onExportAllOpenBoards={onExportAllOpenBoards}
          onEdit={onToggleEditMode}
          embedded={true}
        />
      </div>
      <PhraseBar />
      {backRow}
      <div className="flex-1 overflow-auto p-3">
        {phraseGrid}
      </div>
    </div>
  );
}
