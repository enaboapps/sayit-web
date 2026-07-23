import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LiveTypingBottomSheet from '@/app/components/live-typing/LiveTypingBottomSheet';

jest.mock('@/app/components/ui/BottomSheet', () => ({
  __esModule: true,
  default: ({
    isOpen,
    children,
    title,
    snapPoints,
    initialSnap,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
    title?: string;
    snapPoints?: number[];
    initialSnap?: number;
  }) =>
    isOpen ? (
      <div
        role="dialog"
        aria-label={title}
        data-snap-points={JSON.stringify(snapPoints)}
        data-initial-snap={initialSnap}
      >
        {children}
      </div>
    ) : null,
}));

jest.mock('qrcode.react', () => ({
  QRCodeSVG: ({
    value,
    level,
    marginSize,
    bgColor,
    fgColor,
    title,
  }: {
    value: string;
    level: string;
    marginSize: number;
    bgColor: string;
    fgColor: string;
    title: string;
  }) => (
    <svg
      role="img"
      aria-label={title}
      data-testid="live-typing-qr"
      data-value={value}
      data-level={level}
      data-margin-size={marginSize}
      data-background={bgColor}
      data-foreground={fgColor}
    />
  ),
}));

const shareableLink = 'https://app.sayitaac.com/typing-share/view/session-key';

function renderSheet(
  overrides: Partial<React.ComponentProps<typeof LiveTypingBottomSheet>> = {}
) {
  const props: React.ComponentProps<typeof LiveTypingBottomSheet> = {
    isOpen: true,
    onClose: jest.fn(),
    isSharing: true,
    isCreating: false,
    shareableLink,
    onStartSharing: jest.fn().mockResolvedValue(undefined),
    onEndSession: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  return {
    ...render(<LiveTypingBottomSheet {...props} />),
    props,
  };
}

function installClipboard() {
  const clipboard = {
    writeText: jest.fn().mockResolvedValue(undefined),
  };
  Object.defineProperty(navigator, 'clipboard', {
    value: clipboard,
    configurable: true,
    writable: true,
  });
  return clipboard;
}

describe('LiveTypingBottomSheet', () => {
  it('keeps the inactive sheet compact and starts sharing without a QR code', async () => {
    const user = userEvent.setup();
    const { props } = renderSheet({
      isSharing: false,
      shareableLink: null,
    });

    expect(screen.getByRole('dialog')).toHaveAttribute('data-snap-points', '[40]');
    expect(screen.getByRole('dialog')).toHaveAttribute('data-initial-snap', '0');
    expect(screen.queryByTestId('live-typing-qr')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Start Live Typing' }));

    expect(props.onStartSharing).toHaveBeenCalledTimes(1);
  });

  it('renders the exact share URL as an accessible, scanner-friendly QR code', () => {
    renderSheet();

    const qrCode = screen.getByRole('img', {
      name: 'QR code for Live Typing share link',
    });
    expect(qrCode).toHaveAttribute('data-value', shareableLink);
    expect(qrCode).toHaveAttribute('data-level', 'M');
    expect(qrCode).toHaveAttribute('data-margin-size', '4');
    expect(qrCode).toHaveAttribute('data-background', '#FFFFFF');
    expect(qrCode).toHaveAttribute('data-foreground', '#000000');
    expect(
      screen.getByText('Scan to open this Live Typing session on another device.')
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Live Typing share link')).toHaveValue(shareableLink);
    expect(screen.getByRole('dialog')).toHaveAttribute('data-snap-points', '[75,90]');
    expect(screen.getByRole('dialog')).toHaveAttribute('data-initial-snap', '1');
  });

  it('copies the share URL and announces success in the button name', async () => {
    const user = userEvent.setup();
    const clipboard = installClipboard();
    renderSheet();

    await user.click(screen.getByRole('button', { name: 'Copy Live Typing link' }));

    await waitFor(() => {
      expect(clipboard.writeText).toHaveBeenCalledWith(shareableLink);
    });
    expect(
      screen.getByRole('button', { name: 'Live Typing link copied' })
    ).toBeInTheDocument();
  });

  it('shows a preparation state and disables copy while the URL is unavailable', () => {
    renderSheet({ shareableLink: null });

    expect(screen.getByRole('status')).toHaveTextContent('Preparing share link…');
    expect(screen.queryByTestId('live-typing-qr')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy Live Typing link' })).toBeDisabled();
  });

  it('ends the session and closes the sheet', async () => {
    const user = userEvent.setup();
    const { props } = renderSheet();

    await user.click(screen.getByRole('button', { name: 'End Live Typing' }));

    await waitFor(() => {
      expect(props.onEndSession).toHaveBeenCalledTimes(1);
    });
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
