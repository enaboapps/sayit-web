'use client';

import { useState } from 'react';
import { ChatBubbleBottomCenterTextIcon, WifiIcon } from '@heroicons/react/24/outline';
import Composer from '@/app/components/Composer';
import { MobileDockPortal } from '@/app/contexts/MobileBottomContext';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { useLocalMessageHistory } from '@/lib/hooks/useLocalMessageHistory';
import { useTTS } from '@/lib/hooks/useTTS';

export default function GuestCommunication() {
  const [text, setText] = useState('');
  const isMobile = useIsMobile();
  const tts = useTTS();
  const { messages, recordMessage } = useLocalMessageHistory();

  const handleRestoreMessage = (message: string) => {
    setText(message);
  };

  return (
    <section className="w-full max-w-5xl mx-auto px-4 pt-6 pb-4">
      <div className="rounded-3xl border border-border bg-surface shadow-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-border bg-surface-hover">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-surface flex items-center justify-center shrink-0">
              <ChatBubbleBottomCenterTextIcon className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Text Communication Works Offline</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Type and speak messages without signing in. Saved boards, AI tools, and cloud voice features still need internet.
              </p>
            </div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs text-text-secondary">
            <WifiIcon className="w-4 h-4" />
            <span>Drafts and tabs stay on this device.</span>
          </div>
        </div>

        {!isMobile && (
          <div className="p-4">
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
            />
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <div className="mt-4 rounded-3xl border border-border bg-surface px-5 py-4 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Recent on this device</h3>
              <p className="mt-1 text-xs text-text-secondary">
                Tap a recent message to bring it back into the typing area.
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {messages.slice(0, 5).map((message) => (
              <button
                key={message.id}
                type="button"
                onClick={() => handleRestoreMessage(message.text)}
                className="max-w-full rounded-full bg-surface-hover px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-primary-950 hover:text-primary-500"
              >
                {message.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {isMobile && (
        <MobileDockPortal>
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
          />
        </MobileDockPortal>
      )}
    </section>
  );
}
