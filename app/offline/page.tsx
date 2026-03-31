'use client';

import { useState, useCallback } from 'react';
import { WifiIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import Composer from '@/app/components/Composer';
import { useTTS } from '@/lib/hooks/useTTS';
import { useLocalMessageHistory } from '@/lib/hooks/useLocalMessageHistory';

export default function OfflinePage() {
  const [text, setText] = useState('');
  const tts = useTTS();
  const { messages, recordMessage } = useLocalMessageHistory();

  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Offline indicator */}
      <div className="shrink-0 sticky top-0 z-40 border-b border-amber-900 bg-surface px-4 py-3 text-sm text-amber-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WifiIcon className="w-4 h-4 shrink-0" />
          <span>You&apos;re offline — text communication and browser speech still work.</span>
        </div>
        <button
          onClick={handleRetry}
          className="flex items-center gap-1.5 text-amber-300 hover:text-amber-100 transition-colors ml-4 shrink-0"
          aria-label="Retry connection"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Retry</span>
        </button>
      </div>

      {/* Composer */}
      <div className="flex-1 flex flex-col min-h-0">
        <Composer
          text={text}
          onChange={setText}
          onSpeak={(source = 'speak') => {
            if (!text.trim()) return;
            tts.speak(text);
            recordMessage({ text, source });
            if (source === 'speakAndClear') {
              setTimeout(() => setText(''), 100);
            }
          }}
          onMessageCompleted={recordMessage}
          onStop={tts.stop}
          isSpeaking={tts.isSpeaking}
          isAvailable={tts.isAvailable}
          enableTabs={true}
          enableFixText={false}
          enableLiveTyping={false}
          enableToneControl={false}
        />
      </div>

      {/* Recent messages */}
      {messages.length > 0 && (
        <div className="shrink-0 border-t border-border px-5 py-4">
          <p className="text-xs text-text-secondary mb-2">Recent on this device</p>
          <div className="flex flex-wrap gap-2">
            {messages.slice(0, 5).map((message) => (
              <button
                key={message.id}
                type="button"
                onClick={() => setText(message.text)}
                className="max-w-full rounded-full bg-surface-hover px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary-950 hover:text-primary-500"
              >
                {message.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
