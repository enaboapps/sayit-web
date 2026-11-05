import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQuery, useMutation } from 'convex/react';
import CreateBoardModal from '@/app/components/dashboard/CreateBoardModal';
import { getFunctionName } from 'convex/server';

jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

const mockOnClose = jest.fn();
const mockAddBoard = jest.fn();
const mockAssignBoard = jest.fn();

describe('CreateBoardModal', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (useQuery as jest.Mock).mockReturnValue([]);
    (useMutation as jest.Mock).mockImplementation((mutation) =>
      getFunctionName(mutation) === 'phraseBoards:assignBoardToClient' ? mockAssignBoard : mockAddBoard
    );
  });

  it('renders modal with board name input', () => {
    render(<CreateBoardModal communicatorId="client-1" onClose={mockOnClose} />);

    expect(screen.getByRole('dialog', { name: 'Add Board for Client' })).toBeInTheDocument();
    expect(screen.getByLabelText(/board name/i)).toBeInTheDocument();
    expect(screen.getByText(/permission level/i)).toBeInTheDocument();
  });

  it('renders access level options', () => {
    render(<CreateBoardModal communicatorId="client-1" onClose={mockOnClose} />);

    expect(screen.getByText('View only')).toBeInTheDocument();
    expect(screen.getByText('Can edit')).toBeInTheDocument();
  });

  it('defaults to view-only access level', () => {
    render(<CreateBoardModal communicatorId="client-1" onClose={mockOnClose} />);

    // View only button should have selected styling (checking for the ring class)
    const viewOnlyButton = screen.getByText('View only').closest('button');
    expect(viewOnlyButton).toHaveClass('border-primary-500');
  });

  it('allows switching access level to edit', async () => {
    render(<CreateBoardModal communicatorId="client-1" onClose={mockOnClose} />);

    const editButton = screen.getByText('Can edit').closest('button');
    await userEvent.click(editButton!);

    expect(editButton).toHaveClass('border-primary-500');
  });

  it('disables submit when board name is empty', () => {
    render(<CreateBoardModal communicatorId="client-1" onClose={mockOnClose} />);

    const submitButton = screen.getByRole('button', { name: /create board/i });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit when board name is entered', async () => {
    render(<CreateBoardModal communicatorId="client-1" onClose={mockOnClose} />);

    const nameInput = screen.getByLabelText(/board name/i);
    await userEvent.type(nameInput, 'Test Board');

    const submitButton = screen.getByRole('button', { name: /create board/i });
    expect(submitButton).not.toBeDisabled();
  });

  it('calls onClose when cancel is clicked', async () => {
    render(<CreateBoardModal communicatorId="client-1" onClose={mockOnClose} />);

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('creates board with correct parameters', async () => {
    mockAddBoard.mockResolvedValue('new-board-id');

    render(<CreateBoardModal communicatorId="client-1" onClose={mockOnClose} />);

    const nameInput = screen.getByLabelText(/board name/i);
    await userEvent.type(nameInput, 'Daily Phrases');

    // Select edit access
    const editButton = screen.getByText('Can edit').closest('button');
    await userEvent.click(editButton!);

    await userEvent.click(screen.getByRole('button', { name: /create board/i }));

    await waitFor(() => {
      expect(mockAddBoard).toHaveBeenCalledWith({
        name: 'Daily Phrases',
        position: 0,
        forClientId: 'client-1',
        clientAccessLevel: 'edit',
      });
    });
  });

  it('creates board with view access by default', async () => {
    mockAddBoard.mockResolvedValue('new-board-id');

    render(<CreateBoardModal communicatorId="client-1" onClose={mockOnClose} />);

    const nameInput = screen.getByLabelText(/board name/i);
    await userEvent.type(nameInput, 'View Board');

    await userEvent.click(screen.getByRole('button', { name: /create board/i }));

    await waitFor(() => {
      expect(mockAddBoard).toHaveBeenCalledWith(
        expect.objectContaining({
          clientAccessLevel: 'view',
        })
      );
    });
  });

  it('closes modal on successful creation', async () => {
    mockAddBoard.mockResolvedValue('new-board-id');

    render(<CreateBoardModal communicatorId="client-1" onClose={mockOnClose} />);

    const nameInput = screen.getByLabelText(/board name/i);
    await userEvent.type(nameInput, 'New Board');

    await userEvent.click(screen.getByRole('button', { name: /create board/i }));

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('shows error message on creation failure', async () => {
    mockAddBoard.mockRejectedValue(new Error('Failed to create'));

    render(<CreateBoardModal communicatorId="client-1" onClose={mockOnClose} />);

    const nameInput = screen.getByLabelText(/board name/i);
    await userEvent.type(nameInput, 'New Board');

    await userEvent.click(screen.getByRole('button', { name: /create board/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to create/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while creating', async () => {
    // Keep the request pending without a timer leaking into later tests.
    mockAddBoard.mockImplementation(() => new Promise(() => {}));

    render(<CreateBoardModal communicatorId="client-1" onClose={mockOnClose} />);

    const nameInput = screen.getByLabelText(/board name/i);
    await userEvent.type(nameInput, 'New Board');

    await userEvent.click(screen.getByRole('button', { name: /create board/i }));

    expect(screen.getByText(/creating/i)).toBeInTheDocument();
  });

  it('trims whitespace from board name', async () => {
    mockAddBoard.mockResolvedValue('new-board-id');

    render(<CreateBoardModal communicatorId="client-1" onClose={mockOnClose} />);

    const nameInput = screen.getByLabelText(/board name/i);
    await userEvent.type(nameInput, '  Trimmed Name  ');

    await userEvent.click(screen.getByRole('button', { name: /create board/i }));

    await waitFor(() => {
      expect(mockAddBoard).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Trimmed Name',
        })
      );
    });
  });

  it('shares an owned personal board with the selected permission', async () => {
    (useQuery as jest.Mock).mockReturnValue([
      { _id: 'saved-1', name: 'Daily phrases', isOwner: true },
      { _id: 'assigned-1', name: 'Assigned board', isOwner: true, forClientId: 'other-client' },
      { _id: 'shared-1', name: 'Someone else’s board', isOwner: false },
      { _id: 'deleted-1', name: 'Deleting board', isOwner: true, pendingDelete: true },
    ]);
    mockAssignBoard.mockResolvedValue(undefined);
    render(<CreateBoardModal communicatorId="client-1" onClose={mockOnClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Share a saved board' }));
    expect(screen.queryByLabelText(/board name/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Share Board' })).toBeDisabled();
    await userEvent.selectOptions(screen.getByLabelText('Saved board'), 'saved-1');
    await userEvent.click(screen.getByRole('button', { name: /can edit/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Share Board' }));
    await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
    expect(mockAssignBoard).toHaveBeenCalledWith({ boardId: 'saved-1', clientId: 'client-1', accessLevel: 'edit' });
    expect(mockAddBoard).not.toHaveBeenCalled();
  });

  it.each([undefined, []])('disables sharing while boards are loading or unavailable: %s', async (boards) => {
    (useQuery as jest.Mock).mockReturnValue(boards);
    render(<CreateBoardModal communicatorId="client-1" onClose={mockOnClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Share a saved board' }));
    expect(screen.getByRole('button', { name: 'Share Board' })).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(boards ? /no saved boards/i : /loading saved boards/i);
  });

  it('keeps the dialog open and allows retrying after sharing fails', async () => {
    (useQuery as jest.Mock).mockReturnValue([{ _id: 'saved-1', name: 'Daily phrases', isOwner: true }]);
    mockAssignBoard.mockRejectedValueOnce(new Error('Client relationship not found')).mockResolvedValueOnce(undefined);
    render(<CreateBoardModal communicatorId="client-1" onClose={mockOnClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Share a saved board' }));
    await userEvent.selectOptions(screen.getByLabelText('Saved board'), 'saved-1');
    await userEvent.click(screen.getByRole('button', { name: 'Share Board' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Client relationship not found');
    expect(mockOnClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Share Board' }));
    await waitFor(() => expect(mockOnClose).toHaveBeenCalledTimes(1));
    expect(mockAssignBoard).toHaveBeenLastCalledWith({ boardId: 'saved-1', clientId: 'client-1', accessLevel: 'view' });
  });
});
