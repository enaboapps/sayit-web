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
import PhraseTile from './PhraseTile';
import type { PhraseSummary } from './types';

interface SortablePhraseTileProps {
  phrase: PhraseSummary;
  onPress: () => void;
  onStop?: () => void;
  onEdit?: () => void;
  isSpeaking?: boolean;
  textSizePx: number;
}

function SortablePhraseTile({ phrase, onPress, onStop, onEdit, isSpeaking, textSizePx }: SortablePhraseTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: phrase.id ?? phrase.text,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <PhraseTile
        phrase={phrase}
        onPress={onPress}
        onStop={onStop}
        onEdit={onEdit}
        isSpeaking={isSpeaking}
        textSizePx={textSizePx}
      />
    </div>
  );
}

interface SortablePhraseGridProps {
  phrases: PhraseSummary[];
  activePhraseId: string | null;
  isSpeaking: boolean;
  onPhrasePress: (phrase: PhraseSummary) => void;
  onPhraseStop: () => void;
  onPhraseEdit: (phrase: PhraseSummary) => void;
  onReorder: (orderedIds: string[]) => void;
  extraTile?: React.ReactNode;
  textSizePx: number;
}

export default function SortablePhraseGrid({
  phrases,
  activePhraseId,
  isSpeaking,
  onPhrasePress,
  onPhraseStop,
  onPhraseEdit,
  onReorder,
  extraTile,
  textSizePx,
}: SortablePhraseGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const ids = phrases.map((p) => p.id ?? p.text);

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
          {phrases.map((phrase) => (
            <SortablePhraseTile
              key={phrase.id}
              phrase={phrase}
              onPress={() => onPhrasePress(phrase)}
              onStop={onPhraseStop}
              onEdit={() => onPhraseEdit(phrase)}
              isSpeaking={activePhraseId === phrase.id && isSpeaking}
              textSizePx={textSizePx}
            />
          ))}
          {extraTile}
        </PhraseGrid>
      </SortableContext>
    </DndContext>
  );
}
