import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { PhraseBoard } from '@/lib/models/PhraseBoard';
import { PencilIcon } from '@heroicons/react/24/outline';

interface BoardGridPopupProps {
  boards: PhraseBoard[];
  selectedBoard: PhraseBoard | null;
  isEditMode: boolean;
  isLoadingPhrases?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSelectBoard: (board: PhraseBoard) => void;
  onEditBoard: (boardId: string) => void;
}

export default function BoardGridPopup({
  boards,
  selectedBoard,
  isEditMode,
  isLoadingPhrases = false,
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white bg-surface p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 text-foreground mb-4"
                >
                  Select a Board
                </Dialog.Title>

                <div className="grid grid-cols-2 gap-4">
                  {boards.map((board) => (
                    <div
                      key={board.id}
                      className={`relative p-4 rounded-lg border cursor-pointer transition-colors duration-200 ${
                        selectedBoard?.id === board.id
                          ? 'border-black bg-gray-50 bg-surface-hover/50'
                          : 'border-gray-200 border-border hover:border-gray-300 hover:border-border'
                      }`}
                      onClick={() => {
                        onSelectBoard(board);
                        onClose();
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 text-foreground">{board.name}</h4>
                          <p className="text-sm text-gray-500 text-text-secondary">
                            {isLoadingPhrases ? (
                              <span className="inline-block w-16 h-3 bg-gray-200 bg-surface-hover rounded animate-pulse" />
                            ) : board.phrases.length === 0 ? (
                              'Empty board'
                            ) : (
                              `${board.phrases.length} ${board.phrases.length === 1 ? 'phrase' : 'phrases'}`
                            )}
                          </p>
                        </div>
                        {isEditMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditBoard(board.id ?? '');
                            }}
                            className="p-1 hover:bg-gray-100 hover:bg-surface-hover/50 rounded-full transition-colors duration-200"
                          >
                            <PencilIcon className="h-4 w-4 text-gray-500 text-text-secondary" />
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