import { act, render, screen } from '@testing-library/react';
import {
  BoardNavStackProvider,
  useBoardNavStack,
} from '@/app/contexts/BoardNavStackContext';

function Probe() {
  const stack = useBoardNavStack();
  return (
    <div>
      <span data-testid="stack">{stack.stack.join(',')}</span>
      <span data-testid="canPop">{stack.canPop ? 'yes' : 'no'}</span>
      <button onClick={() => stack.push('a')}>push-a</button>
      <button onClick={() => stack.push('b')}>push-b</button>
      <button
        onClick={() => {
          const popped = stack.pop();
          const slot = document.querySelector('[data-testid="last-popped"]');
          if (slot) slot.textContent = popped ?? 'null';
        }}
      >
        pop
      </button>
      <button onClick={() => stack.clear()}>clear</button>
      <span data-testid="last-popped">-</span>
    </div>
  );
}

function renderProbe() {
  return render(
    <BoardNavStackProvider>
      <Probe />
    </BoardNavStackProvider>
  );
}

describe('BoardNavStackContext', () => {
  it('starts empty with canPop=false', () => {
    renderProbe();
    expect(screen.getByTestId('stack').textContent).toBe('');
    expect(screen.getByTestId('canPop').textContent).toBe('no');
  });

  it('push then pop returns the most recent id (LIFO)', () => {
    renderProbe();
    act(() => screen.getByText('push-a').click());
    act(() => screen.getByText('push-b').click());

    expect(screen.getByTestId('stack').textContent).toBe('a,b');
    expect(screen.getByTestId('canPop').textContent).toBe('yes');

    act(() => screen.getByText('pop').click());
    expect(screen.getByTestId('last-popped').textContent).toBe('b');
    expect(screen.getByTestId('stack').textContent).toBe('a');
  });

  it('pop on empty stack returns null and leaves stack empty', () => {
    renderProbe();
    act(() => screen.getByText('pop').click());
    expect(screen.getByTestId('last-popped').textContent).toBe('null');
    expect(screen.getByTestId('stack').textContent).toBe('');
  });

  it('clear empties the stack', () => {
    renderProbe();
    act(() => screen.getByText('push-a').click());
    act(() => screen.getByText('push-b').click());
    act(() => screen.getByText('clear').click());
    expect(screen.getByTestId('stack').textContent).toBe('');
    expect(screen.getByTestId('canPop').textContent).toBe('no');
  });

  it('two synchronous pops in the same handler return distinct ids (no stale-closure bug)', () => {
    function DoublePopProbe() {
      const stack = useBoardNavStack();
      return (
        <div>
          <span data-testid="depth">{stack.stack.length}</span>
          <span data-testid="popped-pair" />
          <button
            onClick={() => {
              stack.push('a');
              stack.push('b');
              stack.push('c');
            }}
          >
            seed
          </button>
          <button
            onClick={() => {
              const first = stack.pop();
              const second = stack.pop();
              const slot = document.querySelector('[data-testid="popped-pair"]');
              if (slot) slot.textContent = `${first ?? 'null'},${second ?? 'null'}`;
            }}
          >
            double-pop
          </button>
        </div>
      );
    }
    render(
      <BoardNavStackProvider>
        <DoublePopProbe />
      </BoardNavStackProvider>
    );

    act(() => screen.getByText('seed').click());
    expect(Number(screen.getByTestId('depth').textContent)).toBe(3);
    act(() => screen.getByText('double-pop').click());

    // Must pop 'c' then 'b'; if pop() captured a stale stack value, both
    // calls would have returned 'c'.
    expect(screen.getByTestId('popped-pair').textContent).toBe('c,b');
    expect(Number(screen.getByTestId('depth').textContent)).toBe(1);
  });

  it('caps depth at 32 entries (drops oldest when full)', () => {
    function DepthProbe() {
      const stack = useBoardNavStack();
      return (
        <div>
          <span data-testid="depth">{stack.stack.length}</span>
          <span data-testid="first">{stack.stack[0] ?? '-'}</span>
          <button
            onClick={() => {
              for (let i = 0; i < 40; i++) stack.push(`b${i}`);
            }}
          >
            spam
          </button>
        </div>
      );
    }
    render(
      <BoardNavStackProvider>
        <DepthProbe />
      </BoardNavStackProvider>
    );

    act(() => screen.getByText('spam').click());
    expect(Number(screen.getByTestId('depth').textContent)).toBe(32);
    // Oldest 8 entries (b0..b7) were dropped; first remaining should be b8.
    expect(screen.getByTestId('first').textContent).toBe('b8');
  });
});
