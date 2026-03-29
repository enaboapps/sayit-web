import React from 'react';
import { render, screen } from '@testing-library/react';
import ReplySuggestions from '@/app/components/typing/ReplySuggestions';

const mockUseOnlineStatus = jest.fn();

jest.mock('@/app/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'user-1' },
    loading: false,
  })),
}));

jest.mock('@/app/hooks/useSubscription', () => ({
  useSubscription: jest.fn(() => ({
    isActive: true,
    loading: false,
  })),
}));

jest.mock('@/lib/hooks/useReplySuggestions', () => ({
  useReplySuggestions: jest.fn(() => ({
    suggestions: [],
    isLoading: false,
    error: null,
    refresh: jest.fn(),
  })),
}));

jest.mock('@/lib/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => mockUseOnlineStatus(),
}));

describe('ReplySuggestions', () => {
  beforeEach(() => {
    mockUseOnlineStatus.mockReturnValue({
      isOnline: true,
      wasOffline: false,
      clearRecoveredState: jest.fn(),
    });
  });

  it('renders nothing when offline instead of showing a redundant message', () => {
    mockUseOnlineStatus.mockReturnValue({
      isOnline: false,
      wasOffline: false,
      clearRecoveredState: jest.fn(),
    });

    const { container } = render(
      <ReplySuggestions
        history={['One', 'Two', 'Three']}
        enabled={true}
        onSelectSuggestion={jest.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
