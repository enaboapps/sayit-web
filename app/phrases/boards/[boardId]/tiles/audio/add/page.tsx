'use client';

import { Suspense, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
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

function AddAudioTileForm() {
  const router = useRouter();
  const params = useParams<{ boardId: string }>();
  const boardId = params?.boardId ?? null;
  const { isOnline } = useOnlineStatus();

  const [label, setLabel] = useState('');
  const [recording, setRecording] = useState<RecordedAudio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateUploadUrl = useMutation(api.audio.generateUploadUrl);
  const addAudioTile = useMutation(api.boardTiles.addAudioTile);

  const trimmedLabel = label.trim();
  const labelError = trimmedLabel.length > MAX_LABEL_LENGTH
    ? `Label must be ${MAX_LABEL_LENGTH} characters or fewer`
    : undefined;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!boardId || !recording || !trimmedLabel || labelError) return;

    setLoading(true);
    setError(null);
    try {
      const uploadUrl = await generateUploadUrl();
      const storageId = await uploadRecording(uploadUrl, recording);
      await addAudioTile({
        boardId: boardId as Id<'phraseBoards'>,
        audioLabel: trimmedLabel,
        audioStorageId: storageId,
        audioMimeType: recording.blob.type || 'audio/webm',
        audioDurationMs: recording.durationMs,
        audioByteSize: recording.blob.size,
      });
      router.back();
    } catch (err) {
      console.error('Error adding audio tile:', err);
      setError(err instanceof Error ? err.message : 'Failed to add audio tile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="Add Audio Tile" backHref="/" />
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

          <div className="mb-4">
            <label className="block text-foreground text-sm font-semibold mb-2">
              Audio
            </label>
            <AudioRecorderControl value={recording} onChange={setRecording} />
          </div>

          {error && (
            <div className="mb-4 text-red-500 text-sm bg-status-error px-4 py-3 rounded-3xl">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading || !isOnline || !trimmedLabel || !!labelError || !recording}
            >
              {loading ? 'Adding...' : 'Add Audio Tile'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AddAudioTilePage() {
  return (
    <Suspense fallback={<div className="text-foreground">Loading...</div>}>
      <AddAudioTileForm />
    </Suspense>
  );
}
