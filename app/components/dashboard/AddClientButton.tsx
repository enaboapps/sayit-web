'use client';

import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import AddClientModal from './AddClientModal';

export default function AddClientButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full p-4 rounded-xl border-2 border-dashed border-border hover:border-primary-700 bg-surface hover:bg-surface-hover transition-all flex items-center justify-center gap-2 text-text-secondary hover:text-primary-500"
      >
        <PlusIcon className="w-5 h-5" />
        <span className="font-medium">Add Client</span>
      </button>

      {showModal && <AddClientModal onClose={() => setShowModal(false)} />}
    </>
  );
}
