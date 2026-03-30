'use client';

import { Fragment, ReactNode, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { cn } from '@/lib/utils';

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface DropdownProps<T = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  description?: string;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  renderOption?: (option: DropdownOption<T>) => ReactNode;
}

export function Dropdown<T = string>({
  options,
  value,
  onChange,
  label,
  description,
  className,
  disabled = false,
  placeholder = 'Select an option',
  error,
  renderOption
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(option => option.value === value);

  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-foreground mb-2">
          {label}
        </label>
      )}
      {description && (
        <p className="text-sm text-text-secondary mb-2">{description}</p>
      )}

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        className={cn(
          'relative w-full py-3 pl-6 pr-10 text-left bg-surface border border-border rounded-3xl shadow-md hover:shadow-lg cursor-default focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:shadow-xl text-base transition-all duration-300',
          disabled && 'opacity-50 cursor-not-allowed bg-surface-hover',
          error && 'border-red-500 focus:ring-red-500 focus:border-red-500'
        )}
        disabled={disabled}
      >
        <span className="block truncate text-foreground">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
          <ChevronDownIcon
            className="w-5 h-5 text-text-tertiary"
            aria-hidden="true"
          />
        </span>
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[65]" onClose={() => setIsOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-overlay" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl border border-border shadow-2xl transition-all bg-surface">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <Dialog.Title className="text-lg font-semibold text-foreground">
                      {label || 'Select an option'}
                    </Dialog.Title>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded-full hover:bg-surface-hover transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5 text-text-tertiary" />
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto p-2">
                    {options.map((option, optionIdx) => {
                      const isSelected = option.value === value;
                      return (
                        <button
                          key={optionIdx}
                          type="button"
                          onClick={() => !option.disabled && handleSelect(option.value)}
                          className={cn(
                            'w-full cursor-default select-none relative py-3 pl-6 pr-10 rounded-2xl transition-all duration-200 text-left',
                            isSelected
                              ? 'text-white bg-gradient-to-r from-primary-500 to-primary-600'
                              : 'text-foreground hover:bg-surface-hover',
                            option.disabled && 'opacity-50 cursor-not-allowed text-text-tertiary'
                          )}
                          disabled={option.disabled}
                        >
                          {renderOption ? (
                            renderOption(option)
                          ) : (
                            <span
                              className={cn(
                                'block truncate',
                                isSelected ? 'font-semibold' : 'font-normal'
                              )}
                            >
                              {option.label}
                            </span>
                          )}
                          {isSelected && (
                            <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-white">
                              <CheckIcon className="w-5 h-5" aria-hidden="true" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {error && <p className="mt-2 text-sm text-red-500 bg-status-error px-4 py-2 rounded-3xl">{error}</p>}
    </div>
  );
}
