'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { Squares2X2Icon } from '@heroicons/react/24/solid';

interface AACTabsProps {
  phrasesContent: React.ReactNode;
  typeContent: React.ReactNode;
}

export default function AACTabs({ phrasesContent, typeContent }: AACTabsProps) {
  const [activeTab, setActiveTab] = useState<'phrases' | 'type'>(() => {
    if (typeof window === 'undefined') return 'phrases';
    const saved = localStorage.getItem('aac-active-tab');
    return saved === 'type' ? 'type' : 'phrases';
  });

  const handleTabChange = (tab: 'phrases' | 'type') => {
    setActiveTab(tab);
    localStorage.setItem('aac-active-tab', tab);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Segmented control */}
      <div className="flex justify-center px-4 py-2.5 shrink-0">
        <div role="tablist" aria-label="AAC interface" className="relative flex bg-surface-hover rounded-2xl p-1 w-full max-w-xs">
          {/* Animated background pill */}
          <motion.div
            className="absolute top-1 bottom-1 rounded-xl bg-primary-500 shadow-md"
            initial={false}
            animate={{
              left: activeTab === 'phrases' ? '4px' : '50%',
              right: activeTab === 'phrases' ? '50%' : '4px',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'phrases'}
            aria-controls="aac-tab-phrases"
            onClick={() => handleTabChange('phrases')}
            className="relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200"
          >
            <Squares2X2Icon className={`w-4 h-4 ${activeTab === 'phrases' ? 'text-white' : 'text-text-tertiary'}`} />
            <span className={activeTab === 'phrases' ? 'text-white' : 'text-text-secondary'}>
              Phrases
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'type'}
            aria-controls="aac-tab-type"
            onClick={() => handleTabChange('type')}
            className="relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200"
          >
            <ChatBubbleBottomCenterTextIcon className={`w-4 h-4 ${activeTab === 'type' ? 'text-white' : 'text-text-tertiary'}`} />
            <span className={activeTab === 'type' ? 'text-white' : 'text-text-secondary'}>
              Type
            </span>
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === 'phrases' ? (
            <motion.div
              key="phrases"
              id="aac-tab-phrases"
              role="tabpanel"
              className="absolute inset-0 flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              {phrasesContent}
            </motion.div>
          ) : (
            <motion.div
              key="type"
              id="aac-tab-type"
              role="tabpanel"
              className="absolute inset-0 flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              {typeContent}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
