'use client';

import Image from 'next/image';

type SymbolSize = 'sm' | 'md' | 'lg';

const SIZE_MAP: Record<SymbolSize, number> = {
  sm: 32,
  md: 48,
  lg: 64,
};

interface SymbolImageProps {
  src: string;
  alt: string;
  size?: SymbolSize;
  className?: string;
}

export default function SymbolImage({ src, alt, size = 'md', className = '' }: SymbolImageProps) {
  const px = SIZE_MAP[size];

  return (
    <Image
      src={src}
      alt={alt}
      width={px}
      height={px}
      className={`rounded-lg bg-white border border-border object-contain ${className}`}
      unoptimized={src.includes('globalsymbols.com')}
    />
  );
}
