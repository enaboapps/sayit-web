'use client';

type EnterKeyBehavior = 'newline' | 'speak' | 'clear' | 'speakAndClear';

type DoubleEnterHintProps = {
  action: EnterKeyBehavior;
  remainingMs: number;
  className?: string;
};

const ACTION_LABELS: Record<EnterKeyBehavior, string> = {
  newline: 'new line',
  speak: 'speak',
  clear: 'clear',
  speakAndClear: 'speak and clear',
};

export default function DoubleEnterHint({ action, remainingMs, className }: DoubleEnterHintProps) {
  const seconds = Math.max(1, Math.ceil(remainingMs / 1000));

  return (
    <div className={className}>
      Press Enter again to {ACTION_LABELS[action]} ({seconds}s)
    </div>
  );
}
