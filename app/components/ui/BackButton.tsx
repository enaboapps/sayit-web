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
      variant="ghost"
      onClick={() => router.back()}
      className={`flex items-center hover:bg-gray-100 hover:bg-surface-hover hover:text-gray-900 hover:text-foreground ${className}`}
    >
      <ArrowLeftIcon className="h-5 w-5 mr-2 text-gray-900 text-foreground" />
      <span className="text-gray-900 text-foreground">Back</span>
    </Button>
  );
} 