'use client';

import { useRouter } from 'next/navigation';
import { Phrase } from '@/lib/models/Phrase';
import PhraseTile from './PhraseTile';

interface PhraseDataGridProps {
  phrases: Phrase[];
  boardId: string;
  isEditMode: boolean;
  isLoading?: boolean;
  onPhrasePress: (phrase: Phrase) => void;
  onEditPhrase: (phrase: Phrase) => void;
}

export default function PhraseDataGrid({ 
  phrases, 
  boardId, 
  isEditMode, 
  isLoading = false,
  onPhrasePress,
  onEditPhrase,
}: PhraseDataGridProps) {
  const router = useRouter();

  const handleAddPhrase = () => {
    router.push(`/phrases/add?boardId=${boardId}`);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 h-full">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (phrases.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-4">No phrases yet</h2>
          <p className="text-gray-600">Add your first phrase to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 h-full">
      {phrases.map((phrase) => (
        <PhraseTile
          key={phrase.id}
          phrase={phrase}
          onPress={() => onPhrasePress(phrase)}
          onEdit={isEditMode ? () => onEditPhrase(phrase) : undefined}
          className="aspect-square"
        />
      ))}
      {isEditMode && (
        <button
          onClick={handleAddPhrase}
          className="aspect-square flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 transition-colors duration-200"
          aria-label="Add new phrase"
        >
          <span className="text-gray-500 text-lg">+ Add Phrase</span>
        </button>
      )}
    </div>
  );
}
