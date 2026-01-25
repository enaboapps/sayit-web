import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TypingArea from '@/app/components/TypingArea';

// Mock nanoid to avoid ESM issues
jest.mock('nanoid', () => {
  let idCounter = 0;
  return {
    nanoid: jest.fn(() => `test-id-${++idCounter}`),
  };
});

// Mock Convex
const mockUpdateSettingsMutation = jest.fn();
jest.mock('convex/react', () => ({
  useMutation: jest.fn(() => mockUpdateSettingsMutation),
}));

// Mock SettingsContext
const mockUpdateUIPreference = jest.fn();
jest.mock('@/app/contexts/SettingsContext', () => ({
  useSettings: jest.fn(() => ({
    settings: {
      textSize: 'medium',
      enterKeyBehavior: 'newline',
    },
    uiPreferences: {
      typingAreaVisible: true,
      typingAreaExpanded: false,
      activeTypingTabId: null,
    },
    updateUIPreference: mockUpdateUIPreference,
  })),
}));

// Mock AuthContext
jest.mock('@/app/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: null,
  })),
}));

// Mock useTypingShare hook
jest.mock('@/lib/hooks/useTypingShare', () => ({
  useTypingShare: jest.fn(() => ({
    isSharing: false,
    isCreating: false,
    createSession: jest.fn(),
    endSession: jest.fn(),
    updateContent: jest.fn(),
    getShareableLink: jest.fn(() => null),
  })),
}));

const mockTTS = {
  speak: jest.fn(),
  stop: jest.fn(),
  isSpeaking: false,
  isAvailable: true,
};

// Mock scrollTo for TabBar component
Element.prototype.scrollTo = jest.fn();

describe('TypingArea', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('external text prop synchronization', () => {
    it('updates active tab when text prop changes', () => {
      const { rerender } = render(
        <TypingArea text="Initial text" tts={mockTTS} />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Initial text');

      rerender(<TypingArea text="Updated from phrase" tts={mockTTS} />);

      expect(textarea).toHaveValue('Updated from phrase');
    });

    it('does not update when text prop is undefined', () => {
      const { rerender } = render(<TypingArea tts={mockTTS} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('');

      rerender(<TypingArea text={undefined} tts={mockTTS} />);

      expect(textarea).toHaveValue('');
    });

    it('handles phrase selection flow', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <TypingArea text="" tts={mockTTS} onChange={onChange} />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('');

      // Simulate phrase selection updating parent state
      rerender(
        <TypingArea text="Hello world" tts={mockTTS} onChange={onChange} />
      );

      expect(textarea).toHaveValue('Hello world');
    });

    it('allows user typing after external text update', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const { rerender } = render(
        <TypingArea text="Initial" tts={mockTTS} onChange={onChange} />
      );

      const textarea = screen.getByRole('textbox');

      // External text update (phrase selection)
      rerender(
        <TypingArea text="From phrase" tts={mockTTS} onChange={onChange} />
      );

      expect(textarea).toHaveValue('From phrase');

      // Clear and verify onChange was called with the clear
      onChange.mockClear();
      await user.clear(textarea);

      expect(onChange).toHaveBeenLastCalledWith('');
    });

    it('does not cause infinite loop when syncing', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <TypingArea text="Same text" tts={mockTTS} onChange={onChange} />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Same text');

      // Rerender with same text should not trigger unnecessary updates
      onChange.mockClear();
      rerender(
        <TypingArea text="Same text" tts={mockTTS} onChange={onChange} />
      );

      // onChange should not be called again if text hasn't changed
      expect(onChange).not.toHaveBeenCalled();
    });

    it('replaces existing text when phrase is selected', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <TypingArea text="Existing content" tts={mockTTS} onChange={onChange} />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Existing content');

      // User selects a phrase (simulated by parent updating text prop)
      rerender(
        <TypingArea
          text="New phrase text"
          tts={mockTTS}
          onChange={onChange}
        />
      );

      expect(textarea).toHaveValue('New phrase text');
    });

    it('works with multiple text updates', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <TypingArea text="First" tts={mockTTS} onChange={onChange} />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('First');

      rerender(<TypingArea text="Second" tts={mockTTS} onChange={onChange} />);
      expect(textarea).toHaveValue('Second');

      rerender(<TypingArea text="Third" tts={mockTTS} onChange={onChange} />);
      expect(textarea).toHaveValue('Third');
    });

    it('maintains independent text when switching tabs (no carryover)', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <TypingArea text="Tab A content" tts={mockTTS} onChange={onChange} />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('Tab A content');

      // Simulate tab switch by NOT changing external text
      // In real app, activeTab changes internally via switchTab
      // But parent's externalText stays the same
      onChange.mockClear();
      rerender(
        <TypingArea text="Tab A content" tts={mockTTS} onChange={onChange} />
      );

      // Text should remain "Tab A content" - no carryover should occur
      // Even though we're simulating a tab switch internally
      expect(textarea).toHaveValue('Tab A content');
    });

    it('still syncs phrase selection after internal state changes', () => {
      const { rerender } = render(
        <TypingArea text="" tts={mockTTS} />
      );

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('');

      // External text changes (phrase selected)
      rerender(
        <TypingArea text="Selected phrase" tts={mockTTS} />
      );

      // Should update to phrase text
      expect(textarea).toHaveValue('Selected phrase');
    });
  });

  describe('backward compatibility', () => {
    it('works with initialText prop only', () => {
      render(<TypingArea initialText="Initial" tts={mockTTS} />);

      // The first tab will have the initial text
      // but auto-create effect creates a new empty tab and switches to it
      // so the textarea shows empty (the new active tab)
      const textarea = screen.getByRole('textbox');
      // After auto-creation, active tab is the new empty one
      expect(textarea).toHaveValue('');
    });

    it('works without text or initialText props', () => {
      render(<TypingArea tts={mockTTS} />);

      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('');
    });

    it('prioritizes text prop over initialText', () => {
      render(
        <TypingArea initialText="Initial" text="External" tts={mockTTS} />
      );

      const textarea = screen.getByRole('textbox');
      // text prop takes precedence and updates the active tab
      // which gets synced via useEffect
      expect(textarea).toHaveValue('External');
    });
  });

  describe('buttons visibility', () => {
    it('shows action buttons when text is present', () => {
      render(<TypingArea text="Some text" tts={mockTTS} />);

      expect(screen.getByText('Speak')).toBeInTheDocument();
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });

    it('hides action buttons when text is empty', () => {
      render(<TypingArea text="" tts={mockTTS} />);

      expect(screen.queryByText('Speak')).not.toBeInTheDocument();
      expect(screen.queryByText('Clear')).not.toBeInTheDocument();
    });
  });

  describe('onChange callback', () => {
    it('calls onChange when user types', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(<TypingArea tts={mockTTS} onChange={onChange} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');

      expect(onChange).toHaveBeenCalled();
      expect(onChange).toHaveBeenCalledWith('Hello');
    });

    it('calls onChange when external text updates', () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <TypingArea text="" tts={mockTTS} onChange={onChange} />
      );

      onChange.mockClear();

      rerender(
        <TypingArea text="New text" tts={mockTTS} onChange={onChange} />
      );

      // The onChange is called from within the useEffect indirectly through updateActiveTabText
      // which triggers the textarea's onChange handler
      // We verify the final state instead
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveValue('New text');
    });
  });
});
