'use client';

import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0"
      style={{
        background: 'linear-gradient(-45deg, #f3f4f6, #e5e7eb, #d1d5db, #f3f4f6)',
        backgroundSize: '400% 400%',
        animation: 'gradient 15s ease infinite',
        zIndex: -1,
      }}
    />
  );
};

export default AnimatedBackground;
