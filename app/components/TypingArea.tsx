'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatBubbleLeftIcon, XMarkIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Tooltip } from 'react-tooltip';
import { useSettings } from '../contexts/SettingsContext';
import { useTTS } from '@/lib/hooks/useTTS';

interface TypingAreaProps {
  initialText?: string
}

export default function TypingArea({ initialText = '' }: TypingAreaProps) {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { settings } = useSettings();
  const { speak, isSpeaking, isAvailable } = useTTS();
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
    textareaRef.current?.focus();
  };

  const handleSpeak = () => {
    if (text.trim()) {
      speak(text, {
        rate: settings.speechRate || 1.0,
        pitch: settings.speechPitch || 1.0,
        volume: settings.speechVolume || 1.0,
        voiceURI: settings.speechVoice,
      });
      textareaRef.current?.focus();
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="flex flex-col">
      {isVisible && (
        <div className="flex">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              className={`w-full h-40 bg-white text-gray-900 ${currentTextSizeClass} placeholder:text-gray-400 focus:outline-none focus:ring-0 resize-none p-4 overflow-auto`}
              value={text}
              onChange={(e) => setText(e.target.value)}
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
          </div>
          <div className="w-16 flex flex-col">
            <button
              onClick={handleSpeak}
              className={`h-20 transition-colors duration-200 border-l border-gray-300 ${isSpeaking
                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              data-tooltip-id="speak-tooltip"
              data-tooltip-content={isSpeaking ? 'Stop speaking' : 'Speak text'}
              disabled={!isAvailable || !text.trim()}
            >
              <div className="flex items-center justify-center h-full">
                <ChatBubbleLeftIcon className="w-8 h-8" />
              </div>
            </button>
            <button
              onClick={handleClear}
              className="h-20 bg-gray-100 hover:bg-gray-200 transition-colors duration-200 border-l border-gray-300"
              data-tooltip-id="clear-tooltip"
              data-tooltip-content="Clear"
            >
              <div className="flex items-center justify-center h-full">
                <XMarkIcon className="w-8 h-8 text-gray-600" />
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
      <Tooltip id="clear-tooltip" />
      <Tooltip id="toggle-tooltip" />
    </div>
  );
}
