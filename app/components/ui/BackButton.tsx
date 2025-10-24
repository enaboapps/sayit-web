'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

interface BackButtonProps {
  className?: string;
}

export default function BackButton({ className = '' }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      variant="secondary"
      onClick={() => router.back()}
      className={`gap-2 ${className}`}
    >
      <ArrowLeftIcon className="h-5 w-5" />
      <span>Back</span>
    </Button>
  );
} 