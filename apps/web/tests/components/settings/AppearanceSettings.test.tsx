import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppearanceSettings from '@/app/components/settings/AppearanceSettings';

const setTheme = jest.fn();
jest.mock('@/app/contexts/AppearanceContext', () => ({
  useAppearance: () => ({ theme: 'system', resolvedTheme: 'dark', setTheme }),
}));

describe('AppearanceSettings', () => {
  beforeEach(() => setTheme.mockClear());

  it('presents system, light, and dark as one labelled radio group', () => {
    render(<AppearanceSettings />);

    expect(screen.getByRole('radio', { name: /System/ })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('radio', { name: /Light/ })).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByRole('radio', { name: /Dark/ })).toHaveAttribute('aria-checked', 'false');
  });

  it('updates only the device appearance preference', async () => {
    render(<AppearanceSettings />);
    await userEvent.click(screen.getByRole('radio', { name: /Light/ }));
    expect(setTheme).toHaveBeenCalledWith('light');
  });
});
