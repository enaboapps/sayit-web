'use client';

import { useState } from 'react';
import {
  PlusIcon,
  Squares2X2Icon,
  EllipsisHorizontalIcon,
  PencilIcon,
  CheckIcon,
  ChatBubbleLeftIcon,
  ArrowRightCircleIcon,
  SpeakerWaveIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';
import BottomSheet from '@/app/components/ui/BottomSheet';

interface BoardActionButtonsProps {
  onAddPhrase?: () => void;
  onAddNavigateTile?: () => void;
  onAddAudioTile?: () => void;
  onAddBoard?: () => void;
  onEdit?: () => void;
  onEditBoard?: () => void;
  onImportOpenBoard?: () => void;
  onExportOpenBoard?: () => void;
  onExportAllOpenBoards?: () => void;
  isEditMode?: boolean;
  canEditBoard?: boolean;
}

export default function BoardActionButtons({
  onAddPhrase,
  onAddNavigateTile,
  onAddAudioTile,
  onAddBoard,
  onEdit,
  onEditBoard,
  onImportOpenBoard,
  onExportOpenBoard,
  onExportAllOpenBoards,
  isEditMode = false,
  canEditBoard = true,
}: BoardActionButtonsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const showAddPhrase = canEditBoard && !!onAddPhrase;
  const showAddNavigate = canEditBoard && !!onAddNavigateTile;
  const showAddAudio = canEditBoard && !!onAddAudioTile;
  // If multiple add-options are present, render them as a single "Add Tile" menu;
  // if only one is present, fall back to the legacy single button.
  const addTileOptionCount = [showAddPhrase, showAddNavigate, showAddAudio].filter(Boolean).length;
  const showAddTileMenu = addTileOptionCount > 1;
  const showAddBoard = !!onAddBoard;
  const showImport = !!onImportOpenBoard;
  const showExport = !!onExportOpenBoard;
  const showExportAll = !!onExportAllOpenBoards;
  const showMenu = !!onEdit || !!onEditBoard || showImport || showExport || showExportAll;

  if (!showAddPhrase && !showAddNavigate && !showAddAudio && !showAddBoard && !showMenu) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-2 bg-surface">
      {showAddTileMenu ? (
        <button
          onClick={() => setAddMenuOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-primary-500 hover:bg-primary-600 text-white transition-colors font-medium"
          aria-haspopup="dialog"
          aria-expanded={addMenuOpen}
          aria-label="Add tile"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Tile</span>
        </button>
      ) : showAddPhrase ? (
        <button
          onClick={onAddPhrase}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-primary-500 hover:bg-primary-600 text-white transition-colors font-medium"
          aria-label="Add phrase"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Phrase</span>
        </button>
      ) : showAddNavigate ? (
        <button
          onClick={onAddNavigateTile}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-primary-500 hover:bg-primary-600 text-white transition-colors font-medium"
          aria-label="Add navigate tile"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Navigate Tile</span>
        </button>
      ) : showAddAudio ? (
        <button
          onClick={onAddAudioTile}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm bg-primary-500 hover:bg-primary-600 text-white transition-colors font-medium"
          aria-label="Add audio tile"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Audio Tile</span>
        </button>
      ) : null}

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
        <button
          onClick={() => setMenuOpen(true)}
          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-hover text-text-secondary transition-colors"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-label="More options"
        >
          <EllipsisHorizontalIcon className="w-5 h-5" />
        </button>
      )}

      {/* Add-tile bottom sheet */}
      <BottomSheet
        isOpen={addMenuOpen}
        onClose={() => setAddMenuOpen(false)}
        title="Add tile"
        snapPoints={[45]}
        showHandle
        showCloseButton
      >
        <div className="p-2">
          {showAddPhrase && (
            <button
              onClick={() => { onAddPhrase?.(); setAddMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-4 text-base rounded-2xl hover:bg-surface-hover transition-colors"
            >
              <ChatBubbleLeftIcon className="w-5 h-5 text-text-secondary" />
              <span className="text-foreground">Phrase</span>
            </button>
          )}
          {showAddNavigate && (
            <button
              onClick={() => { onAddNavigateTile?.(); setAddMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-4 text-base rounded-2xl hover:bg-surface-hover transition-colors"
            >
              <ArrowRightCircleIcon className="w-5 h-5 text-text-secondary" />
              <span className="text-foreground">Navigate to board</span>
            </button>
          )}
          {showAddAudio && (
            <button
              onClick={() => { onAddAudioTile?.(); setAddMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-4 text-base rounded-2xl hover:bg-surface-hover transition-colors"
            >
              <SpeakerWaveIcon className="w-5 h-5 text-text-secondary" />
              <span className="text-foreground">Recorded audio</span>
            </button>
          )}
        </div>
      </BottomSheet>

      {/* More-options bottom sheet */}
      <BottomSheet
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Board options"
        snapPoints={[35]}
        showHandle
        showCloseButton
      >
        <div className="p-2">
          {onEdit && (
            <button
              onClick={() => { onEdit(); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-4 text-base rounded-2xl hover:bg-surface-hover transition-colors"
            >
              {isEditMode ? (
                <>
                  <CheckIcon className="w-5 h-5 text-primary-500" />
                  <span className="text-primary-500 font-medium">Done Editing</span>
                </>
              ) : (
                <>
                  <PencilIcon className="w-5 h-5 text-text-secondary" />
                  <span className="text-foreground">Edit Phrases</span>
                </>
              )}
            </button>
          )}
          {onEditBoard && (
            <button
              onClick={() => { onEditBoard(); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-4 text-base rounded-2xl hover:bg-surface-hover transition-colors"
            >
              <PencilIcon className="w-5 h-5 text-text-secondary" />
              <span className="text-foreground">Edit Board</span>
            </button>
          )}
          {showExport && (
            <button
              onClick={() => { onExportOpenBoard?.(); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-4 text-base rounded-2xl hover:bg-surface-hover transition-colors"
            >
              <ArrowDownTrayIcon className="w-5 h-5 text-text-secondary" />
              <span className="text-foreground">Export Open Board</span>
            </button>
          )}
          {showExportAll && (
            <button
              onClick={() => { onExportAllOpenBoards?.(); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-4 text-base rounded-2xl hover:bg-surface-hover transition-colors"
            >
              <ArrowDownTrayIcon className="w-5 h-5 text-text-secondary" />
              <span className="text-foreground">Export All Boards (.obz)</span>
            </button>
          )}
          {showImport && (
            <button
              onClick={() => { onImportOpenBoard?.(); setMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-4 text-base rounded-2xl hover:bg-surface-hover transition-colors"
            >
              <ArrowUpTrayIcon className="w-5 h-5 text-text-secondary" />
              <span className="text-foreground">Import Open Board</span>
            </button>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
