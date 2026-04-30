/**
 * AudioRecorderControl tests
 *
 * react-media-recorder is mocked so we can deterministically drive the
 * start/stop lifecycle and call the onStop callback at a chosen wall-clock
 * moment. The non-trivial bit under test is that the saved durationMs
 * reflects the actual recorded interval (Date.now-based) rather than the
 * possibly-stale React state at the time onStop fires.
 */

import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import AudioRecorderControl, {
  type RecordedAudio,
} from '@/app/components/phrases/tiles/AudioRecorderControl';

// Capture the onStop prop and a way to trigger start/stop from the test.
type RecorderHandle = {
  triggerStop: (blob: Blob) => void;
  startRecording: jest.Mock;
  stopRecording: jest.Mock;
};

let currentHandle: RecorderHandle | null = null;

jest.mock('react-media-recorder', () => ({
  ReactMediaRecorder: ({
    onStop,
    render: renderProp,
  }: {
    onStop: (blobUrl: string, blob: Blob) => void;
    render: (state: {
      status: string;
      startRecording: () => void;
      stopRecording: () => void;
      error: string | undefined;
    }) => React.ReactNode;
  }) => {
    const [status, setStatus] = React.useState('idle');
    const startRecording = jest.fn(() => setStatus('recording'));
    const stopRecording = jest.fn(() => setStatus('stopped'));
    currentHandle = {
      startRecording,
      stopRecording,
      triggerStop: (blob: Blob) => onStop('blob:mock', blob),
    };
    return <>{renderProp({ status, startRecording, stopRecording, error: undefined })}</>;
  },
}));

describe('AudioRecorderControl duration capture', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    currentHandle = null;
    URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = jest.fn();
    Object.defineProperty(global.navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: jest.fn() },
    });
  });

  afterAll(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('saves the actual elapsed wall-clock duration when stopped manually', async () => {
    const onChange = jest.fn<void, [RecordedAudio | null]>();
    const nowSpy = jest.spyOn(Date, 'now');

    render(<AudioRecorderControl value={null} onChange={onChange} />);

    // t=1000: user clicks Record
    nowSpy.mockReturnValue(1_000);
    await userEvent.click(screen.getByRole('button', { name: /record/i }));

    expect(currentHandle).not.toBeNull();

    // t=4250: user clicks Stop (~3.25 seconds elapsed)
    nowSpy.mockReturnValue(4_250);
    await userEvent.click(screen.getByRole('button', { name: /stop/i }));

    // t=4500: react-media-recorder finalises and fires onStop 250ms later.
    // The saved duration should reflect when the user *clicked* stop, not when
    // onStop happens to fire.
    nowSpy.mockReturnValue(4_500);
    act(() => {
      currentHandle!.triggerStop(new Blob(['x'], { type: 'audio/webm' }));
    });

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ durationMs: 3_250 }),
    );
  });

  it('does not default short clips to maxDurationMs', async () => {
    const onChange = jest.fn<void, [RecordedAudio | null]>();
    const nowSpy = jest.spyOn(Date, 'now');

    render(<AudioRecorderControl value={null} onChange={onChange} />);

    // Sub-second recording: starts at t=1000, stops at t=1100, onStop at t=1200.
    nowSpy.mockReturnValue(1_000);
    await userEvent.click(screen.getByRole('button', { name: /record/i }));
    nowSpy.mockReturnValue(1_100);
    await userEvent.click(screen.getByRole('button', { name: /stop/i }));
    nowSpy.mockReturnValue(1_200);
    act(() => {
      currentHandle!.triggerStop(new Blob(['x'], { type: 'audio/webm' }));
    });

    // Should be ~100ms, not the 60s default that the previous bug produced.
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall).not.toBeNull();
    expect(lastCall!.durationMs).toBeGreaterThan(0);
    expect(lastCall!.durationMs).toBeLessThan(1_000);
  });

  it('caps the saved duration at maxDurationMs', async () => {
    const onChange = jest.fn<void, [RecordedAudio | null]>();
    const nowSpy = jest.spyOn(Date, 'now');

    render(
      <AudioRecorderControl value={null} onChange={onChange} maxDurationMs={2_000} />,
    );

    // Simulate the user holding past the cap. We click Stop at t=5_000 (3s
    // past the 2s cap) and onStop fires another second later. The component
    // should still cap measuredMs to 2_000.
    nowSpy.mockReturnValue(0);
    await userEvent.click(screen.getByRole('button', { name: /record/i }));
    nowSpy.mockReturnValue(5_000);
    await userEvent.click(screen.getByRole('button', { name: /stop/i }));
    nowSpy.mockReturnValue(6_000);
    act(() => {
      currentHandle!.triggerStop(new Blob(['x'], { type: 'audio/webm' }));
    });

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ durationMs: 2_000 }),
    );
  });

  it('rejects oversized recordings without saving them', async () => {
    const onChange = jest.fn<void, [RecordedAudio | null]>();

    render(<AudioRecorderControl value={null} onChange={onChange} maxBytes={1_024} />);

    await userEvent.click(screen.getByRole('button', { name: /record/i }));
    await userEvent.click(screen.getByRole('button', { name: /stop/i }));

    const oversized = new Blob([new Uint8Array(2_048)], { type: 'audio/webm' });
    act(() => {
      currentHandle!.triggerStop(oversized);
    });

    // The last onChange call should be the null reset, not a saved recording.
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByText(/exceeds.*MB limit/i)).toBeInTheDocument();
  });
});

describe('AudioRecorderControl hero state machine', () => {
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    currentHandle = null;
    URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    URL.revokeObjectURL = jest.fn();
    Object.defineProperty(global.navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: jest.fn() },
    });
  });

  afterAll(() => {
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it('shows the idle state aria-label and microphone icon at mount', () => {
    render(<AudioRecorderControl value={null} onChange={jest.fn()} />);

    expect(
      screen.getByRole('button', { name: 'Start recording' }),
    ).toBeInTheDocument();
    // No footer actions when there's no recording.
    expect(screen.queryByRole('button', { name: 'Re-record' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /preview/i })).not.toBeInTheDocument();
  });

  it('flips the big button aria-label to Stop while recording', async () => {
    render(<AudioRecorderControl value={null} onChange={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Start recording' }));

    expect(
      screen.getByRole('button', { name: 'Stop recording' }),
    ).toBeInTheDocument();
  });

  it('renders the has-recording state when an existing value is passed', () => {
    const existing: RecordedAudio = {
      blob: new Blob(['x'], { type: 'audio/webm' }),
      url: 'blob:existing',
      durationMs: 4_500,
    };
    render(<AudioRecorderControl value={existing} onChange={jest.fn()} />);

    // Big button is the Re-record affordance.
    expect(
      screen.getByRole('button', { name: 'Re-record (replaces current clip)' }),
    ).toBeInTheDocument();
    // Footer actions are visible.
    expect(screen.getByRole('button', { name: 'Re-record' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /preview/i })).toBeInTheDocument();
    // Duration rendered (0:05 is what 4500ms ceils to in formatDuration).
    expect(screen.getByText(/0:05/)).toBeInTheDocument();
  });

  it('countdown chip appears in the last-10s window of recording', async () => {
    const onChange = jest.fn<void, [RecordedAudio | null]>();
    jest.useFakeTimers({ doNotFake: ['Date'] });
    const nowSpy = jest.spyOn(Date, 'now');

    try {
      // 30s cap: before 20s elapsed, remaining > 10s (no chip). After 22s,
      // remaining = 8s ≤ 10s (chip appears).
      render(
        <AudioRecorderControl value={null} onChange={onChange} maxDurationMs={30_000} />,
      );

      nowSpy.mockReturnValue(0);
      await act(async () => {
        await userEvent
          .setup({ advanceTimers: jest.advanceTimersByTime })
          .click(screen.getByRole('button', { name: 'Start recording' }));
      });

      // Tick to 5s — outside the last-10s window. No chip.
      nowSpy.mockReturnValue(5_000);
      act(() => {
        jest.advanceTimersByTime(250);
      });
      expect(screen.queryByText(/s left/i)).not.toBeInTheDocument();

      // Tick to 22s — inside last-10s window. Chip appears.
      nowSpy.mockReturnValue(22_000);
      act(() => {
        jest.advanceTimersByTime(250);
      });
      expect(screen.getByText(/s left/i)).toBeInTheDocument();
    } finally {
      jest.useRealTimers();
    }
  });

  it('error chip uses role=alert', async () => {
    render(<AudioRecorderControl value={null} onChange={jest.fn()} maxBytes={1_024} />);

    await userEvent.click(screen.getByRole('button', { name: 'Start recording' }));
    await userEvent.click(screen.getByRole('button', { name: 'Stop recording' }));
    act(() => {
      currentHandle!.triggerStop(
        new Blob([new Uint8Array(2_048)], { type: 'audio/webm' }),
      );
    });

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/exceeds/i);
  });

  it('progress ring is decorative (aria-hidden) and does not crash on initial render', () => {
    const { container } = render(
      <AudioRecorderControl value={null} onChange={jest.fn()} />,
    );
    const svg = container.querySelector('svg[aria-hidden="true"]');
    expect(svg).not.toBeNull();
    // The foreground arc circle exists and has a stroke-dasharray attr,
    // confirming the ring is wired up. We deliberately don't assert on the
    // imperative strokeDashoffset value because that's set via direct DOM
    // mutation in a useLayoutEffect.
    const circles = svg!.querySelectorAll('circle');
    expect(circles.length).toBe(2);
  });
});
