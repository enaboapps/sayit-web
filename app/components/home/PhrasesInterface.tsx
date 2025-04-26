import { useRouter } from 'next/navigation';
import { Phrase } from '@/lib/models/Phrase';
import { PhraseBoard } from '@/lib/models/PhraseBoard';
import PhraseTile from '../phrases/PhraseTile';
import PhrasesBottomBar from '../phrases/PhrasesBottomBar';
import BoardCarousel from '../phrases/BoardCarousel';
import TypingArea from '../TypingArea';

interface PhrasesInterfaceProps {
  boards: PhraseBoard[];
  selectedBoard: PhraseBoard | null;
  phrases: Phrase[];
  loading: boolean;
  loadingPhrases: boolean;
  currentIndex: number;
  isEditMode: boolean;
  typingText: string;
  onPhrasePress: (phrase: Phrase) => void;
  onAddPhrase: () => void;
  onEditPhrase: (phrase: Phrase) => void;
  onNextBoard: () => void;
  onPrevBoard: () => void;
  onAddBoard: () => void;
  onEdit: () => void;
  onSelectBoard: (index: number) => void;
}

export default function PhrasesInterface({
  boards,
  selectedBoard,
  phrases,
  loading,
  loadingPhrases,
  currentIndex,
  isEditMode,
  typingText,
  onPhrasePress,
  onAddPhrase,
  onEditPhrase,
  onNextBoard,
  onPrevBoard,
  onAddBoard,
  onEdit,
  onSelectBoard,
}: PhrasesInterfaceProps) {
  const router = useRouter();

  return (
    <>
      <div className="flex-none">
        <TypingArea initialText={typingText} />
      </div>
      {boards.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-medium text-gray-900 mb-4">No boards yet</h2>
            <p className="text-gray-600 mb-6">Create your first board to start adding phrases</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          <div className="flex-none">
            <BoardCarousel
              boards={boards}
              selectedBoard={selectedBoard}
              currentIndex={currentIndex}
              isEditMode={isEditMode}
              phrasesCount={phrases.length}
              isLoadingPhrases={loadingPhrases}
              onPrevBoard={onPrevBoard}
              onNextBoard={onNextBoard}
              onSelectBoard={onSelectBoard}
              onEditBoard={(boardId) => router.push(`/phrases/boards/edit/${boardId}`)}
            />
          </div>

          <div className="flex-1 p-1 overflow-auto">
            {!loading && (
              <div className="flex flex-col h-full">
                <div className="flex-1 p-1 overflow-auto">
                  {loadingPhrases ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 h-full">
                      {[...Array(10)].map((_, i) => (
                        <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : phrases.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-8">
                      <div className="text-center">
                        <h2 className="text-xl font-medium text-gray-900 mb-4">No phrases yet</h2>
                        <p className="text-gray-600">Add your first phrase to get started</p>
                      </div>
                    </div>
                  ) : (
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
                          onClick={onAddPhrase}
                          className="aspect-square flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg border-2 border-dashed border-gray-300 transition-colors duration-200"
                          aria-label="Add new phrase"
                        >
                          <span className="text-gray-500 text-lg">+ Add Phrase</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <PhrasesBottomBar
        onAddPhrase={onAddPhrase}
        onAddBoard={onAddBoard}
        onEdit={onEdit}
        boardPresent={boards.length > 0}
        isEditMode={isEditMode}
      />
    </>
  );
} 