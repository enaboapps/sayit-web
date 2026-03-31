'use client';

import {
  PlusIcon,
  PencilIcon,
  CheckIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';

interface BoardActionButtonsProps {
  onAddBoard?: () => void;
  onEdit?: () => void;
  isEditMode?: boolean;
  canEditBoard?: boolean;
}

export default function BoardActionButtons({
  onAddBoard,
  onEdit,
  isEditMode = false,
  canEditBoard = true,
}: BoardActionButtonsProps) {
  const showAddBoard = !!onAddBoard;
  const showEditButton = canEditBoard && onEdit;

  if (!showAddBoard && !showEditButton) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 py-2 bg-surface">
      {showAddBoard && (
        <button
          onClick={onAddBoard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm hover:bg-surface-hover text-text-secondary transition-colors"
          aria-label="Add board"
        >
          <Squares2X2Icon className="w-4 h-4" />
          <span>Add Board</span>
        </button>
      )}

      {showEditButton && (
        <button
          onClick={onEdit}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-sm ${
            isEditMode
              ? 'bg-primary-500 text-white'
              : 'hover:bg-surface-hover text-text-secondary'
          }`}
          aria-label={isEditMode ? 'Done editing' : 'Edit board'}
        >
          {isEditMode ? (
            <>
              <CheckIcon className="w-4 h-4" />
              <span>Done</span>
            </>
          ) : (
            <>
              <PencilIcon className="w-4 h-4" />
              <span>Edit</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
