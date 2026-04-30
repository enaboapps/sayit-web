import React from 'react';
import { render, screen } from '@testing-library/react';
import TabManagementSheet from '@/app/components/typing-tabs/TabManagementSheet';
import { TypingTab } from '@/app/types/typing-tabs';

// Mock nanoid to avoid ESM issues
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'test-id'),
}));

const createTab = (overrides: Partial<TypingTab> = {}): TypingTab => ({
  id: 'test-tab',
  label: 'Tab',
  text: '',
  createdAt: 1_000,
  lastModified: 1_000,
  isCustomLabel: false,
  ...overrides,
});

describe('TabManagementSheet', () => {
  const noop = () => {};

  const defaultHandlers = {
    onClose: noop,
    onSwitchTab: noop,
    onCloseTab: noop,
    onCloseAllTabs: noop,
    onCreateTab: noop,
    onRenameTab: noop,
  };

  describe('ordering', () => {
    it('lists tabs sorted by lastModified descending (newest edit first)', () => {
      const tabs: TypingTab[] = [
        createTab({ id: 'oldest', label: 'Oldest edit', lastModified: 1_000 }),
        createTab({ id: 'middle', label: 'Middle edit', lastModified: 2_000 }),
        createTab({ id: 'newest', label: 'Newest edit', lastModified: 3_000 }),
      ];

      render(
        <TabManagementSheet
          isOpen
          tabs={tabs}
          activeTabId="oldest"
          {...defaultHandlers}
        />
      );

      const labels = screen
        .getAllByText(/edit$/)
        .map((el) => el.textContent);

      expect(labels).toEqual(['Newest edit', 'Middle edit', 'Oldest edit']);
    });

    it('does not mutate the incoming tabs array', () => {
      const tabs: TypingTab[] = [
        createTab({ id: 'a', label: 'A', lastModified: 1_000 }),
        createTab({ id: 'b', label: 'B', lastModified: 3_000 }),
        createTab({ id: 'c', label: 'C', lastModified: 2_000 }),
      ];
      const originalOrder = tabs.map((t) => t.id);

      render(
        <TabManagementSheet
          isOpen
          tabs={tabs}
          activeTabId="a"
          {...defaultHandlers}
        />
      );

      expect(tabs.map((t) => t.id)).toEqual(originalOrder);
    });

    it('still highlights the active tab regardless of position', () => {
      const tabs: TypingTab[] = [
        createTab({ id: 'oldest', label: 'Oldest edit', lastModified: 1_000 }),
        createTab({ id: 'newest', label: 'Newest edit', lastModified: 3_000 }),
      ];

      render(
        <TabManagementSheet
          isOpen
          tabs={tabs}
          activeTabId="oldest"
          {...defaultHandlers}
        />
      );

      // The active tab's row carries the primary-500 border class — find the
      // label and walk up to the row container.
      const oldestLabel = screen.getByText('Oldest edit');
      const row = oldestLabel.closest('div.flex.items-center');
      expect(row?.className).toContain('border-primary-500');
    });
  });
});
