import { Button } from '@/app/components/ui/Button';

interface Category {
  name: string;
  phrases: string[];
}

interface GeneratedPhrasesProps {
  phrases: Category[];
  onDeletePhrase: (categoryIndex: number, phraseIndex: number) => void;
  onDeleteAll: () => void;
}

export function GeneratedPhrases({ phrases, onDeletePhrase, onDeleteAll }: GeneratedPhrasesProps) {
  if (phrases.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Generated Phrases</h2>
        <Button
          type="button"
          variant="outline"
          onClick={onDeleteAll}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Delete All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {phrases.map((category, categoryIndex) => (
          <div key={categoryIndex} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2 mb-3">
              {category.name}
            </h3>
            <div className="space-y-2">
              {category.phrases.map((phrase, phraseIndex) => (
                <div
                  key={phraseIndex}
                  className="group relative p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <p className="text-gray-800 leading-relaxed pr-8">{phrase}</p>
                  <button
                    type="button"
                    onClick={() => onDeletePhrase(categoryIndex, phraseIndex)}
                    className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete phrase"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 