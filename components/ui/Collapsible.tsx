import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface CollapsibleProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function Collapsible({ 
  title, 
  children, 
  defaultOpen = false,
  className, 
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [contentHeight, setContentHeight] = useState<number | undefined>(defaultOpen ? undefined : 0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen, children]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  return (
    <div className={cn('w-full', className)}>
      <button
        type="button"
        onClick={handleClick}
        className="flex w-full items-center justify-between py-3 text-left"
      >
        <span className="text-sm font-medium text-gray-900">{title}</span>
        <ChevronDownIcon
          className={cn(
            'h-5 w-5 text-gray-500 transition-transform duration-200',
            isOpen ? 'rotate-180' : '',
          )}
        />
      </button>
      <div
        ref={contentRef}
        style={{ height: contentHeight }}
        className={cn(
          'overflow-hidden transition-all duration-200',
        )}
      >
        <div className="py-6 px-4">{children}</div>
      </div>
    </div>
  );
} 