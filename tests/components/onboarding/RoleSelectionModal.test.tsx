import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMutation } from 'convex/react';
import RoleSelectionModal from '@/app/components/onboarding/RoleSelectionModal';

jest.mock('convex/react', () => ({
  useMutation: jest.fn(),
}));

const mockSetRole = jest.fn();
const mockOnComplete = jest.fn();

describe('RoleSelectionModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useMutation as jest.Mock).mockReturnValue(mockSetRole);
  });

  it('renders modal with both role options', () => {
    render(<RoleSelectionModal onComplete={mockOnComplete} />);

    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    expect(screen.getByText(/i need help communicating/i)).toBeInTheDocument();
    expect(screen.getByText(/i'm helping someone communicate/i)).toBeInTheDocument();
  });

  it('renders communicator role description', () => {
    render(<RoleSelectionModal onComplete={mockOnComplete} />);

    // The description mentions "caregiver" in communicator option
    expect(screen.getByText(/receive boards from a caregiver/i)).toBeInTheDocument();
  });

  it('renders caregiver role description', () => {
    render(<RoleSelectionModal onComplete={mockOnComplete} />);

    expect(screen.getByText(/create and manage boards for your clients/i)).toBeInTheDocument();
  });

  it('disables continue button when no role selected', () => {
    render(<RoleSelectionModal onComplete={mockOnComplete} />);

    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).toBeDisabled();
  });

  it('enables continue button when communicator role selected', async () => {
    render(<RoleSelectionModal onComplete={mockOnComplete} />);

    const communicatorOption = screen.getByText(/i need help communicating/i).closest('button');
    await userEvent.click(communicatorOption!);

    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).not.toBeDisabled();
  });

  it('enables continue button when caregiver role selected', async () => {
    render(<RoleSelectionModal onComplete={mockOnComplete} />);

    const caregiverOption = screen.getByText(/i'm helping someone communicate/i).closest('button');
    await userEvent.click(caregiverOption!);

    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).not.toBeDisabled();
  });

  it('highlights selected communicator option', async () => {
    render(<RoleSelectionModal onComplete={mockOnComplete} />);

    const communicatorOption = screen.getByText(/i need help communicating/i).closest('button');
    await userEvent.click(communicatorOption!);

    // Check for selection styling (border color, background, etc.)
    expect(communicatorOption).toHaveClass('border-primary-500');
  });

  it('highlights selected caregiver option', async () => {
    render(<RoleSelectionModal onComplete={mockOnComplete} />);

    const caregiverOption = screen.getByText(/i'm helping someone communicate/i).closest('button');
    await userEvent.click(caregiverOption!);

    expect(caregiverOption).toHaveClass('border-primary-500');
  });

  it('only allows one selection at a time', async () => {
    render(<RoleSelectionModal onComplete={mockOnComplete} />);

    const communicatorOption = screen.getByText(/i need help communicating/i).closest('button');
    const caregiverOption = screen.getByText(/i'm helping someone communicate/i).closest('button');

    // Select communicator
    await userEvent.click(communicatorOption!);
    expect(communicatorOption).toHaveClass('border-primary-500');

    // Select caregiver
    await userEvent.click(caregiverOption!);
    expect(caregiverOption).toHaveClass('border-primary-500');
    // Communicator should no longer be selected
    expect(communicatorOption).not.toHaveClass('border-primary-500');
  });

  it('calls setRole mutation with communicator', async () => {
    mockSetRole.mockResolvedValue(undefined);

    render(<RoleSelectionModal onComplete={mockOnComplete} />);

    const communicatorOption = screen.getByText(/i need help communicating/i).closest('button');
    await userEvent.click(communicatorOption!);

    const continueButton = screen.getByRole('button', { name: /continue/i });
    await userEvent.click(continueButton);

    await waitFor(() => {
      expect(mockSetRole).toHaveBeenCalledWith({ role: 'communicator' });
    });
  });

  it('calls setRole mutation with caregiver', async () => {
    mockSetRole.mockResolvedValue(undefined);

    render(<RoleSelectionModal onComplete={mockOnComplete} />);

    const caregiverOption = screen.getByText(/i'm helping someone communicate/i).closest('button');
    await userEvent.click(caregiverOption!);

    const continueButton = screen.getByRole('button', { name: /continue/i });
    await userEvent.click(continueButton);

    await waitFor(() => {
      expect(mockSetRole).toHaveBeenCalledWith({ role: 'caregiver' });
    });
  });

  it('shows loading state while saving', async () => {
    mockSetRole.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    );

    render(<RoleSelectionModal onComplete={mockOnComplete} />);

    const caregiverOption = screen.getByText(/i'm helping someone communicate/i).closest('button');
    await userEvent.click(caregiverOption!);

    const continueButton = screen.getByRole('button', { name: /continue/i });
    await userEvent.click(continueButton);

    // The loading text is "Setting up..."
    expect(screen.getByText(/setting up/i)).toBeInTheDocument();
  });

  it('shows checkmark icon on selected option', async () => {
    render(<RoleSelectionModal onComplete={mockOnComplete} />);

    const communicatorOption = screen.getByText(/i need help communicating/i).closest('button');
    await userEvent.click(communicatorOption!);

    // Check for checkmark icon presence (svg or similar)
    const checkIcon = communicatorOption?.querySelector('svg');
    expect(checkIcon).toBeInTheDocument();
  });

  it('handles mutation error gracefully', async () => {
    mockSetRole.mockRejectedValue(new Error('Network error'));

    render(<RoleSelectionModal onComplete={mockOnComplete} />);

    const caregiverOption = screen.getByText(/i'm helping someone communicate/i).closest('button');
    await userEvent.click(caregiverOption!);

    const continueButton = screen.getByRole('button', { name: /continue/i });
    await userEvent.click(continueButton);

    // Should not crash, button should re-enable
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue/i })).not.toBeDisabled();
    });
  });

  it('calls onComplete after successful role selection', async () => {
    mockSetRole.mockResolvedValue(undefined);

    render(<RoleSelectionModal onComplete={mockOnComplete} />);

    const communicatorOption = screen.getByText(/i need help communicating/i).closest('button');
    await userEvent.click(communicatorOption!);

    const continueButton = screen.getByRole('button', { name: /continue/i });
    await userEvent.click(continueButton);

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
    });
  });
});
