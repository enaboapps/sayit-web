'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import Input from '@/app/components/ui/Input';
import { Button } from '@/app/components/ui/Button';
import PageHeader from '@/app/components/ui/PageHeader';
import AudioRecorderControl, { RecordedAudio } from '@/app/components/phrases/tiles/AudioRecorderControl';
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus';

const MAX_LABEL_LENGTH = 80;

async function uploadRecording(uploadUrl: string, recording: RecordedAudio) {
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': recording.blob.type || 'audio/webm' },
    body: recording.blob,
  });

  if (!response.ok) throw new Error('Failed to upload audio. Please try again.');
  const { storageId } = await response.json();
  return storageId as Id<'_storage'>;
}

function EditAudioTileForm() {
  const router = useRouter();
  const params = useParams<{ boardId: string; tileId: string }>();
  const boardId = params?.boardId ?? null;
  const tileId = params?.tileId ?? null;
  const { isOnline } = useOnlineStatus();

  const [label, setLabel] = useState('');
  const [replacementRecording, setReplacementRecording] = useState<RecordedAudio | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const boardData = useQuery(
    api.phraseBoards.getPhraseBoard,
    boardId ? { id: boardId as Id<'phraseBoards'> } : 'skip'
  );
  const generateUploadUrl = useMutation(api.audio.generateUploadUrl);
  const updateAudioTile = useMutation(api.boardTiles.updateAudioTile);
  const deleteTile = useMutation(api.boardTiles.deleteTile);

  const existingTile = useMemo(() => {
    if (!boardData || !tileId) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tiles = (boardData.tiles ?? []) as any[];
    return tiles.find((tile) => String(tile._id) === tileId && tile.kind === 'audio') ?? null;
  }, [boardData, tileId]);

  useEffect(() => {
    if (existingTile && !label) {
      setLabel(existingTile.audioLabel ?? '');
    }
  }, [existingTile, label]);

  const trimmedLabel = label.trim();
  const labelError = trimmedLabel.length > MAX_LABEL_LENGTH
    ? `Label must be ${MAX_LABEL_LENGTH} characters or fewer`
    : undefined;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tileId || !existingTile || !trimmedLabel || labelError) return;

    setLoading(true);
    setError(null);
    try {
      if (replacementRecording) {
        const uploadUrl = await generateUploadUrl();
        const storageId = await uploadRecording(uploadUrl, replacementRecording);
        await updateAudioTile({
          tileId: tileId as Id<'boardTiles'>,
          audioLabel: trimmedLabel,
          audioStorageId: storageId,
          audioMimeType: replacementRecording.blob.type || 'audio/webm',
          audioDurationMs: replacementRecording.durationMs,
          audioByteSize: replacementRecording.blob.size,
        });
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
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!tileId) return;
    if (!confirm('Delete this audio tile?')) return;

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
                maxLength={MAX_LABEL_LENGTH}
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
              onClick={handleDelete}
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
