'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline';
import { Squares2X2Icon } from '@heroicons/react/24/solid';

interface AACTabsProps {
  phrasesContent: React.ReactNode;
  typeContent: React.ReactNode;
}

export default function AACTabs({ phrasesContent, typeContent }: AACTabsProps) {
  const [activeTab, setActiveTab] = useState<'phrases' | 'type'>('phrases');

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Segmented control */}
      <div className="flex justify-center px-4 py-2.5 shrink-0">
        <div className="relative flex bg-surface-hover rounded-2xl p-1 w-full max-w-xs">
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
            onClick={() => setActiveTab('phrases')}
            className="relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200"
          >
            <Squares2X2Icon className={`w-4 h-4 ${activeTab === 'phrases' ? 'text-white' : 'text-text-tertiary'}`} />
            <span className={activeTab === 'phrases' ? 'text-white' : 'text-text-secondary'}>
              Phrases
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('type')}
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
      <div className="flex-1 min-h-0">
        {activeTab === 'phrases' ? phrasesContent : typeContent}
      </div>
    </div>
  );
}
