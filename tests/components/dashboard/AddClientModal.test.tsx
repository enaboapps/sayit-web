import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQuery, useMutation } from 'convex/react';
import AddClientModal from '@/app/components/dashboard/AddClientModal';

// Mock convex/react
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

const mockOnClose = jest.fn();
const mockAddClient = jest.fn();

describe('AddClientModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useQuery as jest.Mock).mockReturnValue(null);
    (useMutation as jest.Mock).mockReturnValue(mockAddClient);
  });

  it('renders modal with email input', () => {
    render(<AddClientModal onClose={mockOnClose} />);

    expect(screen.getByRole('heading', { name: 'Add Client' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('client@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add client/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onClose when cancel is clicked', async () => {
    render(<AddClientModal onClose={mockOnClose} />);

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('has email input that accepts text', async () => {
    render(<AddClientModal onClose={mockOnClose} />);

    const emailInput = screen.getByPlaceholderText('client@example.com');
    await userEvent.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('shows helper text about existing account', () => {
    render(<AddClientModal onClose={mockOnClose} />);

    expect(screen.getByText(/must have an existing sayit! account/i)).toBeInTheDocument();
  });

  it('shows found user when profile exists', () => {
    // Mock valid communicator profile
    (useQuery as jest.Mock).mockReturnValue({
      userId: 'communicator-user',
      email: 'found@example.com',
      role: 'communicator',
      fullName: 'Test Client',
    });

    render(<AddClientModal onClose={mockOnClose} />);

    expect(screen.getByText(/found:/i)).toBeInTheDocument();
  });
});
