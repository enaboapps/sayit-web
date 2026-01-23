'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SpeakerWaveIcon,
  SparklesIcon,
  XMarkIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { useSettings } from '../contexts/SettingsContext';

interface TypingDockProps {
  text: string;
  onChange: (text: string) => void;
  onSpeak: () => void;
  onAiAssist?: () => void;
  isSpeaking?: boolean;
  isAvailable?: boolean;
  className?: string;
}

export default function TypingDock({
  text,
  onChange,
  onSpeak,
  onAiAssist,
  isSpeaking = false,
  isAvailable = true,
  className = '',
}: TypingDockProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { settings } = useSettings();

  // Character count
  const charCount = text.length;
  const maxChars = 500;

  // Auto-expand when text gets long
  useEffect(() => {
    if (text.length > 50 && !isExpanded) {
      setIsExpanded(true);
    }
  }, [text, isExpanded]);

  // Handle Enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        switch (settings.enterKeyBehavior) {
          case 'speak':
            if (text.trim()) onSpeak();
            break;
          case 'clear':
            onChange('');
            break;
          case 'speakAndClear':
            if (text.trim()) {
              onSpeak();
              setTimeout(() => onChange(''), 100);
            }
            break;
          case 'newline':
          default:
            if (isExpanded) {
              onChange(text + '\n');
            } else {
              // In compact mode, enter speaks
              if (text.trim()) onSpeak();
            }
            break;
        }
      }
    },
    [settings.enterKeyBehavior, text, onSpeak, onChange, isExpanded]
  );

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Collapse if text is short
    if (text.length <= 50) {
      setIsExpanded(false);
    }
  };

  const handleClear = () => {
    onChange('');
    if (isExpanded) {
      textareaRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    // Focus the appropriate input after toggle
    setTimeout(() => {
      if (!isExpanded) {
        textareaRef.current?.focus();
      } else {
        inputRef.current?.focus();
      }
    }, 100);
  };

  return (
    <div className={`border-t border-border ${className}`} style={{ backgroundColor: '#242424' }}>
      <div className="px-3 py-2">
        <AnimatePresence mode="wait">
          {isExpanded ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              {/* Expanded textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Type your message..."
                  className="w-full bg-surface-hover text-foreground placeholder:text-text-tertiary rounded-2xl px-4 py-3 pr-12 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  maxLength={maxChars}
                />
                {/* Collapse button */}
                <button
                  onClick={toggleExpanded}
                  className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-surface transition-colors"
                  aria-label="Collapse"
                >
                  <ChevronDownIcon className="w-4 h-4 text-text-secondary" />
                </button>
              </div>

              {/* Character count */}
              <div className="flex justify-between items-center px-1">
                <span className={`text-xs ${charCount > maxChars * 0.9 ? 'text-orange-500' : 'text-text-tertiary'}`}>
                  {charCount}/{maxChars}
                </span>
              </div>

              {/* Action buttons row */}
              <div className="flex items-center gap-2">
                {/* AI Assist button */}
                {onAiAssist && (
                  <button
                    onClick={onAiAssist}
                    disabled={!text.trim()}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-hover hover:bg-status-purple text-text-secondary hover:text-purple-500 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="AI Assist"
                  >
                    <SparklesIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">AI</span>
                  </button>
                )}

                {/* Clear button */}
                <button
                  onClick={handleClear}
                  disabled={!text.trim()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-hover hover:bg-status-error text-text-secondary hover:text-red-500 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Clear"
                >
                  <XMarkIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Clear</span>
                </button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Speak button - primary CTA */}
                <motion.button
                  onClick={onSpeak}
                  disabled={!isAvailable || !text.trim()}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg ${
                    isSpeaking
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                      : 'bg-primary-500 hover:bg-primary-600 text-white'
                  }`}
                  whileTap={{ scale: 0.95 }}
                  aria-label={isSpeaking ? 'Speaking...' : 'Speak'}
                >
                  <SpeakerWaveIcon className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
                  <span>{isSpeaking ? 'Speaking...' : 'Speak'}</span>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="compact"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              {/* Compact input */}
              <div className="flex-1 relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={text}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Type to speak..."
                  className="w-full bg-surface-hover text-foreground placeholder:text-text-tertiary rounded-full px-4 py-3 pr-10 text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {/* Expand button */}
                <button
                  onClick={toggleExpanded}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-surface transition-colors"
                  aria-label="Expand"
                >
                  <ChevronUpIcon className="w-4 h-4 text-text-secondary" />
                </button>
              </div>

              {/* Speak button - primary CTA */}
              <motion.button
                onClick={onSpeak}
                disabled={!isAvailable || !text.trim()}
                className={`flex-shrink-0 p-4 rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg ${
                  isSpeaking
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                    : text.trim()
                    ? 'bg-primary-500 hover:bg-primary-600 text-white'
                    : 'bg-surface-hover text-text-tertiary'
                }`}
                whileTap={{ scale: 0.95 }}
                aria-label={isSpeaking ? 'Speaking...' : 'Speak'}
              >
                <SpeakerWaveIcon className={`w-6 h-6 ${isSpeaking ? 'animate-pulse' : ''}`} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
