'use client';

import { useState } from 'react';
import { ChatBubbleBottomCenterTextIcon, WifiIcon } from '@heroicons/react/24/outline';
import TypingArea from '@/app/components/TypingArea';
import TypingDock from '@/app/components/TypingDock';
import { MobileDockPortal } from '@/app/contexts/MobileBottomContext';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { useTTS } from '@/lib/hooks/useTTS';

export default function GuestCommunication() {
  const [text, setText] = useState('');
  const isMobile = useIsMobile();
  const tts = useTTS();

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
            <TypingArea
              text={text}
              tts={tts}
              onChange={setText}
              enableFixText={false}
              enableLiveTyping={false}
            />
          </div>
        )}
      </div>

      {isMobile && (
        <MobileDockPortal>
          <TypingDock
            text={text}
            onChange={setText}
            onSpeak={(source = 'speak') => {
              if (!text.trim()) {
                return;
              }

              tts.speak(text);

              if (source === 'speakAndClear') {
                setTimeout(() => {
                  setText('');
                }, 100);
              }
            }}
            onStop={tts.stop}
            isSpeaking={tts.isSpeaking}
            isAvailable={tts.isAvailable}
            enableTabs={true}
            enableLiveTyping={false}
            enableFixText={false}
          />
        </MobileDockPortal>
      )}
    </section>
  );
}
