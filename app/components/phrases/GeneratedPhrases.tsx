import { Button } from '@/app/components/ui/Button';

interface GeneratedPhrasesProps {
  phrases: string[];
  onDeletePhrase: (index: number) => void;
  onDeleteAll: () => void;
}

export function GeneratedPhrases({ phrases, onDeletePhrase, onDeleteAll }: GeneratedPhrasesProps) {
  if (phrases.length === 0) return null;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 text-foreground">Generated Phrases</h2>
        <Button
          type="button"
          variant="outline"
          onClick={onDeleteAll}
          className="text-red-600  hover:text-red-700  hover:bg-red-50  transition-colors duration-200"
        >
          Delete All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {phrases.map((phrase, index) => (
          <div key={index}>
            <Phrase phrase={phrase} onDeletePhrase={() => onDeletePhrase(index)} />
          </div>
        ))}
      </div>
    </div>
  );
} 

function Phrase({ phrase, onDeletePhrase }: { phrase: string, onDeletePhrase: () => void }) {
  return (
    <div className="bg-white bg-surface p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-200 border border-gray-100 border-border">
      <div className="flex justify-between items-start gap-4">
        <p className="text-gray-800 text-foreground text-lg flex-grow">{phrase}</p>
        <Button
          type="button"
          variant="outline"
          onClick={onDeletePhrase}
          className="text-red-600  hover:text-red-700  hover:bg-red-50  transition-colors duration-200 shrink-0"
        >
          Delete
        </Button>
      </div>
    </div>
  );
} 