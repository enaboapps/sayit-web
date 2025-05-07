'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SliderProps {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  label?: string;
  description?: string;
  valueLabel?: string | ((value: number) => string);
  className?: string;
  disabled?: boolean;
  error?: string;
  showTicks?: boolean;
  trackColor?: string;
  thumbColor?: string;
}

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  label,
  description,
  valueLabel,
  className,
  disabled = false,
  error,
  showTicks = false,
  trackColor = 'bg-black',
  thumbColor = 'bg-black'
}: SliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // Format the value label
  const formattedValueLabel = valueLabel 
    ? typeof valueLabel === 'function' 
      ? valueLabel(value) 
      : `${valueLabel}: ${value}` 
    : value.toString();

  // Calculate percentage for slider position
  const percentage = ((value - min) / (max - min)) * 100;

  // Generate tick marks if needed
  const generateTicks = () => {
    if (!showTicks) return null;
    
    const ticksArray = [];
    const totalSteps = (max - min) / step;
    // Limit ticks if there are too many steps
    const skipFactor = totalSteps > 20 ? Math.ceil(totalSteps / 10) : 1;
    
    for (let i = 0; i <= totalSteps; i += skipFactor) {
      const tickValue = min + (i * step);
      const tickPercentage = ((tickValue - min) / (max - min)) * 100;
      const isActive = tickValue <= value;
      
      ticksArray.push(
        <div 
          key={i} 
          className={cn(
            'absolute w-1 h-2 -translate-x-1/2 bottom-0 transition-all duration-300',
            isActive ? trackColor : 'bg-gray-300'
          )}
          style={{ left: `${tickPercentage}%` }}
        />
      );
    }
    
    return ticksArray;
  };

  // Get value at a specific point on the slider
  const getValueFromPosition = (positionX: number) => {
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return value;
    
    const clickPosition = positionX - rect.left;
    const newPercentage = Math.min(Math.max(clickPosition / rect.width, 0), 1);
    const newValue = min + newPercentage * (max - min);
    
    // Round to nearest step
    const roundedValue = Math.round(newValue / step) * step;
    return parseFloat(roundedValue.toFixed(5));
  };
  
  // Handle slider track click
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const newValue = getValueFromPosition(e.clientX);
    onChange(newValue);
  };

  // Handle mouse events for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newValue = getValueFromPosition(e.clientX);
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    // Change cursor for the entire page while dragging
    document.body.style.cursor = 'grabbing';
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.cursor = 'default';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, step, onChange]);

  // Handle touch events
  useEffect(() => {
    const thumbElement = thumbRef.current;
    if (!thumbElement) return;
    
    const handleTouchStart = () => {
      if (!disabled) setIsDragging(true);
    };
    
    thumbElement.addEventListener('touchstart', handleTouchStart);
    
    return () => {
      thumbElement.removeEventListener('touchstart', handleTouchStart);
    };
  }, [disabled]);

  useEffect(() => {
    if (!isDragging) return;
    
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const newValue = getValueFromPosition(touch.clientX);
      onChange(newValue);
      e.preventDefault(); // Prevent scrolling while dragging
    };
    
    const handleTouchEnd = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, onChange]);

  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          <span className={cn(
            'text-sm px-2 py-1 rounded-md transition-all duration-300',
            isHovering || isDragging ? 'bg-black dark:bg-white text-white dark:text-black' : 'text-gray-500 dark:text-gray-400'
          )}>
            {formattedValueLabel}
          </span>
        </div>
      )}
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{description}</p>
      )}
      
      <div 
        ref={sliderRef}
        className={cn(
          'h-8 relative rounded-full cursor-pointer my-2 py-3',
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={handleTrackClick}
      >
        {/* Background track */}
        <div 
          className={cn(
            'absolute h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700',
            error ? 'bg-red-100 dark:bg-red-900/20' : ''
          )} 
          style={{ top: '50%', transform: 'translateY(-50%)' }}
        />

        {/* Active track */}
        <div 
          className={cn(
            'absolute h-2 rounded-full transition-all',
            disabled ? 'bg-gray-400 dark:bg-gray-600' : trackColor,
            error ? 'bg-red-500 dark:bg-red-400' : '',
            isHovering || isDragging ? 'h-3' : 'h-2' // Slight height increase on hover
          )} 
          style={{ 
            width: `${percentage}%`, 
            top: '50%', 
            transform: 'translateY(-50%)'
          }}
        />

        {/* Tick marks container */}
        {showTicks && (
          <div className="absolute w-full h-2" style={{ top: 'calc(50% + 8px)' }}>
            {generateTicks()}
          </div>
        )}

        {/* Thumb */}
        <div 
          ref={thumbRef}
          className={cn(
            'absolute rounded-full shadow-md transform -translate-x-1/2 border-2 transition-all duration-200',
            disabled ? 
              'border-gray-400 dark:border-gray-600 bg-white dark:bg-gray-800 cursor-not-allowed w-5 h-5' : 
              cn(
                'border-gray-100 dark:border-gray-700 cursor-grab',
                thumbColor, 
                isDragging ? 'cursor-grabbing scale-110 w-7 h-7' : 
                  isHovering ? 'scale-105 w-6 h-6' : 'w-5 h-5'
              ),
            error ? 'border-red-500 dark:border-red-400' : ''
          )}
          style={{ 
            left: `${percentage}%`,
            top: '50%',
            transform: `translate(-50%, -50%) ${isDragging ? 'scale(1.1)' : isHovering ? 'scale(1.05)' : 'scale(1)'}`
          }}
          onMouseDown={(e) => {
            if (!disabled) {
              setIsDragging(true);
              e.preventDefault(); // Prevent text selection
            }
          }}
        >
          {/* Optional inner circle for thumb */}
          <div className={cn(
            'absolute inset-0 m-auto rounded-full transition-all',
            isDragging ? 'w-2 h-2 bg-white' : 'w-1 h-1 bg-gray-100'
          )} />
        </div>

        {/* Value tooltip when dragging */}
        {(isDragging || isHovering) && (
          <div 
            className="absolute px-2 py-1 text-xs font-medium text-white bg-black rounded opacity-90 pointer-events-none transform -translate-x-1/2"
            style={{ 
              left: `${percentage}%`, 
              bottom: '100%',
              marginBottom: '8px'
            }}
          >
            {value}
            <div className="absolute w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"
              style={{ 
                left: '50%', 
                top: '100%', 
                transform: 'translateX(-50%)' 
              }} />
          </div>
        )}
      </div>
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
} 