'use client';

import { Plus, Pencil, MessageSquare, Check, Menu, X } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import { useState, useRef, useEffect } from 'react';

interface PhrasesActionMenuProps {
  onAddPhrase: () => void
  onAddBoard: () => void
  onEdit: () => void
  boardPresent: boolean
  isEditMode: boolean
}

export default function PhrasesActionMenu({
  onAddPhrase,
  onAddBoard,
  onEdit,
  boardPresent,
  isEditMode,
}: PhrasesActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="fixed bottom-6 right-6 z-50">
      {/* Action Menu Items */}
      <div className={`
        absolute bottom-16 right-0 flex flex-col gap-3 transition-all duration-300 ease-in-out
        ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}>
        {/* New Board Action */}
        <div
          onClick={() => handleAction(onAddBoard)}
          className="flex items-center gap-3 bg-white dark:bg-gray-800 shadow-lg rounded-full px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 border border-gray-200 dark:border-gray-600"
          data-tooltip-id="new-board-tooltip"
          data-tooltip-content="Create a new board to organize your phrases"
        >
          <Plus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">New Board</span>
        </div>

        {/* Add to Board Action - Only show when board is present */}
        {boardPresent && (
          <div
            onClick={() => handleAction(onAddPhrase)}
            className="flex items-center gap-3 bg-white dark:bg-gray-800 shadow-lg rounded-full px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 border border-gray-200 dark:border-gray-600"
            data-tooltip-id="add-phrase-tooltip"
            data-tooltip-content="Add a new phrase to the current board"
          >
            <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">Add to Board</span>
          </div>
        )}

        {/* Edit/Done Action */}
        <div
          onClick={() => handleAction(onEdit)}
          className={`flex items-center gap-3 shadow-lg rounded-full px-4 py-3 cursor-pointer transition-all duration-200 border ${
            isEditMode 
              ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500' 
              : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600'
          }`}
          data-tooltip-id="edit-tooltip"
          data-tooltip-content={isEditMode ? 'Finish editing the board' : 'Edit the current board'}
        >
          {isEditMode ? (
            <Check className="w-5 h-5" />
          ) : (
            <Pencil className={`w-5 h-5 ${isEditMode ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
          )}
          <span className={`text-sm font-medium whitespace-nowrap ${isEditMode ? 'text-white' : 'text-gray-800 dark:text-gray-200'}`}>
            {isEditMode ? 'Done' : 'Edit'}
          </span>
        </div>
      </div>

      {/* Main Action Button */}
      <button
        onClick={toggleMenu}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ease-in-out ${
          isOpen 
            ? 'bg-gray-600 hover:bg-gray-700 text-white rotate-45' 
            : 'bg-gray-800 hover:bg-gray-900 text-white hover:scale-105'
        }`}
        data-tooltip-id="main-action-tooltip"
        data-tooltip-content={isOpen ? 'Close menu' : 'Open actions menu'}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Tooltips */}
      <Tooltip id="new-board-tooltip" place="left" />
      <Tooltip id="add-phrase-tooltip" place="left" />
      <Tooltip id="edit-tooltip" place="left" />
      <Tooltip id="main-action-tooltip" place="left" />
    </div>
  );
}