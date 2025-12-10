'use client';

import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import CreateBoardModal from './CreateBoardModal';

interface CreateBoardButtonProps {
  communicatorId: string;
}

export default function CreateBoardButton({ communicatorId }: CreateBoardButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors"
      >
        <PlusIcon className="w-5 h-5" />
        Create Board
      </button>

      {isModalOpen && (
        <CreateBoardModal
          communicatorId={communicatorId}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
