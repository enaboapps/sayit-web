import BoardSelector from '../phrases/BoardSelector';
import SwipeableBoardNavigator from '../phrases/SwipeableBoardNavigator';
import PhraseGrid from '../phrases/PhraseGrid';
import PhraseTile from '../phrases/PhraseTile';
import SortablePhraseGrid from '../phrases/SortablePhraseGrid';
import AnimatedLoading from '../phrases/AnimatedLoading';
import PhraseBar from '../phrase-bar/PhraseBar';
import type { BoardSummary, PhraseSummary } from '../phrases/types';

interface PhrasesTabContentProps {
  boards: BoardSummary[];
  phrases: PhraseSummary[];
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
  onPhrasePress: (phrase: PhraseSummary) => void;
  onPhraseStop: () => void;
  onEditPhrase: (phrase: PhraseSummary) => void;
  onAddPhrase: (() => void) | undefined;
  onAddBoard: () => void;
  onReorderPhrases: (orderedIds: string[]) => void;
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
  phrases,
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
  onPhrasePress,
  onPhraseStop,
  onEditPhrase,
  onAddPhrase,
  onAddBoard,
  onReorderPhrases,
  onBoardIndexChange,
  onToggleEditMode,
  onSelectBoard,
  onOpenBoardPicker,
  onEditBoard,
  textSizePx,
}: PhrasesTabContentProps) {
  const phraseGrid = isEditMode && canEditCurrentBoard ? (
    <SortablePhraseGrid
      phrases={phrases}
      activePhraseId={activePhraseId}
      isSpeaking={isSpeaking}
      onPhrasePress={onPhrasePress}
      onPhraseStop={onPhraseStop}
      onPhraseEdit={onEditPhrase}
      onReorder={onReorderPhrases}
      textSizePx={textSizePx}
    />
  ) : (
    <PhraseGrid textSizePx={textSizePx}>
      {phrases.map((phrase) => (
        <PhraseTile
          key={phrase.id}
          phrase={phrase}
          onPress={() => onPhrasePress(phrase)}
          onStop={onPhraseStop}
          isSpeaking={activePhraseId === phrase.id && isSpeaking}
          onLongPress={canEditCurrentBoard ? () => onEditPhrase(phrase) : undefined}
          textSizePx={textSizePx}
        />
      ))}
    </PhraseGrid>
  );

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
      <div className="flex-1 flex flex-col">
        <SwipeableBoardNavigator
          boards={boards}
          currentBoardIndex={validBoardIndex}
          onBoardChange={onBoardIndexChange}
          onOpenBoardPicker={onOpenBoardPicker}
          onAddPhrase={isOnline && canEditCurrentBoard ? onAddPhrase : undefined}
          onAddBoard={isOnline ? onAddBoard : undefined}
          onEdit={onToggleEditMode}
          onEditBoard={isOnline && selectedBoard && canEditCurrentBoard ? () => onEditBoard(selectedBoard.id) : undefined}
          isEditMode={isEditMode}
          canEditBoard={canEditCurrentBoard}
        >
          <div className="flex flex-col flex-1 min-h-0">
            <PhraseBar />
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
          onAddBoard={isOnline ? onAddBoard : undefined}
          onEdit={onToggleEditMode}
          embedded={true}
        />
      </div>
      <PhraseBar />
      <div className="flex-1 overflow-auto p-3">
        {phraseGrid}
      </div>
    </div>
  );
}
