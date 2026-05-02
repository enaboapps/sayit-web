import React from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('@/app/components/composer', () => ({
  __esModule: true,
  default: () => <div data-testid="composer" />,
}));

import GuestLanding from '@/app/components/home/GuestLanding';

describe('GuestLanding', () => {
  beforeEach(() => {
    render(<GuestLanding />);
  });

  it('renders the wordmark', () => {
    expect(
      screen.getByRole('heading', { level: 1, name: /sayit!/i }),
    ).toBeInTheDocument();
  });

  it('renders the verbatim landing subhead', () => {
    expect(
      screen.getByText(
        /communication software for people who need help being heard/i,
      ),
    ).toBeInTheDocument();
  });

  it('renders the body copy', () => {
    expect(
      screen.getByText(
        /save your boards, write with help, hear yourself in a natural voice/i,
      ),
    ).toBeInTheDocument();
  });

  it('renders all three value-callout titles', () => {
    expect(
      screen.getByRole('heading', { level: 3, name: /saved phrase boards/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: /ai fix text/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: /premium voices/i }),
    ).toBeInTheDocument();
  });

  it('renders the primary CTA linking to /sign-up', () => {
    const cta = screen.getByRole('link', { name: /create your account/i });
    expect(cta).toHaveAttribute('href', '/sign-up');
  });

  it('renders the secondary CTA linking to /sign-in', () => {
    const cta = screen.getByRole('link', { name: /^sign in$/i });
    expect(cta).toHaveAttribute('href', '/sign-in');
  });

  it('renders the tertiary "Try without signing in" link to /try', () => {
    const link = screen.getByRole('link', { name: /try without signing in/i });
    expect(link).toHaveAttribute('href', '/try');
  });

  it('does not render the Composer', () => {
    expect(screen.queryByTestId('composer')).not.toBeInTheDocument();
  });

  it('renders the footer brand-trust links', () => {
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute(
      'href',
      'https://github.com/enaboapps/sayit-web',
    );
    expect(screen.getByRole('link', { name: /support/i })).toHaveAttribute(
      'href',
      '/support',
    );
    expect(screen.getByRole('link', { name: /privacy/i })).toHaveAttribute(
      'href',
      '/privacy',
    );
  });
});
