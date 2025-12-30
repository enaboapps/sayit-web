import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TabBar from '@/app/components/typing-tabs/TabBar';
import { TypingTab } from '@/app/types/typing-tabs';
import { MAX_TABS } from '@/app/components/typing-tabs/utils';

// Mock nanoid to avoid ESM issues
jest.mock('nanoid', () => ({
  nanoid: jest.fn(() => 'test-id'),
}));

const createTab = (overrides: Partial<TypingTab> = {}): TypingTab => ({
  id: 'test-tab-1',
  label: 'Test Tab',
  text: 'Test content',
  createdAt: Date.now(),
  lastModified: Date.now(),
  isCustomLabel: false,
  ...overrides,
});

describe('TabBar', () => {
  const mockOnTabSelect = jest.fn();
  const mockOnTabClose = jest.fn();
  const mockOnTabCreate = jest.fn();
  const mockOnTabRename = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders all tabs', () => {
      const tabs = [
        createTab({ id: 'tab-1', label: 'Tab 1' }),
        createTab({ id: 'tab-2', label: 'Tab 2' }),
        createTab({ id: 'tab-3', label: 'Tab 3' }),
      ];

      render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-1"
          onTabSelect={mockOnTabSelect}
          onTabClose={mockOnTabClose}
          onTabCreate={mockOnTabCreate}
          onTabRename={mockOnTabRename}
        />
      );

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });

    it('renders create button', () => {
      const tabs = [createTab()];

      render(
        <TabBar
          tabs={tabs}
          activeTabId={tabs[0].id}
          onTabSelect={mockOnTabSelect}
          onTabClose={mockOnTabClose}
          onTabCreate={mockOnTabCreate}
          onTabRename={mockOnTabRename}
        />
      );

      expect(screen.getByLabelText('Create new tab')).toBeInTheDocument();
    });

    it('enables create button when below MAX_TABS', () => {
      const tabs = [createTab()];

      render(
        <TabBar
          tabs={tabs}
          activeTabId={tabs[0].id}
          onTabSelect={mockOnTabSelect}
          onTabClose={mockOnTabClose}
          onTabCreate={mockOnTabCreate}
          onTabRename={mockOnTabRename}
        />
      );

      const createButton = screen.getByLabelText('Create new tab');
      expect(createButton).not.toBeDisabled();
    });

    it('disables create button when at MAX_TABS', () => {
      const tabs = Array.from({ length: MAX_TABS }, (_, i) =>
        createTab({ id: `tab-${i}`, label: `Tab ${i}` })
      );

      render(
        <TabBar
          tabs={tabs}
          activeTabId={tabs[0].id}
          onTabSelect={mockOnTabSelect}
          onTabClose={mockOnTabClose}
          onTabCreate={mockOnTabCreate}
          onTabRename={mockOnTabRename}
        />
      );

      const createButton = screen.getByLabelText('Create new tab');
      expect(createButton).toBeDisabled();
    });

    it('renders with no active tab', () => {
      const tabs = [createTab()];

      render(
        <TabBar
          tabs={tabs}
          activeTabId={null}
          onTabSelect={mockOnTabSelect}
          onTabClose={mockOnTabClose}
          onTabCreate={mockOnTabCreate}
          onTabRename={mockOnTabRename}
        />
      );

      expect(screen.getByText('Test Tab')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onTabCreate when create button is clicked', async () => {
      const user = userEvent.setup();
      const tabs = [createTab()];

      render(
        <TabBar
          tabs={tabs}
          activeTabId={tabs[0].id}
          onTabSelect={mockOnTabSelect}
          onTabClose={mockOnTabClose}
          onTabCreate={mockOnTabCreate}
          onTabRename={mockOnTabRename}
        />
      );

      await user.click(screen.getByLabelText('Create new tab'));

      expect(mockOnTabCreate).toHaveBeenCalledTimes(1);
    });

    it('does not call onTabCreate when create button is disabled', async () => {
      const user = userEvent.setup();
      const tabs = Array.from({ length: MAX_TABS }, (_, i) =>
        createTab({ id: `tab-${i}`, label: `Tab ${i}` })
      );

      render(
        <TabBar
          tabs={tabs}
          activeTabId={tabs[0].id}
          onTabSelect={mockOnTabSelect}
          onTabClose={mockOnTabClose}
          onTabCreate={mockOnTabCreate}
          onTabRename={mockOnTabRename}
        />
      );

      const createButton = screen.getByLabelText('Create new tab');
      await user.click(createButton);

      expect(mockOnTabCreate).not.toHaveBeenCalled();
    });

    it('calls onTabSelect when a tab is selected', async () => {
      const user = userEvent.setup();
      const tabs = [
        createTab({ id: 'tab-1', label: 'Tab 1' }),
        createTab({ id: 'tab-2', label: 'Tab 2' }),
      ];

      render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-1"
          onTabSelect={mockOnTabSelect}
          onTabClose={mockOnTabClose}
          onTabCreate={mockOnTabCreate}
          onTabRename={mockOnTabRename}
        />
      );

      await user.click(screen.getByText('Tab 2'));

      expect(mockOnTabSelect).toHaveBeenCalledWith('tab-2');
    });

    it('calls onTabClose when a tab is closed', async () => {
      const user = userEvent.setup();
      const tabs = [
        createTab({ id: 'tab-1', label: 'Tab 1' }),
        createTab({ id: 'tab-2', label: 'Tab 2' }),
      ];

      render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-1"
          onTabSelect={mockOnTabSelect}
          onTabClose={mockOnTabClose}
          onTabCreate={mockOnTabCreate}
          onTabRename={mockOnTabRename}
        />
      );

      await user.click(screen.getByLabelText('Close Tab 1'));

      expect(mockOnTabClose).toHaveBeenCalledWith('tab-1');
    });

    it('calls onTabRename when a tab is renamed', async () => {
      const user = userEvent.setup();
      const tabs = [createTab({ id: 'tab-1', label: 'Original' })];

      render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-1"
          onTabSelect={mockOnTabSelect}
          onTabClose={mockOnTabClose}
          onTabCreate={mockOnTabCreate}
          onTabRename={mockOnTabRename}
        />
      );

      await user.dblClick(screen.getByText('Original'));

      const input = screen.getByDisplayValue('Original');
      await user.clear(input);
      await user.type(input, 'New Label');
      await user.keyboard('{Enter}');

      expect(mockOnTabRename).toHaveBeenCalledWith('tab-1', 'New Label');
    });
  });

  describe('edge cases', () => {
    it('renders with empty tabs array', () => {
      render(
        <TabBar
          tabs={[]}
          activeTabId={null}
          onTabSelect={mockOnTabSelect}
          onTabClose={mockOnTabClose}
          onTabCreate={mockOnTabCreate}
          onTabRename={mockOnTabRename}
        />
      );

      expect(screen.getByLabelText('Create new tab')).toBeInTheDocument();
    });

    it('renders with single tab', () => {
      const tabs = [createTab({ id: 'tab-1', label: 'Only Tab' })];

      render(
        <TabBar
          tabs={tabs}
          activeTabId="tab-1"
          onTabSelect={mockOnTabSelect}
          onTabClose={mockOnTabClose}
          onTabCreate={mockOnTabCreate}
          onTabRename={mockOnTabRename}
        />
      );

      expect(screen.getByText('Only Tab')).toBeInTheDocument();
    });

    it('renders with MAX_TABS tabs', () => {
      const tabs = Array.from({ length: MAX_TABS }, (_, i) =>
        createTab({ id: `tab-${i}`, label: `Tab ${i}` })
      );

      render(
        <TabBar
          tabs={tabs}
          activeTabId={tabs[0].id}
          onTabSelect={mockOnTabSelect}
          onTabClose={mockOnTabClose}
          onTabCreate={mockOnTabCreate}
          onTabRename={mockOnTabRename}
        />
      );

      expect(screen.getByText('Tab 0')).toBeInTheDocument();
      expect(screen.getByText(`Tab ${MAX_TABS - 1}`)).toBeInTheDocument();
    });

    it('handles activeTabId not matching any tab', () => {
      const tabs = [createTab({ id: 'tab-1', label: 'Tab 1' })];

      render(
        <TabBar
          tabs={tabs}
          activeTabId="non-existent-id"
          onTabSelect={mockOnTabSelect}
          onTabClose={mockOnTabClose}
          onTabCreate={mockOnTabCreate}
          onTabRename={mockOnTabRename}
        />
      );

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
    });
  });

  describe('create button tooltip', () => {
    it('shows keyboard shortcut in tooltip when create is enabled', () => {
      const tabs = [createTab()];

      render(
        <TabBar
          tabs={tabs}
          activeTabId={tabs[0].id}
          onTabSelect={mockOnTabSelect}
          onTabClose={mockOnTabClose}
          onTabCreate={mockOnTabCreate}
          onTabRename={mockOnTabRename}
        />
      );

      const createButton = screen.getByLabelText('Create new tab');
      expect(createButton).toHaveAttribute('title', 'Create new tab (Cmd/Ctrl+T)');
    });

    it('shows max tabs message in tooltip when create is disabled', () => {
      const tabs = Array.from({ length: MAX_TABS }, (_, i) =>
        createTab({ id: `tab-${i}`, label: `Tab ${i}` })
      );

      render(
        <TabBar
          tabs={tabs}
          activeTabId={tabs[0].id}
          onTabSelect={mockOnTabSelect}
          onTabClose={mockOnTabClose}
          onTabCreate={mockOnTabCreate}
          onTabRename={mockOnTabRename}
        />
      );

      const createButton = screen.getByLabelText('Create new tab');
      expect(createButton).toHaveAttribute('title', `Maximum of ${MAX_TABS} tabs reached`);
    });
  });
});
