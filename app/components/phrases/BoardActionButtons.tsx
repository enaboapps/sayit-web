'use client';

import { useState, useRef, useEffect } from 'react';
import {
  PlusIcon,
  Squares2X2Icon,
  EllipsisHorizontalIcon,
  PencilIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import OpenBoardExportMenu from './OpenBoardExportMenu';

interface BoardActionButtonsProps {
  onAddPhrase?: () => void;
  onAddBoard?: () => void;
  onEdit?: () => void;
  onEditBoard?: () => void;
  onImportOpenBoard?: () => void;
  onExportCurrentBoard?: () => void;
  onExportAllBoards?: () => void;
  isEditMode?: boolean;
  canEditBoard?: boolean;
  canExportCurrentBoard?: boolean;
  canExportAllBoards?: boolean;
}

export default function BoardActionButtons({
  onAddPhrase,
  onAddBoard,
  onEdit,
  onEditBoard,
  onImportOpenBoard,
  onExportCurrentBoard,
  onExportAllBoards,
  isEditMode = false,
  canEditBoard = true,
  canExportCurrentBoard = false,
  canExportAllBoards = false,
}: BoardActionButtonsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const showAddPhrase = canEditBoard && !!onAddPhrase;
  const showAddBoard = !!onAddBoard;
  const showOpenBoardMenu = !!onImportOpenBoard || !!onExportCurrentBoard || !!onExportAllBoards;
  const showMenu = !!onEdit || !!onEditBoard || showOpenBoardMenu;

  if (!showAddPhrase && !showAddBoard && !showMenu) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-2 bg-surface">
      {showAddPhrase && (
        <button
          onClick={onAddPhrase}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-primary-500 hover:bg-primary-600 text-white transition-colors font-medium"
          aria-label="Add phrase"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Phrase</span>
        </button>
      )}

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

      {showMenu && (
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-hover text-text-secondary transition-colors"
            aria-label="More options"
          >
            <EllipsisHorizontalIcon className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 bottom-full mb-1 w-64 bg-surface border border-border rounded-2xl shadow-xl overflow-hidden z-50">
              {onEdit && (
                <button
                  onClick={() => { onEdit(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-surface-hover transition-colors"
                >
                  {isEditMode ? (
                    <>
                      <CheckIcon className="w-4 h-4 text-primary-500" />
                      <span className="text-primary-500 font-medium">Done Editing</span>
                    </>
                  ) : (
                    <>
                      <PencilIcon className="w-4 h-4 text-text-secondary" />
                      <span className="text-foreground">Edit Phrases</span>
                    </>
                  )}
                </button>
              )}
              {onEditBoard && (
                <button
                  onClick={() => { onEditBoard(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm hover:bg-surface-hover transition-colors border-t border-border"
                >
                  <PencilIcon className="w-4 h-4 text-text-secondary" />
                  <span className="text-foreground">Edit Board</span>
                </button>
              )}
              <OpenBoardExportMenu
                onImportOpenBoard={onImportOpenBoard}
                onExportCurrentBoard={onExportCurrentBoard}
                onExportAllBoards={onExportAllBoards}
                canExportCurrentBoard={canExportCurrentBoard}
                canExportAllBoards={canExportAllBoards}
                onAction={() => setMenuOpen(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
