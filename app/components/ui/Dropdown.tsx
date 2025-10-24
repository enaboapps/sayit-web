'use client';

import { Fragment, ReactNode } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/24/solid';
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
  const selectedOption = options.find(option => option.value === value);

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
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          <Listbox.Button className={cn(
            'relative w-full py-3 pl-6 pr-10 text-left bg-surface border border-border rounded-3xl shadow-md hover:shadow-lg cursor-default focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 focus:shadow-xl text-base transition-all duration-300',
            disabled && 'opacity-50 cursor-not-allowed bg-surface-hover',
            error && 'border-red-500 focus:ring-red-500/50 focus:border-red-500/50'
          )}>
            <span className="block truncate text-foreground">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <ChevronDownIcon
                className="w-5 h-5 text-text-tertiary"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Listbox.Options className="absolute z-10 w-full py-2 mt-2 overflow-auto text-base bg-surface rounded-3xl shadow-2xl max-h-60 border border-border focus:outline-none">
              {options.map((option, optionIdx) => (
                <Listbox.Option
                  key={optionIdx}
                  className={({ active }) =>
                    cn(
                      'cursor-default select-none relative py-3 pl-6 pr-10 mx-2 rounded-2xl transition-all duration-200',
                      active ? 'text-white bg-gradient-to-r from-primary-500 to-primary-600' : 'text-foreground',
                      option.disabled && 'opacity-50 cursor-not-allowed text-text-tertiary'
                    )
                  }
                  value={option.value}
                  disabled={option.disabled}
                >
                  {({ selected, active }) => (
                    <>
                      {renderOption ? (
                        renderOption(option)
                      ) : (
                        <span
                          className={cn(
                            'block truncate',
                            selected ? 'font-semibold' : 'font-normal'
                          )}
                        >
                          {option.label}
                        </span>
                      )}
                      {selected ? (
                        <span
                          className={cn(
                            'absolute inset-y-0 right-0 flex items-center pr-4',
                            active ? 'text-white' : 'text-primary-500'
                          )}
                        >
                          <CheckIcon className="w-5 h-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
      {error && <p className="mt-2 text-sm text-red-500 bg-red-500/10 px-4 py-2 rounded-3xl">{error}</p>}
    </div>
  );
} 