'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatBubbleLeftIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';
import { useSettings } from '../contexts/SettingsContext';

interface TypingAreaProps {
  initialText?: string
  tts: {
    speak: (text: string) => void;
    isSpeaking: boolean;
    isAvailable: boolean;
  }
}

export default function TypingArea({ initialText = '', tts }: TypingAreaProps) {
  const [text, setText] = useState(initialText);
  const [isRewriting, setIsRewriting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { settings } = useSettings();
  const { speak, isSpeaking, isAvailable } = tts;
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('typingAreaVisible');
      return saved ? JSON.parse(saved) : true;
    }
    return true;
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

  const handleClear = () => {
    setText('');
    setError(null);
    textareaRef.current?.focus();
  };

  const handleSpeak = () => {
    if (text.trim()) {
      speak(text);
      textareaRef.current?.focus();
    }
  };

  const handleRewrite = async () => {
    if (!text.trim()) return;
    
    setIsRewriting(true);
    setError(null);
    try {
      const response = await fetch('/api/rewrite', {
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
      if (!data.text) {
        throw new Error('No text returned from server');
      }

      setText(data.text);
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Error rewriting text:', error);
      setError(error instanceof Error ? error.message : 'Failed to rewrite text');
    } finally {
      setIsRewriting(false);
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="flex flex-col">
      {isVisible && (
        <div className="flex flex-col">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              className={`w-full h-40 bg-white text-gray-900 ${currentTextSizeClass} placeholder:text-gray-400 focus:outline-none focus:ring-0 resize-none p-4 overflow-auto`}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
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
                  case 'newline':
                  default:
                    setText(prev => prev + '\n');
                    break;
                  }
                }
              }}
              placeholder="Type your message here..."
              style={{
                minHeight: '10rem',
                maxHeight: '10rem',
                lineHeight: '1.5',
              }}
            />
            {error && (
              <div className="absolute bottom-0 left-0 right-0 bg-red-100 text-red-700 p-2 text-sm">
                {error}
              </div>
            )}
          </div>
          <div className="flex border-t border-gray-300">
            <button
              onClick={handleSpeak}
              className={`flex-1 h-12 transition-colors duration-200 ${
                isSpeaking
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
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
              onClick={handleRewrite}
              className={`flex-1 h-12 transition-colors duration-200 ${
                isRewriting
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              data-tooltip-id="rewrite-tooltip"
              data-tooltip-content={isRewriting ? 'Rewriting...' : 'Rewrite with AI'}
              disabled={!text.trim() || isRewriting}
            >
              <div className="flex items-center justify-center gap-2">
                <ArrowPathIcon className={`w-5 h-5 ${isRewriting ? 'animate-spin' : ''}`} />
                <span>AI Rewrite</span>
              </div>
            </button>
            <button
              onClick={handleClear}
              className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              data-tooltip-id="clear-tooltip"
              data-tooltip-content="Clear"
            >
              <div className="flex items-center justify-center gap-2">
                <XMarkIcon className="w-5 h-5 text-gray-600" />
                <span>Clear</span>
              </div>
            </button>
          </div>
        </div>
      )}
      <button
        onClick={toggleVisibility}
        className="h-8 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center"
        data-tooltip-id="toggle-tooltip"
        data-tooltip-content={isVisible ? 'Hide typing area' : 'Show typing area'}
      >
        {isVisible ? (
          <ChevronUpIcon className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-gray-600" />
        )}
      </button>
      <Tooltip id="speak-tooltip" />
      <Tooltip id="rewrite-tooltip" />
      <Tooltip id="clear-tooltip" />
      <Tooltip id="toggle-tooltip" />
    </div>
  );
}
