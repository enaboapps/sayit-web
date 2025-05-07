'use client';

import { useState } from 'react';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/components/ui/Button';
import SubscriptionWrapper from '@/app/components/SubscriptionWrapper';

interface FleshOutPopupProps {
  initialText: string;
  onClose: () => void;
  onApply: (text: string) => void;
}

type GenerationMode = 'want' | 'need' | 'feel' | 'think' | 'ask' | 'like' | 'dislike' | 'remember' | 'wonder' | 'hope';

export default function FleshOutPopup({ initialText, onClose, onApply }: FleshOutPopupProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<GenerationMode>('want');

  const handleModeSelect = async (newMode: GenerationMode) => {
    setMode(newMode);
    setIsGenerating(true);
    setError(null);
    try {
      const requestBody = { 
        text: initialText,
        mode: newMode 
      };
      console.log('Sending request with body:', requestBody);
      
      const response = await fetch('/api/flesh-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        console.error('Error response:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received response:', data);
      
      if (!data.text) {
        throw new Error('No text returned from server');
      }

      onApply(data.text);
      onClose();
    } catch (error) {
      console.error('Error generating text:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate text');
    } finally {
      setIsGenerating(false);
    }
  };

  // The popup container is rendered regardless of subscription status
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-2xl mx-4 transition-colors duration-200">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Flesh Out Text</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 transition-colors duration-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-gray-900 dark:text-gray-100 transition-colors duration-200">
              {initialText}
            </div>
          </div>

          {/* Wrap the premium functionality with the subscription check */}
          <SubscriptionWrapper
            fallback={
              <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg text-center transition-colors duration-200">
                <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Pro Feature</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  "Flesh Out" is a premium feature that helps you express yourself better with AI assistance.
                </p>
                <Button 
                  onClick={() => window.location.href = '/pricing'}
                  className="w-full"
                >
                  Upgrade to Pro
                </Button>
              </div>
            }
          >
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Select how you want to continue your message:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Button
                  onClick={() => handleModeSelect('want')}
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating && mode === 'want' ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    'I want...'
                  )}
                </Button>
                <Button
                  onClick={() => handleModeSelect('need')}
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating && mode === 'need' ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    'I need...'
                  )}
                </Button>
                <Button
                  onClick={() => handleModeSelect('feel')}
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating && mode === 'feel' ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    'I feel...'
                  )}
                </Button>
                <Button
                  onClick={() => handleModeSelect('think')}
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating && mode === 'think' ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    'I think...'
                  )}
                </Button>
                <Button
                  onClick={() => handleModeSelect('ask')}
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating && mode === 'ask' ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    'I want to ask...'
                  )}
                </Button>
                <Button
                  onClick={() => handleModeSelect('like')}
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating && mode === 'like' ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    'I like...'
                  )}
                </Button>
                <Button
                  onClick={() => handleModeSelect('dislike')}
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating && mode === 'dislike' ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    'I don\'t like...'
                  )}
                </Button>
                <Button
                  onClick={() => handleModeSelect('remember')}
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating && mode === 'remember' ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    'I remember...'
                  )}
                </Button>
                <Button
                  onClick={() => handleModeSelect('wonder')}
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating && mode === 'wonder' ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    'I wonder...'
                  )}
                </Button>
                <Button
                  onClick={() => handleModeSelect('hope')}
                  className="w-full"
                  disabled={isGenerating}
                >
                  {isGenerating && mode === 'hope' ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    'I hope...'
                  )}
                </Button>
              </div>
            </div>
          </SubscriptionWrapper>

          {error && (
            <div className="mb-4 text-red-500 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 