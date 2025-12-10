import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQuery, useMutation } from 'convex/react';
import CreateBoardModal from '@/app/components/dashboard/CreateBoardModal';

jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

const mockOnClose = jest.fn();
const mockAddBoard = jest.fn();

describe('CreateBoardModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQuery as jest.Mock).mockReturnValue([]);
    (useMutation as jest.Mock).mockReturnValue(mockAddBoard);
  });

  it('renders modal with board name input', () => {
    render(<CreateBoardModal communicatorId="client-1" onClose={mockOnClose} />);

    expect(screen.getByText('Create Board for Client')).toBeInTheDocument();
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
    // Make the mutation take time
    mockAddBoard.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

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
});
