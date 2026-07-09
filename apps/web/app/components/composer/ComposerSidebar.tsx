'use client';

import { useRef, useState, type ReactNode } from 'react';
import {
  SparklesIcon,
  XMarkIcon,
  ArrowPathIcon,
  ShareIcon,
  BookmarkIcon,
  ClipboardIcon,
  LightBulbIcon,
  SpeakerWaveIcon,
  StopIcon,
  Squares2X2Icon,
} from '@heroicons/react/24/outline';
import { AudioWaveform } from 'lucide-react';
import SubscriptionWrapper from '../SubscriptionWrapper';
import ToneSheet, { type TonePreset } from '../typing/ToneSheet';
import BottomSheet from '../ui/BottomSheet';

interface ComposerSidebarProps {
  currentText: string;
  onClear: () => void;
  onSpeak: () => void;
  onStop?: () => void;
  onToneSelected: (tone: TonePreset) => void;
  isSpeaking: boolean;
  isAvailable: boolean;
  enableFixText: boolean;
  isOnline: boolean;
  isFixingText: boolean;
  onFixText: () => void;
  enableLiveTyping: boolean;
  isLiveTypingButtonActive: boolean;
  onShare: () => void;
  hasUser: boolean;
  onAddAsPhrase?: (text: string) => void;
  enableToneControl: boolean;
  suggestionsCount: number;
  onSuggestionsOpen: () => void;
  suggestionsEnabled: boolean;
  onCopyPasteOpen: () => void;
}

interface ActionItem {
  key: string;
  content: ReactNode;
}

const ACTION_BUTTON =
  'flex min-h-12 w-full items-center gap-3 rounded-[var(--radius-control)] border border-border px-4 py-3 text-left font-medium shadow-[var(--shadow-control)] transition-colors disabled:cursor-not-allowed disabled:opacity-40';

export default function ComposerSidebar({
  currentText,
  onClear,
  onSpeak,
  onStop,
  onToneSelected,
  isSpeaking,
  isAvailable,
  enableFixText,
  isOnline,
  isFixingText,
  onFixText,
  enableLiveTyping,
  isLiveTypingButtonActive,
  onShare,
  hasUser,
  onAddAsPhrase,
  enableToneControl,
  suggestionsCount,
  onSuggestionsOpen,
  suggestionsEnabled,
  onCopyPasteOpen,
}: ComposerSidebarProps) {
  const [showToneSheet, setShowToneSheet] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const actionsTriggerRef = useRef<HTMLButtonElement>(null);
  const speakDisabled = !isAvailable || !currentText.trim();
  const clearDisabled = !currentText.trim();

  const closeActions = () => {
    setShowActions(false);
    requestAnimationFrame(() => actionsTriggerRef.current?.focus());
  };

  const runAndClose = (action: () => void) => () => {
    closeActions();
    action();
  };

  const actionItems: ActionItem[] = [];

  if (enableFixText) {
    actionItems.push({
      key: 'fix',
      content: !isOnline ? (
        <button type="button" disabled className={`${ACTION_BUTTON} bg-surface-hover text-text-tertiary`} aria-label="Fix Text (offline)">
          <SparklesIcon className="h-5 w-5" />
          <span>Fix Text</span>
          <span className="ml-auto text-xs font-normal">Offline</span>
        </button>
      ) : (
        <SubscriptionWrapper
          fallback={
            <button onClick={runAndClose(() => { window.location.href = '/pricing'; })} className={`${ACTION_BUTTON} bg-status-warning text-amber-300`} aria-label="Fix Text (upgrade)">
              <SparklesIcon className="h-5 w-5" />
              <span>Fix Text</span>
              <span className="ml-auto text-xs font-normal">Pro</span>
            </button>
          }
        >
          <button onClick={runAndClose(onFixText)} disabled={!currentText.trim() || isFixingText} className={`${ACTION_BUTTON} bg-status-purple text-status-purple-foreground hover:brightness-95`} aria-label="Fix Text">
            {isFixingText ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <SparklesIcon className="h-5 w-5" />}
            <span>{isFixingText ? 'Fixing Text…' : 'Fix Text'}</span>
          </button>
        </SubscriptionWrapper>
      ),
    });
  }

  if (enableLiveTyping && hasUser) {
    actionItems.push({
      key: 'live',
      content: (
        <button
          onClick={runAndClose(onShare)}
          disabled={!isOnline}
          className={`${ACTION_BUTTON} ${isLiveTypingButtonActive ? 'bg-status-success text-status-success-foreground' : 'bg-surface-hover text-foreground hover:bg-status-success'}`}
          aria-label={isLiveTypingButtonActive ? 'Live Typing Active' : 'Live Typing'}
        >
          <ShareIcon className="h-5 w-5" />
          <span>Live Typing</span>
          {isLiveTypingButtonActive && <span className="ml-auto text-xs font-normal">Active</span>}
        </button>
      ),
    });
  }

  if (onAddAsPhrase) {
    actionItems.push({
      key: 'save',
      content: (
        <button onClick={runAndClose(() => onAddAsPhrase(currentText))} disabled={!currentText.trim()} className={`${ACTION_BUTTON} bg-status-info text-status-info-foreground hover:brightness-95`} aria-label="Save as Phrase">
          <BookmarkIcon className="h-5 w-5" />
          <span>Save as Phrase</span>
        </button>
      ),
    });
  }

  if (suggestionsEnabled) {
    actionItems.push({
      key: 'suggestions',
      content: (
        <button onClick={runAndClose(onSuggestionsOpen)} className={`${ACTION_BUTTON} bg-status-warning text-status-warning-foreground hover:brightness-95`} aria-label="Suggestions">
          <LightBulbIcon className="h-5 w-5" />
          <span>Suggestions</span>
          {suggestionsCount > 0 && <span className="ml-auto rounded-full bg-primary-500 px-2 py-0.5 text-xs text-white">{suggestionsCount}</span>}
        </button>
      ),
    });
  }

  actionItems.push({
    key: 'copy-paste',
    content: (
      <button onClick={runAndClose(onCopyPasteOpen)} className={`${ACTION_BUTTON} bg-surface-hover text-foreground hover:bg-surface`} aria-label="Copy and paste">
        <ClipboardIcon className="h-5 w-5" />
        <span>Copy and Paste</span>
      </button>
    ),
  });

  return (
    <>
      <button
        ref={actionsTriggerRef}
        type="button"
        onClick={() => setShowActions(true)}
        aria-haspopup="dialog"
        aria-expanded={showActions}
        aria-label="More actions"
        className="absolute right-4 top-4 z-20 flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] border border-border bg-surface px-3 text-sm font-medium text-text-secondary shadow-[var(--shadow-control)] transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
      >
        <Squares2X2Icon className="h-5 w-5" />
        <span className="hidden sm:inline">More Actions</span>
        {suggestionsEnabled && suggestionsCount > 0 && (
          <span className="rounded-full bg-primary-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{suggestionsCount}</span>
        )}
      </button>

      <div className="absolute bottom-4 right-4 z-20 flex items-end gap-3">
        {isSpeaking ? (
          <button type="button" onClick={onStop} className="flex h-16 min-w-16 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-error px-4 text-white shadow-[var(--shadow-card)] transition-colors hover:bg-error-hover" aria-label="Stop">
            <StopIcon className="h-7 w-7" />
            <span className="font-semibold">Stop</span>
          </button>
        ) : (
          <>
            <button type="button" onClick={onClear} disabled={clearDisabled} className="flex h-12 min-w-12 items-center justify-center rounded-[var(--radius-control)] border border-border bg-status-error text-status-error-foreground shadow-[var(--shadow-control)] transition-colors hover:bg-error hover:text-white disabled:cursor-not-allowed disabled:opacity-30" aria-label="Clear">
              <XMarkIcon className="h-6 w-6" />
            </button>
            {enableToneControl ? (
              <div className="flex overflow-hidden rounded-[var(--radius-control)] shadow-[var(--shadow-card)]">
                <button type="button" onClick={() => setShowToneSheet(true)} disabled={speakDisabled} className="flex h-16 w-12 items-center justify-center border-r border-primary-900/40 bg-primary-700 text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-30" aria-label="Choose tone">
                  <AudioWaveform className="h-5 w-5" />
                </button>
                <button type="button" onClick={onSpeak} disabled={speakDisabled} className="flex h-16 min-w-20 items-center justify-center gap-2 bg-primary-500 px-4 text-white transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-30" aria-label="Speak">
                  <SpeakerWaveIcon className="h-7 w-7" />
                  <span className="font-semibold">Speak</span>
                </button>
              </div>
            ) : (
              <button type="button" onClick={onSpeak} disabled={speakDisabled} className="flex h-16 min-w-20 items-center justify-center gap-2 rounded-[var(--radius-control)] bg-primary-500 px-4 text-white shadow-[var(--shadow-card)] transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-30" aria-label="Speak">
                <SpeakerWaveIcon className="h-7 w-7" />
                <span className="font-semibold">Speak</span>
              </button>
            )}
          </>
        )}
      </div>

      <BottomSheet isOpen={showActions} onClose={closeActions} title="More Actions" snapPoints={[55, 90]}>
        <div className="grid gap-3 p-4 sm:grid-cols-2" role="group" aria-label="Composer actions">
          {actionItems.map((item) => <div key={item.key}>{item.content}</div>)}
        </div>
      </BottomSheet>

      <ToneSheet
        isOpen={showToneSheet}
        onClose={() => setShowToneSheet(false)}
        onSelectTone={onToneSelected}
        onSpeakWithoutTone={() => {
          onSpeak();
          setShowToneSheet(false);
        }}
      />
    </>
  );
}
