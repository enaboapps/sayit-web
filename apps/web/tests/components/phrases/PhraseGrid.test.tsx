import { computePhraseGridColumns } from '@/app/components/phrases/PhraseGrid';

describe('computePhraseGridColumns', () => {
  const defaults = {
    gapPx: 8,
    minColumns: 2,
    maxColumns: 8,
  };

  it('returns the minimum columns for zero or unknown width', () => {
    expect(computePhraseGridColumns({
      ...defaults,
      containerWidth: 0,
      textSizePx: 16,
    })).toBe(2);
  });

  it('computes mobile-sized columns from available width', () => {
    expect(computePhraseGridColumns({
      ...defaults,
      containerWidth: 344,
      textSizePx: 16,
    })).toBe(3);
  });

  it('caps wide layouts at the maximum columns', () => {
    expect(computePhraseGridColumns({
      ...defaults,
      containerWidth: 1000,
      textSizePx: 16,
    })).toBe(8);
  });

  it('reduces grid density for larger text sizes', () => {
    const normalTextColumns = computePhraseGridColumns({
      ...defaults,
      containerWidth: 1000,
      textSizePx: 16,
    });
    const largeTextColumns = computePhraseGridColumns({
      ...defaults,
      containerWidth: 1000,
      textSizePx: 32,
    });

    expect(largeTextColumns).toBeLessThan(normalTextColumns);
  });

  it('never exceeds the provided maximum columns', () => {
    expect(computePhraseGridColumns({
      gapPx: 8,
      minColumns: 2,
      maxColumns: 5,
      containerWidth: 2000,
      textSizePx: 16,
    })).toBe(5);
  });

  it('never drops below the provided minimum columns', () => {
    expect(computePhraseGridColumns({
      gapPx: 8,
      minColumns: 3,
      maxColumns: 8,
      containerWidth: 120,
      textSizePx: 16,
    })).toBe(3);
  });
});
