import { nanoid } from 'nanoid';
import { TypingTab } from '@/app/types/typing-tabs';

export const MAX_LABEL_LENGTH = 20;

export function generateLabelFromText(text: string, tabNumber: number): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return `Message ${tabNumber}`;
  }

  // Take first line or first 20 characters, whichever is shorter
  const firstLine = trimmed.split('\n')[0];
  const preview = firstLine.slice(0, MAX_LABEL_LENGTH);

  // Add ellipsis if truncated
  return firstLine.length > MAX_LABEL_LENGTH ? `${preview}...` : preview;
}

export function createDefaultTab(tabNumber: number, text: string = ''): TypingTab {
  const now = Date.now();

  return {
    id: nanoid(),
    label: generateLabelFromText(text, tabNumber),
    text,
    createdAt: now,
    lastModified: now,
    isCustomLabel: false,
  };
}

export function validateTabLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) {
    return 'Message';
  }
  return trimmed.slice(0, MAX_LABEL_LENGTH);
}
