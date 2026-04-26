import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CopyPasteBottomSheet from '@/app/components/composer/CopyPasteBottomSheet';

// Render BottomSheet's children directly so we can assert on the inner buttons
// without dealing with framer-motion's animation lifecycle.
jest.mock('@/app/components/ui/BottomSheet', () => ({
  __esModule: true,
  default: ({
    isOpen,
    children,
    title,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
    title?: string;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

interface ClipboardStub {
  writeText: jest.Mock;
  readText: jest.Mock;
}

/**
 * Install a mock clipboard. MUST be called AFTER `userEvent.setup()` because
 * userEvent v14 installs its own clipboard polyfill at setup time, which would
 * otherwise overwrite our stub.
 */
function installClipboard(
  overrides: Partial<{ writeText: jest.Mock; readText: jest.Mock | undefined }> = {}
): ClipboardStub {
  const stub = {
    writeText: overrides.writeText ?? jest.fn().mockResolvedValue(undefined),
    readText: overrides.readText ?? jest.fn().mockResolvedValue(''),
  };
  Object.defineProperty(navigator, 'clipboard', {
    value: stub,
    configurable: true,
    writable: true,
  });
  return stub as ClipboardStub;
}

describe('CopyPasteBottomSheet', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when closed', () => {
    render(
      <CopyPasteBottomSheet
        isOpen={false}
        onClose={jest.fn()}
        currentText="hello"
        onPaste={jest.fn()}
      />
    );

    expect(screen.queryByRole('button', { name: /copy all text/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /paste from clipboard/i })).not.toBeInTheDocument();
  });

  it('renders both action buttons when open', () => {
    render(
      <CopyPasteBottomSheet
        isOpen={true}
        onClose={jest.fn()}
        currentText="hello"
        onPaste={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /copy all text/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /paste from clipboard/i })).toBeInTheDocument();
  });

  it('disables Copy when current text is empty or whitespace', () => {
    render(
      <CopyPasteBottomSheet
        isOpen={true}
        onClose={jest.fn()}
        currentText="   "
        onPaste={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /copy all text/i })).toBeDisabled();
  });

  it('writes the current text to the clipboard and shows a checkmark on copy', async () => {
    const user = userEvent.setup();
    const clipboard = installClipboard();

    render(
      <CopyPasteBottomSheet
        isOpen={true}
        onClose={jest.fn()}
        currentText="payload"
        onPaste={jest.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /copy all text/i }));

    await waitFor(() => {
      expect(clipboard.writeText).toHaveBeenCalledWith('payload');
    });
    await waitFor(() => {
      expect(screen.getByTestId('copy-success')).toBeInTheDocument();
    });
  });

  it('closes the sheet shortly after a successful copy', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    installClipboard();
    const onClose = jest.fn();

    render(
      <CopyPasteBottomSheet
        isOpen={true}
        onClose={onClose}
        currentText="payload"
        onPaste={jest.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /copy all text/i }));

    // Allow the writeText promise to resolve before advancing timers.
    await act(async () => {
      await Promise.resolve();
    });
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('reads from the clipboard, calls onPaste, and closes the sheet on paste', async () => {
    const user = userEvent.setup();
    installClipboard({ readText: jest.fn().mockResolvedValue('pasted!') });
    const onPaste = jest.fn();
    const onClose = jest.fn();

    render(
      <CopyPasteBottomSheet
        isOpen={true}
        onClose={onClose}
        currentText=""
        onPaste={onPaste}
      />
    );

    await user.click(screen.getByRole('button', { name: /paste from clipboard/i }));

    await waitFor(() => {
      expect(onPaste).toHaveBeenCalledWith('pasted!');
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows a permission error and keeps the sheet open when readText rejects', async () => {
    // The component intentionally console.errors when clipboard read fails.
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    installClipboard({ readText: jest.fn().mockRejectedValue(new Error('denied')) });
    const onPaste = jest.fn();
    const onClose = jest.fn();

    render(
      <CopyPasteBottomSheet
        isOpen={true}
        onClose={onClose}
        currentText=""
        onPaste={onPaste}
      />
    );

    await user.click(screen.getByRole('button', { name: /paste from clipboard/i }));

    await waitFor(() => {
      expect(screen.getByText(/check browser permissions/i)).toBeInTheDocument();
    });
    expect(onPaste).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('shows an empty-clipboard error when readText returns an empty string', async () => {
    const user = userEvent.setup();
    installClipboard({ readText: jest.fn().mockResolvedValue('') });
    const onPaste = jest.fn();
    const onClose = jest.fn();

    render(
      <CopyPasteBottomSheet
        isOpen={true}
        onClose={onClose}
        currentText=""
        onPaste={onPaste}
      />
    );

    await user.click(screen.getByRole('button', { name: /paste from clipboard/i }));

    await waitFor(() => {
      expect(screen.getByText(/clipboard is empty/i)).toBeInTheDocument();
    });
    expect(onPaste).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows an unsupported-browser error when clipboard.readText is missing', async () => {
    const user = userEvent.setup();
    // Install a clipboard with writeText only (no readText) — simulates a
    // browser without paste support.
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: jest.fn() },
      configurable: true,
      writable: true,
    });
    const onPaste = jest.fn();

    render(
      <CopyPasteBottomSheet
        isOpen={true}
        onClose={jest.fn()}
        currentText=""
        onPaste={onPaste}
      />
    );

    await user.click(screen.getByRole('button', { name: /paste from clipboard/i }));

    await waitFor(() => {
      expect(screen.getByText(/doesn't support pasting/i)).toBeInTheDocument();
    });
    expect(onPaste).not.toHaveBeenCalled();
  });
});
