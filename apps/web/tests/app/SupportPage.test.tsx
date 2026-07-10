import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import SupportPage from '@/app/support/page';

const QUESTIONS = [
  'How do I get started with SayIt!?',
  'How do I create and customize a Board?',
  'Can I use SayIt! offline?',
  'How do I change the voice and speech settings?',
  'What is included with SayIt! Pro?',
  'How do I manage or cancel my subscription?',
  'How can a supporter manage a communicator’s Boards?',
  'Can I import or export Boards?',
];

describe('SupportPage', () => {
  it('renders eight current FAQ questions in collapsed native accordions', () => {
    const { container } = render(<SupportPage />);
    const details = Array.from(container.querySelectorAll('details'));

    expect(details).toHaveLength(8);
    QUESTIONS.forEach((question) => {
      expect(screen.getByText(question)).toBeInTheDocument();
    });
    details.forEach((item) => expect(item).not.toHaveAttribute('open'));
  });

  it('opens questions independently through their keyboard-focusable summaries', () => {
    const { container } = render(<SupportPage />);
    const summaries = Array.from(container.querySelectorAll('summary'));
    const details = Array.from(container.querySelectorAll('details'));

    expect(summaries[0]).toHaveClass('focus-visible:ring-2', 'min-h-[44px]');

    fireEvent.click(summaries[0]);
    fireEvent.click(summaries[1]);

    expect(details[0]).toHaveAttribute('open');
    expect(details[1]).toHaveAttribute('open');
    expect(details[2]).not.toHaveAttribute('open');
  });

  it('preserves support links and uses current product guidance', () => {
    render(<SupportPage />);

    expect(screen.getByRole('link', { name: 'enaboapps@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:enaboapps@gmail.com',
    );
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Try SayIt!' })).toHaveAttribute('href', '/try');
    expect(screen.getByRole('link', { name: 'pricing page' })).toHaveAttribute('href', '/pricing');

    expect(screen.getByText(/signed-in Boards are prepared on that device for read-only offline use/i)).toBeInTheDocument();
    expect(screen.getByText(/export all Boards as an/i)).toBeInTheDocument();
    expect(screen.queryByText(/New Board/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Account page/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/unlimited phrase boards/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/AI-powered phrase generation/i)).not.toBeInTheDocument();
  });
});
