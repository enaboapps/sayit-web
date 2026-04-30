import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoleChangeModal from '@/app/components/settings/RoleChangeModal';

// Mock convex
const mockChangeRole = jest.fn();
jest.mock('convex/react', () => ({
  useMutation: () => mockChangeRole,
}));

describe('RoleChangeModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('for caregiver role', () => {
    it('renders warning about losing clients and boards', () => {
      render(
        <RoleChangeModal
          currentRole="caregiver"
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/remove all your clients/i)).toBeInTheDocument();
      expect(screen.getByText(/delete all boards you created for clients/i)).toBeInTheDocument();
    });

    it('shows Communicator as the target role', () => {
      render(
        <RoleChangeModal
          currentRole="caregiver"
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/Communicator/)).toBeInTheDocument();
    });
  });

  describe('for communicator role', () => {
    it('renders warning about losing caregiver connection', () => {
      render(
        <RoleChangeModal
          currentRole="communicator"
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/remove your connection to your caregiver/i)).toBeInTheDocument();
      expect(screen.getByText(/lose access to boards shared with you/i)).toBeInTheDocument();
    });

    it('shows Caregiver as the target role', () => {
      render(
        <RoleChangeModal
          currentRole="communicator"
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      expect(screen.getByText(/Caregiver/)).toBeInTheDocument();
    });
  });

  describe('confirmation flow', () => {
    it('has disabled Change Role button initially', () => {
      render(
        <RoleChangeModal
          currentRole="caregiver"
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const changeButton = screen.getByRole('button', { name: /change role/i });
      expect(changeButton).toBeDisabled();
    });

    it('enables Change Role button when CHANGE ROLE is typed', async () => {
      const user = userEvent.setup();
      render(
        <RoleChangeModal
          currentRole="caregiver"
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByPlaceholderText('CHANGE ROLE');
      await user.type(input, 'CHANGE ROLE');

      const changeButton = screen.getByRole('button', { name: /change role/i });
      expect(changeButton).not.toBeDisabled();
    });

    it('keeps button disabled for partial match', async () => {
      const user = userEvent.setup();
      render(
        <RoleChangeModal
          currentRole="caregiver"
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByPlaceholderText('CHANGE ROLE');
      await user.type(input, 'CHANGE');

      const changeButton = screen.getByRole('button', { name: /change role/i });
      expect(changeButton).toBeDisabled();
    });

    it('converts input to uppercase', async () => {
      const user = userEvent.setup();
      render(
        <RoleChangeModal
          currentRole="caregiver"
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByPlaceholderText('CHANGE ROLE');
      await user.type(input, 'change role');

      expect(input).toHaveValue('CHANGE ROLE');
    });
  });

  describe('actions', () => {
    it('calls onClose when Cancel is clicked', async () => {
      const user = userEvent.setup();
      render(
        <RoleChangeModal
          currentRole="caregiver"
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      await user.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onClose when X button is clicked', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <RoleChangeModal
          currentRole="caregiver"
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      // Find the X button by its SVG
      const xButton = container.querySelector('button svg.w-5.h-5')?.parentElement;
      if (xButton) {
        await user.click(xButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('calls changeRole mutation and onSuccess when confirmed', async () => {
      const user = userEvent.setup();
      mockChangeRole.mockResolvedValue('profile-id');

      render(
        <RoleChangeModal
          currentRole="caregiver"
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByPlaceholderText('CHANGE ROLE');
      await user.type(input, 'CHANGE ROLE');

      const changeButton = screen.getByRole('button', { name: /change role/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(mockChangeRole).toHaveBeenCalledWith({ newRole: 'communicator' });
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('shows error message when mutation fails', async () => {
      const user = userEvent.setup();
      mockChangeRole.mockRejectedValue(new Error('Failed'));

      render(
        <RoleChangeModal
          currentRole="caregiver"
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByPlaceholderText('CHANGE ROLE');
      await user.type(input, 'CHANGE ROLE');

      const changeButton = screen.getByRole('button', { name: /change role/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to change role/i)).toBeInTheDocument();
      });
    });

    it('shows loading state while submitting', async () => {
      const user = userEvent.setup();
      // Make the mutation hang
      mockChangeRole.mockImplementation(() => new Promise(() => {}));

      render(
        <RoleChangeModal
          currentRole="caregiver"
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      );

      const input = screen.getByPlaceholderText('CHANGE ROLE');
      await user.type(input, 'CHANGE ROLE');

      const changeButton = screen.getByRole('button', { name: /change role/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText(/changing/i)).toBeInTheDocument();
      });
    });
  });
});
