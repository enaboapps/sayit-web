'use client';

import { Suspense, useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import BackButton from '@/app/components/ui/BackButton';
import BottomSheet from '@/app/components/ui/BottomSheet';
import { ChevronDownIcon, UserGroupIcon, CheckIcon } from '@heroicons/react/24/outline';

function AddPhraseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const boardIdFromUrl = searchParams.get('boardId');
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(boardIdFromUrl);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBoardPickerOpen, setIsBoardPickerOpen] = useState(false);

  // Fetch all boards
  const boards = useQuery(api.phraseBoards.getPhraseBoards);

  // Use selected board or fallback to URL param
  const boardId = selectedBoardId || boardIdFromUrl;

  // Convex mutations
  const addPhrase = useMutation(api.phrases.addPhrase);
  const addPhraseToBoard = useMutation(api.phraseBoards.addPhraseToBoard);

  // Fetch board to check for duplicate phrases
  const boardData = useQuery(
    api.phraseBoards.getPhraseBoard,
    boardId ? { id: boardId as Id<'phraseBoards'> } : 'skip'
  );

  // Check if phrase text already exists on the board
  const isDuplicate = useMemo(() => {
    if (!boardData || !text.trim()) return false;
    return boardData.phrase_board_phrases?.some(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pbp: any) => pbp.phrase?.text === text.trim()
    );
  }, [boardData, text]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardId) return;

    setLoading(true);
    try {
      // Create the phrase
      const phraseId = await addPhrase({
        text,
        frequency: 0,
        position: 0, // Will be adjusted by backend based on board
      });

      // Add it to the board
      await addPhraseToBoard({
        phraseId: phraseId as Id<'phrases'>,
        boardId: boardId as Id<'phraseBoards'>,
      });

      router.back();
    } catch (error) {
      console.error('Error adding phrase:', error);
      setError('Failed to add phrase');
    } finally {
      setLoading(false);
    }
  };

  // Get selected board details
  const selectedBoard = boards?.find(b => b._id === boardId);

  const handleSelectBoard = (id: string) => {
    setSelectedBoardId(id);
    setIsBoardPickerOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <BackButton />
        <h1 className="text-3xl font-bold text-foreground mt-4">Add New Phrase</h1>

        <form onSubmit={handleSubmit} className="bg-surface shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-3xl p-8 mt-6">
          {/* Board Picker Button */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Add to Board
            </label>
            {boards === undefined ? (
              <div className="text-text-tertiary">Loading boards...</div>
            ) : boards.length === 0 ? (
              <div className="text-amber-600 bg-amber-500/10 px-4 py-3 rounded-2xl">
                No boards available. Create a board first.
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsBoardPickerOpen(true)}
                className="w-full flex items-center justify-between bg-surface-hover text-foreground rounded-2xl px-4 py-4 border border-border focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
              >
                <div className="flex flex-col items-start">
                  <span className={selectedBoard ? 'font-medium' : 'text-text-tertiary'}>
                    {selectedBoard?.name || 'Select a board'}
                  </span>
                  {selectedBoard && (
                    <span className="text-xs text-text-tertiary mt-0.5">
                      {selectedBoard.isShared && selectedBoard.sharedBy && `Shared by ${selectedBoard.sharedBy}`}
                      {selectedBoard.isOwner && selectedBoard.forClientName && `For ${selectedBoard.forClientName}`}
                    </span>
                  )}
                </div>
                <ChevronDownIcon className="w-5 h-5 text-text-tertiary" />
              </button>
            )}
          </div>

          <Input
            id="text"
            type="text"
            label="Phrase Text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter your phrase"
            required
          />

          {error && (
            <div className="mb-4 text-red-500 text-sm bg-red-500/10 px-4 py-3 rounded-3xl">
              {error}
            </div>
          )}

          {isDuplicate && (
            <div className="mb-4 text-amber-600 text-sm bg-amber-500/10 px-4 py-3 rounded-3xl">
              This phrase already exists on the board
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading || isDuplicate || !text.trim() || !boardId}
            >
              {loading ? 'Adding...' : 'Add Phrase'}
            </Button>
          </div>
        </form>
      </div>

      {/* Board Picker Bottom Sheet */}
      <BottomSheet
        isOpen={isBoardPickerOpen}
        onClose={() => setIsBoardPickerOpen(false)}
        title="Select Board"
        snapPoints={[50, 80]}
      >
        <div className="p-4 space-y-2">
          {boards?.map((board) => {
            const isSelected = board._id === boardId;
            const canEdit = !board.isShared || board.accessLevel === 'edit';

            return (
              <button
                key={board._id}
                onClick={() => canEdit && handleSelectBoard(board._id)}
                disabled={!canEdit}
                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                  isSelected
                    ? 'bg-primary-500/10 border-2 border-primary-500'
                    : canEdit
                    ? 'bg-surface-hover hover:bg-surface border-2 border-transparent'
                    : 'bg-surface-hover/50 border-2 border-transparent opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium text-foreground">{board.name}</span>
                  {board.isShared && board.sharedBy && (
                    <div className="flex items-center gap-1 mt-1">
                      <UserGroupIcon className="w-3 h-3 text-primary-400" />
                      <span className="text-xs text-primary-400">Shared by {board.sharedBy}</span>
                    </div>
                  )}
                  {board.isOwner && board.forClientName && (
                    <div className="flex items-center gap-1 mt-1">
                      <UserGroupIcon className="w-3 h-3 text-blue-400" />
                      <span className="text-xs text-blue-400">For {board.forClientName}</span>
                    </div>
                  )}
                  {!canEdit && (
                    <span className="text-xs text-text-tertiary mt-1">View only</span>
                  )}
                </div>
                {isSelected && (
                  <CheckIcon className="w-5 h-5 text-primary-500" />
                )}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
}

export default function AddPhrasePage() {
  return (
    <Suspense fallback={<div className="text-foreground">Loading...</div>}>
      <AddPhraseForm />
    </Suspense>
  );
}
