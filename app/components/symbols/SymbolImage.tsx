'use client';

import Image from 'next/image';

interface SymbolImageProps {
  url: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function SymbolImage({ url, alt = 'Symbol', size = 'md', className = '' }: SymbolImageProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  return (
    <div className={`relative ${sizeClasses[size]} bg-white rounded-lg overflow-hidden border border-gray-200 border-border ${className}`}>
      <Image
        src={url}
        alt={alt}
        fill
        sizes="(max-width: 768px) 48px, (max-width: 1200px) 64px, 96px"
        className="object-contain p-2"
        unoptimized={url.startsWith('blob:')}
      />
    </div>
  );
} 