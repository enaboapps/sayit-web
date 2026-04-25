import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PageHeader from '@/app/components/ui/PageHeader';

// Override the global next/navigation mock so we can assert on router.back().
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: mockBack,
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

describe('PageHeader', () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  it('renders title and description', () => {
    render(
      <PageHeader title="Edit Phrase" description="Subtitle text" />
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Edit Phrase' })).toBeInTheDocument();
    expect(screen.getByText('Subtitle text')).toBeInTheDocument();
  });

  it('omits description when not supplied', () => {
    render(<PageHeader title="Edit Phrase" />);
    expect(screen.queryByText(/Subtitle/)).not.toBeInTheDocument();
  });

  it('renders rightSlot content', () => {
    render(
      <PageHeader
        title="Edit Phrase"
        rightSlot={<button type="button">Save</button>}
      />
    );
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('calls onBack when supplied (taking precedence over backHref)', async () => {
    const onBack = jest.fn();
    render(
      <PageHeader
        title="Edit Phrase"
        onBack={onBack}
        backHref="/never-used"
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('renders <a href={backHref}> when backHref is supplied without onBack', () => {
    render(<PageHeader title="Edit Phrase" backHref="/" />);
    const link = screen.getByRole('link', { name: 'Go back' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  it('falls back to router.back() when neither onBack nor backHref is supplied', async () => {
    render(<PageHeader title="Edit Phrase" />);
    await userEvent.click(screen.getByRole('button', { name: 'Go back' }));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('applies sticky classes by default', () => {
    const { container } = render(<PageHeader title="Edit Phrase" />);
    const header = container.querySelector('header');
    expect(header?.className).toMatch(/\bsticky\b/);
    expect(header?.className).toMatch(/top-0/);
    expect(header?.className).toMatch(/backdrop-blur-sm/);
  });

  it('omits sticky classes when sticky is false', () => {
    const { container } = render(<PageHeader title="Edit Phrase" sticky={false} />);
    const header = container.querySelector('header');
    expect(header?.className).not.toMatch(/\bsticky\b/);
    expect(header?.className).not.toMatch(/backdrop-blur-sm/);
  });
});
