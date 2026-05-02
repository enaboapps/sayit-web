'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import type { FunctionReturnType } from 'convex/server';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import PageHeader from '@/app/components/ui/PageHeader';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import AudioRecorderControl, { RecordedAudio } from '@/app/components/phrases/tiles/AudioRecorderControl';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';
import { MAX_AUDIO_LABEL_LENGTH } from '@/lib/audio/constants';
import { uploadRecording } from '@/lib/audio/upload';

type BoardData = NonNullable<FunctionReturnType<typeof api.phraseBoards.getPhraseBoard>>;
type BoardTile = BoardData['tiles'][number];
type AudioBoardTile = Extract<BoardTile, { kind: 'audio' }>;

function EditAudioTileForm() {
  const router = useRouter();
  const params = useParams<{ boardId: string; tileId: string }>();
  const boardId = params?.boardId ?? null;
  const tileId = params?.tileId ?? null;
  const { isOnline } = useOnlineStatus();

  const [label, setLabel] = useState('');
  const [replacementRecording, setReplacementRecording] = useState<RecordedAudio | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Prefill the label exactly once when the tile loads. Using a ref (not the
  // current label value) avoids the footgun where clearing the input would
  // restore the original on the next re-render.
  const labelInitialisedRef = useRef(false);

  const boardData = useQuery(
    api.phraseBoards.getPhraseBoard,
    boardId ? { id: boardId as Id<'phraseBoards'> } : 'skip'
  );
  const generateUploadUrl = useMutation(api.audio.generateUploadUrl);
  const deleteOrphanUpload = useMutation(api.audio.deleteOrphanUpload);
  const updateAudioTile = useMutation(api.boardTiles.updateAudioTile);
  const deleteTile = useMutation(api.boardTiles.deleteTile);

  const existingTile = useMemo<AudioBoardTile | null>(() => {
    if (!boardData || !tileId) return null;
    const tiles = (boardData.tiles ?? []) as BoardTile[];
    const match = tiles.find(
      (tile): tile is AudioBoardTile =>
        String(tile._id) === tileId && tile.kind === 'audio'
    );
    return match ?? null;
  }, [boardData, tileId]);

  useEffect(() => {
    if (existingTile && !labelInitialisedRef.current) {
      setLabel(existingTile.audioLabel ?? '');
      labelInitialisedRef.current = true;
    }
  }, [existingTile]);

  const trimmedLabel = label.trim();
  const labelError = trimmedLabel.length > MAX_AUDIO_LABEL_LENGTH
    ? `Label must be ${MAX_AUDIO_LABEL_LENGTH} characters or fewer`
    : undefined;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!boardId || !tileId || !existingTile || !trimmedLabel || labelError) return;

    setLoading(true);
    setError(null);
    const typedBoardId = boardId as Id<'phraseBoards'>;
    let uploadedStorageId: Id<'_storage'> | null = null;
    try {
      if (replacementRecording) {
        const uploadUrl = await generateUploadUrl({ boardId: typedBoardId });
        uploadedStorageId = await uploadRecording(uploadUrl, replacementRecording);
        await updateAudioTile({
          tileId: tileId as Id<'boardTiles'>,
          audioLabel: trimmedLabel,
          audioStorageId: uploadedStorageId,
          audioMimeType: replacementRecording.blob.type || 'audio/webm',
          audioDurationMs: replacementRecording.durationMs,
          audioByteSize: replacementRecording.blob.size,
        });
        uploadedStorageId = null;
      } else {
        await updateAudioTile({
          tileId: tileId as Id<'boardTiles'>,
          audioLabel: trimmedLabel,
        });
      }
      router.back();
    } catch (err) {
      console.error('Error updating audio tile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update audio tile.');
      if (uploadedStorageId) {
        try {
          await deleteOrphanUpload({ boardId: typedBoardId, storageId: uploadedStorageId });
        } catch (cleanupErr) {
          console.error('Failed to clean up orphaned upload:', cleanupErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tileId) return;

    setDeleting(true);
    setError(null);
    try {
      await deleteTile({ tileId: tileId as Id<'boardTiles'> });
      router.back();
    } catch (err) {
      console.error('Error deleting audio tile:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete audio tile.');
    } finally {
      setDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Edit Audio Tile" backHref="/" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        <form
          onSubmit={handleSubmit}
          className="bg-surface shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-3xl p-8"
        >
          {!isOnline && (
            <div className="mb-4 text-amber-600 text-sm bg-status-warning px-4 py-3 rounded-3xl">
              Audio tiles need an internet connection.
            </div>
          )}

          {boardData === undefined ? (
            <div className="text-text-tertiary">Loading...</div>
          ) : !existingTile ? (
            <div className="mb-4 text-amber-600 bg-status-warning px-4 py-3 rounded-2xl">
              Tile not found. It may have been deleted.
            </div>
          ) : (
            <>
              <Input
                id="audioLabel"
                label="Tile Label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Tile label"
                maxLength={MAX_AUDIO_LABEL_LENGTH}
                required
                error={labelError}
              />

              {existingTile.audioUrl && (
                <div className="mb-4">
                  <label className="block text-foreground text-sm font-semibold mb-2">
                    Current Audio
                  </label>
                  <audio controls src={existingTile.audioUrl} className="w-full" />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-foreground text-sm font-semibold mb-2">
                  Replacement Audio
                </label>
                <AudioRecorderControl value={replacementRecording} onChange={setReplacementRecording} />
              </div>
            </>
          )}

          {error && (
            <div className="mb-4 text-red-500 text-sm bg-status-error px-4 py-3 rounded-3xl">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={deleting || !isOnline || !existingTile}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
            <Button
              type="submit"
              disabled={loading || !isOnline || !existingTile || !trimmedLabel || !!labelError}
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Audio Tile"
        description={`Delete "${existingTile?.audioLabel ?? 'this audio tile'}"? This removes the audio tile and its recording from this board.`}
        confirmLabel="Delete Tile"
        isBusy={deleting}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function EditAudioTilePage() {
  return (
    <Suspense fallback={<div className="text-foreground">Loading...</div>}>
      <EditAudioTileForm />
    </Suspense>
  );
}
