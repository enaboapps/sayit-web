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
      className={`flex items-center hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 ${className}`}
    >
      <ArrowLeftIcon className="h-5 w-5 mr-2 text-gray-900 dark:text-gray-100" />
      <span className="text-gray-900 dark:text-gray-100">Back</span>
    </Button>
  );
} 