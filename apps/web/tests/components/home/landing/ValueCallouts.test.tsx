import React from 'react';
import { render, screen } from '@testing-library/react';
import ValueCallouts from '@/app/components/home/landing/ValueCallouts';

describe('ValueCallouts', () => {
  it('renders three callout articles', () => {
    render(<ValueCallouts />);
    const articles = screen.getAllByRole('article');
    expect(articles).toHaveLength(3);
  });

  it('renders each callout with the expected title', () => {
    render(<ValueCallouts />);
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

  it('renders the body line for each callout', () => {
    render(<ValueCallouts />);
    expect(
      screen.getByText(/build reusable boards for daily routines/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/turn rough phrasing into clearer messages/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/free browser voices ship by default/i),
    ).toBeInTheDocument();
  });
});
