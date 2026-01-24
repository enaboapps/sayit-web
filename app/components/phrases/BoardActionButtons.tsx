'use client';

import { useState, useRef, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  CheckIcon,
  Squares2X2Icon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';

interface BoardActionButtonsProps {
  onAddBoard?: () => void;
  onAddPhrase?: () => void;
  onEdit?: () => void;
  isEditMode?: boolean;
  canEditBoard?: boolean;
}

export default function BoardActionButtons({
  onAddBoard,
  onAddPhrase,
  onEdit,
  isEditMode = false,
  canEditBoard = true,
}: BoardActionButtonsProps) {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Close add menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
        setIsAddMenuOpen(false);
      }
    };

    if (isAddMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAddMenuOpen]);

  const showAddButton = onAddBoard || (onAddPhrase && canEditBoard);
  const showEditButton = canEditBoard && onEdit;

  if (!showAddButton && !showEditButton) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 py-2 bg-surface">
      {/* Add Dropdown */}
      {showAddButton && (
        <div ref={addMenuRef} className="relative">
          <button
            onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${
              isAddMenuOpen
                ? 'bg-surface-hover text-foreground'
                : 'hover:bg-surface-hover text-text-secondary'
            }`}
            aria-label="Add new"
            aria-expanded={isAddMenuOpen}
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add</span>
          </button>

          {/* Dropdown Menu */}
          {isAddMenuOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[140px] z-50">
              {onAddPhrase && canEditBoard && (
                <button
                  onClick={() => {
                    onAddPhrase();
                    setIsAddMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-hover"
                >
                  <ChatBubbleLeftIcon className="w-4 h-4" />
                  <span>New Phrase</span>
                </button>
              )}
              {onAddBoard && (
                <button
                  onClick={() => {
                    onAddBoard();
                    setIsAddMenuOpen(false);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-surface-hover"
                >
                  <Squares2X2Icon className="w-4 h-4" />
                  <span>New Board</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit/Done - only if can edit */}
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
