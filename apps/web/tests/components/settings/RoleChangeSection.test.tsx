import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RoleChangeSection from '@/app/components/settings/RoleChangeSection';

// Mock convex
const mockUseQuery = jest.fn();
jest.mock('convex/react', () => ({
  useQuery: () => mockUseQuery(),
  useMutation: () => jest.fn(),
}));

describe('RoleChangeSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing while the profile is loading', () => {
    mockUseQuery.mockReturnValue(undefined);
    const { container } = render(<RoleChangeSection />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the current caregiver role', () => {
    mockUseQuery.mockReturnValue({ role: 'caregiver' });
    render(<RoleChangeSection />);
    expect(screen.getByText('Caregiver')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change role/i })).toBeInTheDocument();
  });

  it('offers Change Role when the profile has no role', () => {
    mockUseQuery.mockReturnValue({ role: undefined });
    render(<RoleChangeSection />);
    expect(screen.getByText('Communicator')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change role/i })).toBeInTheDocument();
  });

  it('offers Change Role when the profile is missing', async () => {
    mockUseQuery.mockReturnValue(null);
    render(<RoleChangeSection />);
    expect(screen.getByText('Communicator')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /change role/i }));
    expect(screen.getByText(/remove your connection to your caregiver/i)).toBeInTheDocument();
  });
});
