'use client';

import { useState } from 'react';

interface AACTabsProps {
  phrasesContent: React.ReactNode;
  typeContent: React.ReactNode;
}

export default function AACTabs({ phrasesContent, typeContent }: AACTabsProps) {
  const [activeTab, setActiveTab] = useState<'phrases' | 'type'>('phrases');

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Pill toggle */}
      <div className="flex justify-center py-2 shrink-0">
        <div className="flex bg-surface-hover rounded-full p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('phrases')}
            className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              activeTab === 'phrases'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-text-secondary hover:text-foreground'
            }`}
          >
            Phrases
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('type')}
            className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
              activeTab === 'type'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'text-text-secondary hover:text-foreground'
            }`}
          >
            Type
          </button>
        </div>
      </div>

      {/* Tab content — full remaining height */}
      <div className="flex-1 min-h-0">
        {activeTab === 'phrases' ? phrasesContent : typeContent}
      </div>
    </div>
  );
}
