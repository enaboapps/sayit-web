import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LiveTypingLinkModal from '@/app/components/live-typing/LiveTypingLinkModal';

describe('LiveTypingLinkModal', () => {
  it('starts a live typing session when no shareable link exists yet', async () => {
    const user = userEvent.setup();
    const onStartSharing = jest.fn().mockResolvedValue(undefined);

    render(
      <LiveTypingLinkModal
        shareableLink={null}
        isCreating={false}
        onStartSharing={onStartSharing}
        onClose={jest.fn()}
        onEndSession={jest.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Start Live Typing' }));

    expect(onStartSharing).toHaveBeenCalledTimes(1);
  });

  it('shows sharing controls when a shareable link exists', () => {
    render(
      <LiveTypingLinkModal
        shareableLink="https://example.com/typing-share/view/session-key"
        isCreating={false}
        onStartSharing={jest.fn()}
        onClose={jest.fn()}
        onEndSession={jest.fn()}
      />
    );

    expect(screen.getByDisplayValue('https://example.com/typing-share/view/session-key')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'End Live Typing' })).toBeInTheDocument();
  });
});
