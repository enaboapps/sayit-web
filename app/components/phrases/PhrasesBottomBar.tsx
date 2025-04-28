'use client';

import { Plus, Pencil, MessageSquare, Check } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

interface PhrasesBottomBarProps {
  onAddPhrase: () => void
  onAddBoard: () => void
  onEdit: () => void
  boardPresent: boolean
  isEditMode: boolean
}

export default function PhrasesBottomBar({
  onAddPhrase,
  onAddBoard,
  onEdit,
  boardPresent,
  isEditMode,
}: PhrasesBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-sm">
      <div className="flex justify-around items-center px-6 py-4">
        <div
          onClick={onAddBoard}
          className="flex flex-col items-center gap-1 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors duration-200"
          data-tooltip-id="new-board-tooltip"
          data-tooltip-content="Create a new board to organize your phrases"
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs font-medium">New Board</span>
        </div>

        {boardPresent && (
          <div
            onClick={onAddPhrase}
            className="flex flex-col items-center gap-1 text-gray-600 hover:text-gray-900 cursor-pointer transition-colors duration-200"
            data-tooltip-id="add-phrase-tooltip"
            data-tooltip-content="Add a new phrase to the current board"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs font-medium">Add to Board</span>
          </div>
        )}

        <div
          onClick={onEdit}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-colors duration-200 ${
            isEditMode ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
          data-tooltip-id="edit-tooltip"
          data-tooltip-content={isEditMode ? 'Finish editing the board' : 'Edit the current board'}
        >
          {isEditMode ? (
            <Check className="w-5 h-5" />
          ) : (
            <Pencil className="w-5 h-5" />
          )}
          <span className="text-xs font-medium">{isEditMode ? 'Done' : 'Edit'}</span>
        </div>

        <Tooltip id="new-board-tooltip" place="top" />
        <Tooltip id="add-phrase-tooltip" place="top" />
        <Tooltip id="edit-tooltip" place="top" />
      </div>
    </div>
  );
}
