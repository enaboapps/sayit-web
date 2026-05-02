import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders destructive copy and calls confirm from the app dialog', async () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();

    render(
      <ConfirmDialog
        isOpen
        title="Delete Board"
        description='Delete "Core"? This removes the board and all phrases in it.'
        confirmLabel="Delete Board"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByRole('dialog', { name: 'Delete Board' })).toBeInTheDocument();
    expect(screen.getByText('Delete "Core"? This removes the board and all phrases in it.')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Delete Board' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls cancel and disables actions while busy', async () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();

    const { rerender } = render(
      <ConfirmDialog
        isOpen
        title="Delete Tile"
        description='Delete "Food"? This removes the navigation link from this board.'
        confirmLabel="Delete Tile"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);

    rerender(
      <ConfirmDialog
        isOpen
        title="Delete Tile"
        description='Delete "Food"? This removes the navigation link from this board.'
        confirmLabel="Delete Tile"
        isBusy
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Deleting...' })).toBeDisabled();
  });
});
