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
    <div className="flex-1 min-h-0 overflow-hidden md:min-h-[120px]">
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
        className="w-full h-full overflow-y-auto bg-transparent text-foreground placeholder:text-text-tertiary px-6 py-5 resize-none focus:outline-none"
        style={{ fontSize: `${textSizePx}px`, lineHeight: '1.6' }}
      />
    </div>
  );
}
