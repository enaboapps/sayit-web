'use client';

import BottomSheet from './BottomSheet';
import { Button } from './Button';

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isBusy?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  isBusy = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={isBusy ? () => undefined : onCancel}
      title={title}
      snapPoints={[34]}
      showHandle={false}
      showCloseButton={!isBusy}
      closeOnBackdropClick={!isBusy}
    >
      <div className="space-y-5 p-4">
        <p className="text-sm leading-6 text-text-secondary">{description}</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isBusy}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={isBusy}>
            {isBusy ? 'Deleting...' : confirmLabel}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
