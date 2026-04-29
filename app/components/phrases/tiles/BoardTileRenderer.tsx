'use client';

import PhraseTile from './PhraseTile';
import NavigateTile from './NavigateTile';
import AudioTile from './AudioTile';
import type { BoardTileSummary, PhraseSummary } from '../types';

interface BoardTileRendererProps {
  tile: BoardTileSummary;
  textSizePx: number;
  // Phrase-tile handlers
  onPhrasePress: (phrase: PhraseSummary) => void;
  onPhraseStop?: () => void;
  onPhraseEdit?: (phrase: PhraseSummary) => void;
  isPhraseSpeaking?: boolean;
  // Navigate-tile handlers
  onNavigateTap: (tile: Extract<BoardTileSummary, { kind: 'navigate' }>) => void;
  onNavigateEdit?: (tile: Extract<BoardTileSummary, { kind: 'navigate' }>) => void;
  // Audio-tile handlers
  onAudioEdit?: (tile: Extract<BoardTileSummary, { kind: 'audio' }>) => void;
  // True when the parent grid is in edit mode (long-press → edit on phrase tiles
  // is replaced by tap-to-edit). Both kinds use the same affordance.
  isEditMode?: boolean;
  className?: string;
}

/**
 * Polymorphic tile dispatcher. The single `switch (tile.kind)` is the
 * extension point for new action kinds — add a new branch and the rest of
 * the grid plumbing keeps working.
 */
export default function BoardTileRenderer({
  tile,
  textSizePx,
  onPhrasePress,
  onPhraseStop,
  onPhraseEdit,
  isPhraseSpeaking = false,
  onNavigateTap,
  onNavigateEdit,
  onAudioEdit,
  isEditMode = false,
  className,
}: BoardTileRendererProps) {
  switch (tile.kind) {
  case 'phrase': {
    const phrase = tile.phrase;
    return (
      <PhraseTile
        phrase={phrase}
        onPress={() => onPhrasePress(phrase)}
        onStop={onPhraseStop}
        isSpeaking={isPhraseSpeaking}
        // In edit mode, tap performs the edit. Outside edit mode, long-press
        // opens edit (when `onPhraseEdit` is supplied).
        onEdit={isEditMode && onPhraseEdit ? () => onPhraseEdit(phrase) : undefined}
        onLongPress={!isEditMode && onPhraseEdit ? () => onPhraseEdit(phrase) : undefined}
        textSizePx={textSizePx}
        className={className}
      />
    );
  }
  case 'audio': {
    return (
      <AudioTile
        tile={tile}
        onEdit={isEditMode && onAudioEdit ? () => onAudioEdit(tile) : undefined}
        onLongPress={!isEditMode && onAudioEdit ? () => onAudioEdit(tile) : undefined}
        textSizePx={textSizePx}
        className={className}
      />
    );
  }
  case 'navigate': {
    return (
      <NavigateTile
        tile={tile}
        onTap={() => onNavigateTap(tile)}
        onEdit={isEditMode && onNavigateEdit ? () => onNavigateEdit(tile) : undefined}
        onLongPress={!isEditMode && onNavigateEdit ? () => onNavigateEdit(tile) : undefined}
        textSizePx={textSizePx}
        className={className}
      />
    );
  }
  }
}
