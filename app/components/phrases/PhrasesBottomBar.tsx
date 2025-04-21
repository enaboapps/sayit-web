'use client'

import { Plus, Pencil } from 'lucide-react'

interface PhrasesBottomBarProps {
  onAddPhrase: () => void
  onAddBoard: () => void
  onEdit: () => void
  isEditMode: boolean
}

export default function PhrasesBottomBar({
  onAddPhrase,
  onAddBoard,
  onEdit,
  isEditMode,
}: PhrasesBottomBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div className="flex justify-around items-center px-4 py-3">
        <div 
          onClick={onAddBoard}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>New Board</span>
        </div>

        <div 
          onClick={onAddPhrase}
          className="flex items-center gap-2 text-blue-500 hover:text-blue-600 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          <span>New Phrase</span>
        </div>

        <div 
          onClick={onEdit}
          className={`flex items-center gap-2 cursor-pointer ${
            isEditMode ? 'text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Pencil className="w-5 h-5" />
          <span>{isEditMode ? 'Done' : 'Edit'}</span>
        </div>
      </div>
    </div>
  )
} 