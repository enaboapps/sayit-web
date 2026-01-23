import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TabManagementDialog from '@/app/components/typing-tabs/TabManagementDialog';
import { TypingTab } from '@/app/types/typing-tabs';

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

describe('TabManagementDialog', () => {
  const mockOnClose = jest.fn();
  const mockOnSwitchTab = jest.fn();
  const mockOnCloseTab = jest.fn();
  const mockOnCloseAllTabs = jest.fn();
  const mockOnRenameTab = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders dialog when open', () => {
      const tabs = [createTab()];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="test-tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      expect(screen.getByText('Manage Tabs')).toBeInTheDocument();
    });

    it('does not render dialog when closed', () => {
      const tabs = [createTab()];

      render(
        <TabManagementDialog
          isOpen={false}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="test-tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      expect(screen.queryByText('Manage Tabs')).not.toBeInTheDocument();
    });

    it('renders correct number of tabs', () => {
      const tabs = [
        createTab({ id: 'tab-1', label: 'Tab 1' }),
        createTab({ id: 'tab-2', label: 'Tab 2' }),
        createTab({ id: 'tab-3', label: 'Tab 3' }),
      ];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      expect(screen.getByText('Tab 1')).toBeInTheDocument();
      expect(screen.getByText('Tab 2')).toBeInTheDocument();
      expect(screen.getByText('Tab 3')).toBeInTheDocument();
    });

    it('shows active indicator on active tab', () => {
      const tabs = [
        createTab({ id: 'tab-1', label: 'Tab 1' }),
        createTab({ id: 'tab-2', label: 'Tab 2' }),
      ];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('displays content preview', () => {
      const tabs = [
        createTab({ id: 'tab-1', text: 'This is some test content' }),
      ];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      expect(screen.getByText('This is some test content')).toBeInTheDocument();
    });

    it('displays (Empty) for empty tabs', () => {
      const tabs = [
        createTab({ id: 'tab-1', text: '' }),
      ];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      expect(screen.getByText('(Empty)')).toBeInTheDocument();
    });

    it('truncates long content to 100 characters', () => {
      const longText = 'a'.repeat(150);
      const tabs = [
        createTab({ id: 'tab-1', text: longText }),
      ];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      const preview = screen.getByText('a'.repeat(100));
      expect(preview).toBeInTheDocument();
      expect(screen.queryByText(longText)).not.toBeInTheDocument();
    });

    it('hides Close All button when only 1 tab exists', () => {
      const tabs = [createTab()];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="test-tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      expect(screen.queryByText(/Close All/)).not.toBeInTheDocument();
    });

    it('shows Close All button when more than 1 tab exists', () => {
      const tabs = [
        createTab({ id: 'tab-1', label: 'Tab 1' }),
        createTab({ id: 'tab-2', label: 'Tab 2' }),
      ];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      expect(screen.getByText(/Close All/)).toBeInTheDocument();
    });
  });

  describe('switch tab functionality', () => {
    it('calls onSwitchTab when tab is clicked', async () => {
      const user = userEvent.setup();
      const tabs = [
        createTab({ id: 'tab-1', label: 'Tab 1' }),
        createTab({ id: 'tab-2', label: 'Tab 2' }),
      ];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      await user.click(screen.getByText('Tab 2'));

      expect(mockOnSwitchTab).toHaveBeenCalledWith('tab-2');
    });

    it('calls onClose when tab is switched', async () => {
      const user = userEvent.setup();
      const tabs = [
        createTab({ id: 'tab-1', label: 'Tab 1' }),
        createTab({ id: 'tab-2', label: 'Tab 2' }),
      ];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      await user.click(screen.getByText('Tab 2'));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('close tab functionality', () => {
    it('calls onCloseTab when close button is clicked', async () => {
      const user = userEvent.setup();
      const tabs = [
        createTab({ id: 'tab-1', label: 'Tab 1' }),
        createTab({ id: 'tab-2', label: 'Tab 2' }),
      ];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      await user.click(screen.getByLabelText('Close Tab 1'));

      expect(mockOnCloseTab).toHaveBeenCalledWith('tab-1');
    });

    it('does not call onSwitchTab when close button is clicked', async () => {
      const user = userEvent.setup();
      const tabs = [
        createTab({ id: 'tab-1', label: 'Tab 1' }),
        createTab({ id: 'tab-2', label: 'Tab 2' }),
      ];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      await user.click(screen.getByLabelText('Close Tab 1'));

      expect(mockOnSwitchTab).not.toHaveBeenCalled();
    });

    it('does not close dialog when tab is closed', async () => {
      const user = userEvent.setup();
      const tabs = [
        createTab({ id: 'tab-1', label: 'Tab 1' }),
        createTab({ id: 'tab-2', label: 'Tab 2' }),
      ];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      await user.click(screen.getByLabelText('Close Tab 1'));

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('rename tab functionality', () => {
    it('shows input when pencil icon is clicked', async () => {
      const user = userEvent.setup();
      const tabs = [createTab({ id: 'tab-1', label: 'Tab 1' })];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      await user.click(screen.getByLabelText('Rename Tab 1'));

      const input = screen.getByDisplayValue('Tab 1');
      expect(input).toBeInTheDocument();
      expect(input.tagName).toBe('INPUT');
    });

    it('calls onRenameTab when Enter is pressed', async () => {
      const user = userEvent.setup();
      const tabs = [createTab({ id: 'tab-1', label: 'Tab 1' })];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      await user.click(screen.getByLabelText('Rename Tab 1'));
      const input = screen.getByDisplayValue('Tab 1');
      await user.clear(input);
      await user.type(input, 'New Label');
      await user.keyboard('{Enter}');

      expect(mockOnRenameTab).toHaveBeenCalledWith('tab-1', 'New Label');
    });

    it('calls onRenameTab when input loses focus', async () => {
      const user = userEvent.setup();
      const tabs = [createTab({ id: 'tab-1', label: 'Tab 1' })];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      await user.click(screen.getByLabelText('Rename Tab 1'));
      const input = screen.getByDisplayValue('Tab 1');
      await user.clear(input);
      await user.type(input, 'Blur Test');
      await user.tab(); // Blur the input

      await waitFor(() => {
        expect(mockOnRenameTab).toHaveBeenCalledWith('tab-1', 'Blur Test');
      });
    });

    it('exits edit mode when Escape is pressed', async () => {
      const user = userEvent.setup();
      const tabs = [createTab({ id: 'tab-1', label: 'Tab 1' })];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      await user.click(screen.getByLabelText('Rename Tab 1'));
      const input = screen.getByDisplayValue('Tab 1');
      await user.clear(input);
      await user.type(input, 'Cancelled');
      await user.keyboard('{Escape}');

      // Input should no longer be visible (edit mode exited)
      expect(screen.queryByDisplayValue('Cancelled')).not.toBeInTheDocument();
    });

    it('does not call onSwitchTab when clicking input', async () => {
      const user = userEvent.setup();
      const tabs = [createTab({ id: 'tab-1', label: 'Tab 1' })];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      await user.click(screen.getByLabelText('Rename Tab 1'));
      const input = screen.getByDisplayValue('Tab 1');
      await user.click(input);

      expect(mockOnSwitchTab).not.toHaveBeenCalled();
    });
  });

  describe('close all functionality', () => {
    it('calls onCloseAllTabs when Close All is clicked', async () => {
      const user = userEvent.setup();
      const tabs = [
        createTab({ id: 'tab-1', label: 'Tab 1' }),
        createTab({ id: 'tab-2', label: 'Tab 2' }),
      ];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      await user.click(screen.getByText(/Close All/));

      expect(mockOnCloseAllTabs).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('dialog close functionality', () => {
    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const tabs = [createTab()];

      render(
        <TabManagementDialog
          isOpen={true}
          onClose={mockOnClose}
          tabs={tabs}
          activeTabId="test-tab-1"
          onSwitchTab={mockOnSwitchTab}
          onCloseTab={mockOnCloseTab}
          onCloseAllTabs={mockOnCloseAllTabs}
          onRenameTab={mockOnRenameTab}
        />
      );

      await user.click(screen.getByLabelText('Close dialog'));

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
