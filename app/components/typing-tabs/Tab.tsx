'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { TypingTab } from '@/app/types/typing-tabs';

interface TabProps {
  tab: TypingTab;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
  onRename: (newLabel: string) => void;
}

export default function Tab({ tab, isActive, onSelect, onClose, onRename }: TabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(tab.label);

  // Sync editLabel with tab.label when not editing
  useEffect(() => {
    if (!isEditing) {
      setEditLabel(tab.label);
    }
  }, [tab.label, isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditLabel(tab.label);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editLabel.trim() && editLabel !== tab.label) {
      onRename(editLabel);
    } else {
      setEditLabel(tab.label);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditLabel(tab.label);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <div
      className={`
        flex items-center gap-2 px-4 py-2 rounded-2xl cursor-pointer
        whitespace-nowrap transition-all duration-200 group
        ${
          isActive
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
            : 'bg-surface hover:bg-surface-hover text-text-secondary hover:text-foreground'
        }
      `}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          type="text"
          value={editLabel}
          onChange={(e) => setEditLabel(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-transparent outline-none border-b border-current w-24 text-sm"
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="text-sm font-medium select-none">{tab.label}</span>
      )}

      <button
        onClick={handleClose}
        className={`
          p-0.5 rounded-full transition-opacity
          ${isActive ? 'opacity-100 hover:bg-white/20' : 'opacity-0 group-hover:opacity-100 hover:bg-surface'}
        `}
        aria-label={`Close ${tab.label}`}
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
