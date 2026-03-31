import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Tab from '@/app/components/typing-tabs/Tab';
import { TypingTab } from '@/app/types/typing-tabs';

const createTab = (overrides: Partial<TypingTab> = {}): TypingTab => ({
  id: 'test-tab-1',
  label: 'Test Tab',
  text: 'Test content',
  createdAt: Date.now(),
  lastModified: Date.now(),
  isCustomLabel: false,
  ...overrides,
});

describe('Tab', () => {
  const mockOnSelect = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnRename = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders tab label', () => {
      const tab = createTab({ label: 'My Tab' });
      render(
        <Tab
          tab={tab}
          isActive={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onRename={mockOnRename}
        />
      );

      expect(screen.getByText('My Tab')).toBeInTheDocument();
    });

    it('applies active styling when active', () => {
      const tab = createTab();
      const { container } = render(
        <Tab
          tab={tab}
          isActive={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onRename={mockOnRename}
        />
      );

      const tabElement = container.firstChild as HTMLElement;
      expect(tabElement.className).toContain('bg-primary-500');
      expect(tabElement.className).toContain('text-white');
      expect(tabElement.className).toContain('shadow-lg');
    });

    it('applies inactive styling when not active', () => {
      const tab = createTab();
      const { container } = render(
        <Tab
          tab={tab}
          isActive={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onRename={mockOnRename}
        />
      );

      const tabElement = container.firstChild as HTMLElement;
      expect(tabElement.className).toContain('bg-surface');
      expect(tabElement.className).toContain('opacity-50');
    });

    it('shows close button only when active', () => {
      const tab = createTab({ label: 'Test Tab' });
      const { rerender } = render(
        <Tab
          tab={tab}
          isActive={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onRename={mockOnRename}
        />
      );

      expect(screen.queryByLabelText('Close Test Tab')).not.toBeInTheDocument();

      rerender(
        <Tab
          tab={tab}
          isActive={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onRename={mockOnRename}
        />
      );

      expect(screen.getByLabelText('Close Test Tab')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onSelect when tab is clicked', async () => {
      const user = userEvent.setup();
      const tab = createTab();

      render(
        <Tab
          tab={tab}
          isActive={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onRename={mockOnRename}
        />
      );

      await user.click(screen.getByText('Test Tab'));

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      const tab = createTab({ label: 'Test Tab' });

      render(
        <Tab
          tab={tab}
          isActive={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onRename={mockOnRename}
        />
      );

      await user.click(screen.getByLabelText('Close Test Tab'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onSelect when close button is clicked', async () => {
      const user = userEvent.setup();
      const tab = createTab({ label: 'Test Tab' });

      render(
        <Tab
          tab={tab}
          isActive={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onRename={mockOnRename}
        />
      );

      await user.click(screen.getByLabelText('Close Test Tab'));

      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });

  describe('edit mode', () => {
    it('enters edit mode on double-click', async () => {
      const user = userEvent.setup();
      const tab = createTab({ label: 'Original' });

      render(
        <Tab
          tab={tab}
          isActive={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onRename={mockOnRename}
        />
      );

      await user.dblClick(screen.getByText('Original'));

      expect(screen.getByDisplayValue('Original')).toBeInTheDocument();
      expect(screen.queryByText('Original')).not.toBeInTheDocument();
    });

    it('saves new label on Enter key', async () => {
      const user = userEvent.setup();
      const tab = createTab({ label: 'Original' });

      render(
        <Tab
          tab={tab}
          isActive={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onRename={mockOnRename}
        />
      );

      await user.dblClick(screen.getByText('Original'));

      const input = screen.getByDisplayValue('Original');
      await user.clear(input);
      await user.type(input, 'New Label');
      await user.keyboard('{Enter}');

      expect(mockOnRename).toHaveBeenCalledWith('New Label');
    });

    it('cancels edit on Escape key', async () => {
      const user = userEvent.setup();
      const tab = createTab({ label: 'Original' });

      render(
        <Tab
          tab={tab}
          isActive={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onRename={mockOnRename}
        />
      );

      await user.dblClick(screen.getByText('Original'));

      const input = screen.getByDisplayValue('Original');
      await user.clear(input);
      await user.type(input, 'New Label');
      await user.keyboard('{Escape}');

      expect(mockOnRename).not.toHaveBeenCalled();
      expect(screen.getByText('Original')).toBeInTheDocument();
    });

    it('saves new label on blur', async () => {
      const user = userEvent.setup();
      const tab = createTab({ label: 'Original' });

      render(
        <Tab
          tab={tab}
          isActive={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onRename={mockOnRename}
        />
      );

      await user.dblClick(screen.getByText('Original'));

      const input = screen.getByDisplayValue('Original');
      await user.clear(input);
      await user.type(input, 'New Label');
      await user.tab(); // Blur by tabbing away

      expect(mockOnRename).toHaveBeenCalledWith('New Label');
    });

    it('does not save if label is unchanged', async () => {
      const user = userEvent.setup();
      const tab = createTab({ label: 'Original' });

      render(
        <Tab
          tab={tab}
          isActive={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onRename={mockOnRename}
        />
      );

      await user.dblClick(screen.getByText('Original'));
      await user.tab(); // Blur without changing

      expect(mockOnRename).not.toHaveBeenCalled();
    });

    it('does not save if label is empty', async () => {
      const user = userEvent.setup();
      const tab = createTab({ label: 'Original' });

      render(
        <Tab
          tab={tab}
          isActive={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onRename={mockOnRename}
        />
      );

      await user.dblClick(screen.getByText('Original'));

      const input = screen.getByDisplayValue('Original');
      await user.clear(input);
      await user.tab();

      expect(mockOnRename).not.toHaveBeenCalled();
      expect(screen.getByText('Original')).toBeInTheDocument();
    });

    it('does not save if label is only whitespace', async () => {
      const user = userEvent.setup();
      const tab = createTab({ label: 'Original' });

      render(
        <Tab
          tab={tab}
          isActive={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onRename={mockOnRename}
        />
      );

      await user.dblClick(screen.getByText('Original'));

      const input = screen.getByDisplayValue('Original');
      await user.clear(input);
      await user.type(input, '   ');
      await user.tab();

      expect(mockOnRename).not.toHaveBeenCalled();
      expect(screen.getByText('Original')).toBeInTheDocument();
    });

    it('does not call onSelect when clicking input in edit mode', async () => {
      const user = userEvent.setup();
      const tab = createTab();

      render(
        <Tab
          tab={tab}
          isActive={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onRename={mockOnRename}
        />
      );

      await user.dblClick(screen.getByText('Test Tab'));

      const input = screen.getByDisplayValue('Test Tab');
      await user.click(input);

      // Double-click triggers onClick twice, clicking input should not add a third call
      expect(mockOnSelect).toHaveBeenCalledTimes(2);
    });

    it('syncs editLabel when tab.label changes while not editing', () => {
      const tab = createTab({ label: 'Original' });
      const { rerender } = render(
        <Tab
          tab={tab}
          isActive={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onRename={mockOnRename}
        />
      );

      const updatedTab = { ...tab, label: 'Updated' };
      rerender(
        <Tab
          tab={updatedTab}
          isActive={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
          onRename={mockOnRename}
        />
      );

      expect(screen.getByText('Updated')).toBeInTheDocument();
    });
  });
});
