'use client';

interface ComposerTextareaProps {
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
        ref={textareaRef}
        value={currentText}
        onChange={(e) => onTextChange(e.target.value)}
        onSelect={onSelect}
        onClick={onClick}
        onKeyUp={onKeyUp}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder="What do you want to say?"
        className="absolute inset-0 resize-none overflow-y-auto bg-transparent px-6 pb-24 pt-5 text-foreground placeholder:font-medium placeholder:text-text-tertiary focus:outline-none"
        style={{ fontSize: `${textSizePx}px`, lineHeight: '1.6' }}
      />
    </div>
  );
}
