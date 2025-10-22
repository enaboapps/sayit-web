'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatBubbleLeftIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon, ArrowPathIcon, SparklesIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, ShareIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import FleshOutPopup from './flesh-out/FleshOutPopup';
import SubscriptionWrapper from './SubscriptionWrapper';
import { useTypingShare } from '@/lib/hooks/useTypingShare';
import ShareLinkModal from './typing-share/ShareLinkModal';

interface TypingAreaProps {
  initialText?: string
  tts: {
    speak: (text: string) => void;
    isSpeaking: boolean;
    isAvailable: boolean;
  }
  onChange?: (text: string) => void
}

export default function TypingArea({ initialText = '', tts, onChange }: TypingAreaProps) {
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string | null>(null);
  const [showFleshOutPopup, setShowFleshOutPopup] = useState(false);
  const [isFixingText, setIsFixingText] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { settings } = useSettings();
  const { user } = useAuth();
  const { speak, isSpeaking, isAvailable } = tts;
  const typingShare = useTypingShare();
  const shareableLink = typingShare.getShareableLink();
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('typingAreaVisible');
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('typingAreaExpanded');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  useEffect(() => {
    console.log('Current text size:', settings.textSize);
  }, [settings.textSize]);

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-lg',
    large: 'text-2xl',
    xlarge: 'text-4xl',
  };

  const currentTextSizeClass = textSizeClasses[settings.textSize];
  console.log('Applied text size class:', currentTextSizeClass);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  useEffect(() => {
    localStorage.setItem('typingAreaVisible', JSON.stringify(isVisible));
  }, [isVisible]);

  useEffect(() => {
    localStorage.setItem('typingAreaExpanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  // Update shared session content when text changes
  useEffect(() => {
    if (typingShare.isSharing) {
      typingShare.updateContent(text);
    }
  }, [text, typingShare.isSharing, typingShare.updateContent]);

  const handleShare = async () => {
    if (typingShare.isSharing) {
      setShowShareModal(true);
      return;
    }

    await typingShare.createSession();

    if (typingShare.isSharing) {
      typingShare.updateContent(text);
      setShowShareModal(true);
    }
  };

  const handleClear = () => {
    setText('');
    setError(null);
    onChange?.('');
    textareaRef.current?.focus();
  };

  const handleSpeak = () => {
    if (text.trim()) {
      speak(text);
      textareaRef.current?.focus();
    }
  };

  const handleFleshOut = () => {
    if (!text.trim()) return;
    setShowFleshOutPopup(true);
  };

  const handleApplyFleshedOutText = (newText: string) => {
    setText(newText);
    onChange?.(newText);
    setShowFleshOutPopup(false);
    textareaRef.current?.focus();
  };

  const handleFixText = async () => {
    if (!text.trim() || isFixingText) return;
    
    setIsFixingText(true);
    setError(null);
    
    try {
      const response = await fetch('/api/fix-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.text && data.text !== text) {
        setText(data.text);
        onChange?.(data.text);
      }
    } catch (error) {
      console.error('Error fixing text:', error);
      setError(error instanceof Error ? error.message : 'Failed to fix text');
    } finally {
      setIsFixingText(false);
      textareaRef.current?.focus();
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const textareaHeight = isExpanded ? '30rem' : '10rem';

  return (
    <div className="flex flex-col">
      {isVisible && (
        <div className="flex flex-col bg-surface shadow-lg border border-border overflow-hidden transition-colors duration-200">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              className={`w-full bg-transparent text-foreground ${currentTextSizeClass} placeholder:text-text-tertiary focus:outline-none focus:ring-0 resize-none p-6 overflow-auto transition-all duration-300`}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                onChange?.(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  switch (settings.enterKeyBehavior) {
                  case 'speak':
                    handleSpeak();
                    break;
                  case 'clear':
                    handleClear();
                    break;
                  case 'speakAndClear':
                    if (text.trim()) {
                      speak(text);
                      setTimeout(() => handleClear(), 100);
                    }
                    break;
                  case 'newline':
                  default:
                    setText(prev => prev + '\n');
                    onChange?.(text + '\n');
                    break;
                  }
                }
              }}
              placeholder="Type your message here..."
              style={{
                minHeight: textareaHeight,
                maxHeight: textareaHeight,
                lineHeight: '1.5',
              }}
            />
            {error && (
              <div className="absolute bottom-0 left-0 right-0 bg-red-50 text-red-700 p-3 text-sm border-t border-red-100 transition-colors duration-200">
                {error}
              </div>
            )}
          </div>
          {text.trim() && (
            <div className="grid grid-cols-2 gap-[1px] bg-background border-t border-border transition-colors duration-200">
              <button
                onClick={handleSpeak}
                className={`h-14 transition-colors duration-200 ${
                  isSpeaking
                    ? 'bg-primary-500 hover:bg-primary-600 text-white'
                    : 'bg-surface hover:bg-surface-hover text-text-secondary'
                }`}
                data-tooltip-id="speak-tooltip"
                data-tooltip-content={isSpeaking ? 'Stop speaking' : 'Speak text'}
                disabled={!isAvailable || !text.trim()}
              >
                <div className="flex items-center justify-center gap-2">
                  <ChatBubbleLeftIcon className="w-5 h-5" />
                  <span>Speak</span>
                </div>
              </button>
              <button
                onClick={handleFleshOut}
                className="h-14 bg-surface hover:bg-surface-hover text-text-secondary transition-colors duration-200"
                data-tooltip-id="flesh-out-tooltip"
                data-tooltip-content="Flesh out with AI"
                disabled={!text.trim()}
              >
                <div className="flex items-center justify-center gap-2">
                  <ArrowPathIcon className="w-5 h-5" />
                  <span>Flesh Out</span>
                </div>
              </button>
              <SubscriptionWrapper
                fallback={
                  <button
                    onClick={() => window.location.href = '/pricing'}
                    className="h-14 bg-surface hover:bg-surface-hover text-text-secondary transition-colors duration-200"
                    data-tooltip-id="fix-text-tooltip"
                    data-tooltip-content="Fix Text (Pro feature)"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <SparklesIcon className="w-5 h-5" />
                      <span>Fix Text</span>
                    </div>
                  </button>
                }
              >
                <button
                  onClick={handleFixText}
                  className={`h-14 transition-colors duration-200 ${
                    isFixingText
                      ? 'bg-purple-500 hover:bg-purple-600 text-white'
                      : 'bg-surface hover:bg-surface-hover text-text-secondary'
                  }`}
                  data-tooltip-id="fix-text-tooltip"
                  data-tooltip-content="Fix grammar and spelling"
                  disabled={!text.trim() || isFixingText}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isFixingText ? (
                      <>
                        <ArrowPathIcon className="w-5 h-5 animate-spin" />
                        <span>Fixing...</span>
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-5 h-5" />
                        <span>Fix Text</span>
                      </>
                    )}
                  </div>
                </button>
              </SubscriptionWrapper>
              <button
                onClick={handleClear}
                className="h-14 bg-surface hover:bg-surface-hover text-text-secondary transition-colors duration-200"
                data-tooltip-id="clear-tooltip"
                data-tooltip-content="Clear"
              >
                <div className="flex items-center justify-center gap-2">
                  <XMarkIcon className="w-5 h-5" />
                  <span>Clear</span>
                </div>
              </button>
            </div>
          )}
          {user && (
            <div className="border-t border-border transition-colors duration-200">
              <button
                onClick={handleShare}
                className={`h-14 w-full transition-colors duration-200 ${
                  typingShare.isSharing
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-surface hover:bg-surface-hover text-text-secondary'
                }`}
                data-tooltip-id="share-tooltip"
                data-tooltip-content={typingShare.isSharing ? 'View share link' : 'Share your typing'}
                disabled={typingShare.isCreating}
              >
                <div className="flex items-center justify-center gap-2">
                  {typingShare.isCreating ? (
                    <>
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <ShareIcon className="w-5 h-5" />
                      <span>{typingShare.isSharing ? 'Sharing Active' : 'Share'}</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          )}
        </div>
      )}
      <div className="flex">
        {isVisible && (
          <button
            onClick={toggleExpanded}
            className="h-10 flex-1 bg-surface hover:bg-surface-hover text-text-secondary transition-colors duration-200 flex items-center justify-center shadow-sm border border-t-0 border-r-0 border-border"
            data-tooltip-id="expand-tooltip"
            data-tooltip-content={isExpanded ? 'Collapse typing area' : 'Expand typing area'}
          >
            {isExpanded ? (
              <ArrowsPointingInIcon className="w-4 h-4" />
            ) : (
              <ArrowsPointingOutIcon className="w-4 h-4" />
            )}
          </button>
        )}
        <button
          onClick={toggleVisibility}
          className={`h-10 bg-surface hover:bg-surface-hover text-text-secondary transition-colors duration-200 flex items-center justify-center shadow-sm border border-t-0 border-border ${isVisible ? 'flex-1' : 'w-full'}`}
          data-tooltip-id="toggle-tooltip"
          data-tooltip-content={isVisible ? 'Hide typing area' : 'Show typing area'}
        >
          {isVisible ? (
            <ChevronUpIcon className="w-5 h-5" />
          ) : (
            <ChevronDownIcon className="w-5 h-5" />
          )}
        </button>
      </div>
      <Tooltip id="speak-tooltip" />
      <Tooltip id="flesh-out-tooltip" />
      <Tooltip id="fix-text-tooltip" />
      <Tooltip id="clear-tooltip" />
      <Tooltip id="expand-tooltip" />
      <Tooltip id="toggle-tooltip" />
      <Tooltip id="share-tooltip" />

      {showFleshOutPopup && (
        <FleshOutPopup
          initialText={text}
          onClose={() => setShowFleshOutPopup(false)}
          onApply={handleApplyFleshedOutText}
        />
      )}

      {showShareModal && shareableLink && (
        <ShareLinkModal
          shareableLink={shareableLink}
          onClose={() => setShowShareModal(false)}
          onEndSession={async () => {
            await typingShare.endSession();
            setShowShareModal(false);
          }}
        />
      )}
    </div>
  );
}
