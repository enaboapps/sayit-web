'use client';

import ReplySuggestions from '../typing/ReplySuggestions';
import BottomSheet from '../ui/BottomSheet';

interface SuggestionsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  history: string[];
  enabled: boolean;
  onSelectSuggestion: (suggestion: string) => void;
  onCountChange?: (count: number) => void;
}

export default function SuggestionsPopover({
  isOpen,
  onClose,
  history,
  enabled,
  onSelectSuggestion,
  onCountChange,
}: SuggestionsPopoverProps) {
  const handleSelect = (suggestion: string) => {
    onSelectSuggestion(suggestion);
    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Suggestions"
      snapPoints={[40]}
      initialSnap={0}
    >
      <div className="px-4 py-3">
        <ReplySuggestions
          history={history}
          enabled={enabled}
          onSelectSuggestion={handleSelect}
          variant="card"
          onCountChange={onCountChange}
        />
      </div>
    </BottomSheet>
  );
}
