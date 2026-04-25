import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavigateTile from '@/app/components/phrases/tiles/NavigateTile';

describe('NavigateTile', () => {
  const baseTile = {
    id: 'tile-1',
    targetBoardId: 'board-2',
    targetBoardName: 'Animals',
  };

  it('renders the live target board name and labels for navigation', () => {
    render(<NavigateTile tile={baseTile} onTap={jest.fn()} textSizePx={20} />);

    expect(screen.getByText('Animals')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Go to board: Animals' });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Animals')).toHaveStyle({ fontSize: '20px' });
    expect(button).not.toHaveAttribute('aria-disabled', 'true');
  });

  it('invokes onTap when tapped on a live target', async () => {
    const onTap = jest.fn();
    render(<NavigateTile tile={baseTile} onTap={onTap} textSizePx={20} />);

    await userEvent.click(screen.getByRole('button'));
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it('renders broken state when target name is null and ignores tap', async () => {
    const onTap = jest.fn();
    const broken = { ...baseTile, targetBoardName: null };
    render(<NavigateTile tile={broken} onTap={onTap} textSizePx={20} />);

    expect(screen.getByText('Target removed')).toBeInTheDocument();
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');

    await userEvent.click(button);
    expect(onTap).not.toHaveBeenCalled();
  });

  it('uses tap-to-edit when onEdit is supplied (edit mode)', async () => {
    const onTap = jest.fn();
    const onEdit = jest.fn();
    render(
      <NavigateTile
        tile={baseTile}
        onTap={onTap}
        onEdit={onEdit}
        textSizePx={20}
      />
    );

    await userEvent.click(screen.getByRole('button'));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onTap).not.toHaveBeenCalled();
  });

  it('broken-target tile in edit mode still allows tap-to-edit so the user can fix it', async () => {
    const onTap = jest.fn();
    const onEdit = jest.fn();
    const broken = { ...baseTile, targetBoardName: null };
    render(
      <NavigateTile
        tile={broken}
        onTap={onTap}
        onEdit={onEdit}
        textSizePx={20}
      />
    );

    const button = screen.getByRole('button');
    // aria-disabled is suppressed when an editor is wired in.
    expect(button).not.toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(button);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
