import type { Id } from '@/convex/_generated/dataModel';
import type { RecordedAudio } from '@/app/components/phrases/tiles/AudioRecorderControl';
import { isAllowedAudioMimeType } from './constants';

/**
 * POST a recording to a Convex storage upload URL and return the resulting
 * storageId.
 *
 * Throws if the recording's MIME type is not in the allow-list (mirrors
 * server-side `validateAudioMetadata` so the user gets a clear error before
 * the upload is attempted) or if the upload itself fails.
 */
export async function uploadRecording(
  uploadUrl: string,
  recording: RecordedAudio,
): Promise<Id<'_storage'>> {
  const contentType = recording.blob.type || '';
  if (!isAllowedAudioMimeType(contentType)) {
    throw new Error(
      'Your browser produced an audio format we don\'t support. Try a different browser.',
    );
  }

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body: recording.blob,
  });

  if (!response.ok) throw new Error('Failed to upload audio. Please try again.');
  const { storageId } = await response.json();
  return storageId as Id<'_storage'>;
}
