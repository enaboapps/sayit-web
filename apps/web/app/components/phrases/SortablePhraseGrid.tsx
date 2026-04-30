'use client';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PhraseGrid from './PhraseGrid';
import BoardTileRenderer from './tiles/BoardTileRenderer';
import type { BoardTileSummary, PhraseSummary } from './types';

interface SortableTileItemProps {
  tile: BoardTileSummary;
  textSizePx: number;
  onPhrasePress: (phrase: PhraseSummary) => void;
  onPhraseStop?: () => void;
  onPhraseEdit: (phrase: PhraseSummary) => void;
  isPhraseSpeaking: boolean;
  onNavigateTap: (tile: Extract<BoardTileSummary, { kind: 'navigate' }>) => void;
  onNavigateEdit: (tile: Extract<BoardTileSummary, { kind: 'navigate' }>) => void;
  onAudioEdit: (tile: Extract<BoardTileSummary, { kind: 'audio' }>) => void;
}

function SortableTileItem(props: SortableTileItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.tile.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none' as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <BoardTileRenderer
        tile={props.tile}
        textSizePx={props.textSizePx}
        onPhrasePress={props.onPhrasePress}
        onPhraseStop={props.onPhraseStop}
        onPhraseEdit={props.onPhraseEdit}
        isPhraseSpeaking={props.isPhraseSpeaking}
        onNavigateTap={props.onNavigateTap}
        onNavigateEdit={props.onNavigateEdit}
        onAudioEdit={props.onAudioEdit}
        isEditMode
      />
    </div>
  );
}

interface SortablePhraseGridProps {
  /** Polymorphic tiles ordered by position. */
  tiles: BoardTileSummary[];
  activePhraseId: string | null;
  isSpeaking: boolean;
  onPhrasePress: (phrase: PhraseSummary) => void;
  onPhraseStop: () => void;
  onPhraseEdit: (phrase: PhraseSummary) => void;
  onNavigateTap: (tile: Extract<BoardTileSummary, { kind: 'navigate' }>) => void;
  onNavigateEdit: (tile: Extract<BoardTileSummary, { kind: 'navigate' }>) => void;
  onAudioEdit: (tile: Extract<BoardTileSummary, { kind: 'audio' }>) => void;
  /** Receives ordered boardTile ids; caller should call api.boardTiles.reorderTiles. */
  onReorder: (orderedTileIds: string[]) => void;
  extraTile?: React.ReactNode;
  textSizePx: number;
}

export default function SortablePhraseGrid({
  tiles,
  activePhraseId,
  isSpeaking,
  onPhrasePress,
  onPhraseStop,
  onPhraseEdit,
  onNavigateTap,
  onNavigateEdit,
  onAudioEdit,
  onReorder,
  extraTile,
  textSizePx,
}: SortablePhraseGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  // Defensive: tolerate transient undefined during HMR / data load, so the
  // grid can mount empty rather than crash the whole tab.
  const safeTiles = tiles ?? [];
  const ids = safeTiles.map((t) => t.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...ids];
    reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, active.id as string);
    onReorder(reordered);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <PhraseGrid textSizePx={textSizePx}>
          {safeTiles.map((tile) => {
            const isPhraseSpeaking = tile.kind === 'phrase'
              && activePhraseId === tile.phrase.id
              && isSpeaking;
            return (
              <SortableTileItem
                key={tile.id}
                tile={tile}
                textSizePx={textSizePx}
                onPhrasePress={onPhrasePress}
                onPhraseStop={onPhraseStop}
                onPhraseEdit={onPhraseEdit}
                isPhraseSpeaking={isPhraseSpeaking}
                onNavigateTap={onNavigateTap}
                onNavigateEdit={onNavigateEdit}
                onAudioEdit={onAudioEdit}
              />
            );
          })}
          {extraTile}
        </PhraseGrid>
      </SortableContext>
    </DndContext>
  );
}
