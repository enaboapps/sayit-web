import React from 'react';
import { render, screen } from '@testing-library/react';
import Hero from '@/app/components/home/landing/Hero';

describe('Hero', () => {
  it('renders eyebrow, wordmark, subhead, body, and CTAs in order', () => {
    const { container } = render(<Hero />);

    const orderedTexts = Array.from(container.querySelectorAll('p, h1, a'))
      .map((el) => el.textContent?.trim())
      .filter(Boolean) as string[];

    const eyebrowIdx = orderedTexts.findIndex((t) => /^sign in to sayit!?$/i.test(t));
    const wordmarkIdx = orderedTexts.findIndex((t) => /^sayit!$/i.test(t));
    const subheadIdx = orderedTexts.findIndex((t) =>
      /communication software for people who need help being heard/i.test(t),
    );
    const bodyIdx = orderedTexts.findIndex((t) =>
      /save your boards, write with help/i.test(t),
    );
    const primaryCtaIdx = orderedTexts.findIndex((t) =>
      /create your account/i.test(t),
    );
    const secondaryCtaIdx = orderedTexts.findIndex((t) => /^sign in$/i.test(t));

    expect(eyebrowIdx).toBeGreaterThanOrEqual(0);
    expect(wordmarkIdx).toBeGreaterThan(eyebrowIdx);
    expect(subheadIdx).toBeGreaterThan(wordmarkIdx);
    expect(bodyIdx).toBeGreaterThan(subheadIdx);
    expect(primaryCtaIdx).toBeGreaterThan(bodyIdx);
    expect(secondaryCtaIdx).toBeGreaterThan(primaryCtaIdx);
  });

  it('uses an h1 for the wordmark', () => {
    render(<Hero />);
    const wordmark = screen.getByRole('heading', { level: 1, name: /sayit!/i });
    expect(wordmark).toBeInTheDocument();
  });

  it('exposes both CTAs as links to the right routes', () => {
    render(<Hero />);
    expect(screen.getByRole('link', { name: /create your account/i })).toHaveAttribute(
      'href',
      '/sign-up',
    );
    expect(screen.getByRole('link', { name: /^sign in$/i })).toHaveAttribute(
      'href',
      '/sign-in',
    );
  });
});
