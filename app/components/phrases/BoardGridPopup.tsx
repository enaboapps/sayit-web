import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';
import type { BoardSummary } from './types';

interface BoardGridPopupProps {
  boards: BoardSummary[];
  selectedBoard: BoardSummary | null;
  isEditMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSelectBoard: (board: BoardSummary) => void;
  onEditBoard: (boardId: string) => void;
}

export default function BoardGridPopup({
  boards,
  selectedBoard,
  isEditMode,
  isOpen,
  onClose,
  onSelectBoard,
  onEditBoard,
}: BoardGridPopupProps) {
  if (boards.length === 0) return null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl bg-black p-8 text-left align-middle shadow-2xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-2xl font-bold leading-6 text-white mb-6"
                >
                  Select a Board
                </Dialog.Title>

                <div className="grid grid-cols-2 gap-4">
                  {boards.map((board) => (
                    <div
                      key={board.id}
                      className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                        selectedBoard?.id === board.id
                          ? 'border-primary-500 bg-primary-500/20 shadow-lg'
                          : 'border-gray-700 hover:border-primary-300 hover:shadow-md'
                      }`}
                      onClick={() => {
                        onSelectBoard(board);
                        onClose();
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-white text-base">{board.name}</h4>
                        </div>
                        {isEditMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditBoard(board.id);
                            }}
                            className="p-2 hover:bg-gray-800 rounded-xl transition-all duration-200"
                          >
                            <PencilIcon className="h-4 w-4 text-gray-400 hover:text-white transition-colors duration-200" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
} 
