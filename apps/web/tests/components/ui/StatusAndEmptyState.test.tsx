import { render, screen } from '@testing-library/react';
import StatusBanner from '@/app/components/ui/StatusBanner';
import EmptyState from '@/app/components/ui/EmptyState';

describe('workspace state primitives', () => {
  it.each(['error', 'warning', 'success', 'info'] as const)('renders the %s status variant semantically', (variant) => {
    render(<StatusBanner variant={variant} title="Connection status">Details</StatusBanner>);
    const role = variant === 'error' ? 'alert' : 'status';
    expect(screen.getByRole(role)).toHaveTextContent('Connection status');
    expect(screen.getByRole(role)).toHaveTextContent('Details');
  });

  it('renders a labelled empty state with an optional action', () => {
    render(<EmptyState title="No boards yet" description="Create a board to begin." action={<button>Create board</button>} />);
    expect(screen.getByRole('region', { name: 'No boards yet' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create board' })).toBeInTheDocument();
  });
});
