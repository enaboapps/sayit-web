'use client';

interface ComposerTextareaProps {
  onCompositionStart?: () => void;
  onCompositionEnd?: () => void;
  currentText: string;
  onTextChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  textSizePx: number;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onSelect: () => void;
  onClick: () => void;
  onKeyUp: () => void;
  onBlur: () => void;
}

export default function ComposerTextarea({
  onCompositionStart,
  onCompositionEnd,
  currentText,
  onTextChange,
  onKeyDown,
  textSizePx,
  textareaRef,
  onSelect,
  onClick,
  onKeyUp,
  onBlur,
}: ComposerTextareaProps) {
  return (
    <div className="relative min-h-0 flex-1 overflow-hidden bg-surface md:min-h-[120px]">
      <textarea
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        ref={textareaRef}
        value={currentText}
        onChange={(e) => onTextChange(e.target.value)}
        onSelect={onSelect}
        onClick={onClick}
        onKeyUp={onKeyUp}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        aria-label="Message"
        placeholder="Type your message here…"
        className="absolute inset-0 resize-none overflow-y-auto bg-transparent px-4 py-5 text-foreground placeholder:font-normal placeholder:text-text-secondary/80 focus:outline-none sm:px-6"
        style={{ fontSize: `${textSizePx}px`, lineHeight: '1.6' }}
      />
    </div>
  );
}
