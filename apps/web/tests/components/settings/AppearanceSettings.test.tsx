import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppearanceSettings from '@/app/components/settings/AppearanceSettings';

const setTheme = jest.fn();
const setMotionPreference = jest.fn();
const setContrastPreference = jest.fn();
jest.mock('@/app/contexts/AppearanceContext', () => ({
  useAppearance: () => ({
    theme: 'system',
    resolvedTheme: 'dark',
    setTheme,
    motionPreference: 'system',
    setMotionPreference,
    contrastPreference: 'system',
    setContrastPreference,
  }),
}));

describe('AppearanceSettings', () => {
  beforeEach(() => {
    setTheme.mockClear();
    setMotionPreference.mockClear();
    setContrastPreference.mockClear();
  });

  it('presents system, light, and dark as one labelled radio group', () => {
    render(<AppearanceSettings />);

    expect(screen.getByRole('radio', { name: 'Theme: System' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: 'Theme: Light' })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: 'Theme: Dark' })).toHaveAttribute('aria-checked', 'false');
  });

  it('updates only the device appearance preference', async () => {
    render(<AppearanceSettings />);
    await userEvent.click(screen.getByRole('radio', { name: 'Theme: Light' }));
    expect(setTheme).toHaveBeenCalledWith('light');
  });

  it('offers explicit reduced-motion and high-contrast preferences', async () => {
    render(<AppearanceSettings />);
    await userEvent.click(screen.getByRole('radio', { name: 'Motion: Reduced' }));
    await userEvent.click(screen.getByRole('radio', { name: 'Contrast: High' }));
    expect(setMotionPreference).toHaveBeenCalledWith('reduced');
    expect(setContrastPreference).toHaveBeenCalledWith('high');
  });
});
