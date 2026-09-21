'use client';
import { useEffect, useSyncExternalStore } from 'react';
import { useUser } from '@clerk/nextjs';
import { CustomTTS } from '@/lib/custom-tts';
const player = CustomTTS.getInstance();
const empty = { busy: false, blocked: false, error: '' };
export default function CustomVoiceFeedback() {
  const { user } = useUser();
  const state = useSyncExternalStore(player.subscribe, player.getSnapshot, () => empty);
  useEffect(() => { player.reset(); return () => player.reset(); }, [user?.id]);
  if (!state.error && !state.blocked) return null;
  return <aside className="fixed bottom-24 inset-x-4 z-[100] mx-auto max-w-lg rounded-xl border border-border bg-surface p-4 shadow-xl" aria-label="Custom voice playback">
    <p role="status">{state.error || 'Your speech is ready. Press Play to listen.'}</p>
    <div className="mt-3 flex gap-3">
      {state.blocked ? <><button type="button" className="rounded-lg border p-3 focus-visible:outline-2" onClick={player.retryPlayback}>Play</button><button type="button" className="rounded-lg border p-3" onClick={() => player.stop()}>Stop</button></> : <button type="button" className="rounded-lg border p-3" onClick={player.dismiss}>Dismiss</button>}
    </div>
  </aside>;
}
