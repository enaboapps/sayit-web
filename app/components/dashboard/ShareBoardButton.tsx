'use client';

import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import ShareBoardModal from './ShareBoardModal';

interface ShareBoardButtonProps {
  communicatorId: string;
}

export default function ShareBoardButton({ communicatorId }: ShareBoardButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors"
      >
        <PlusIcon className="w-5 h-5" />
        <span>Share Board</span>
      </button>

      {showModal && (
        <ShareBoardModal
          communicatorId={communicatorId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
