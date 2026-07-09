import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import { Textarea } from '@/app/components/ui/Textarea';
import { Switch } from '@/app/components/ui/Switch';
import { SettingsCard } from '@/app/components/ui/SettingsCard';

describe('Version 5 design primitives', () => {
  it('uses the shared control contract for buttons and form fields', () => {
    render(
      <>
        <Button>Continue</Button>
        <Input aria-label="Name" />
        <Textarea aria-label="Message" />
      </>,
    );

    expect(screen.getByRole('button', { name: 'Continue' })).toHaveClass('rounded-[var(--radius-control)]');
    expect(screen.getByLabelText('Name')).toHaveClass('min-h-[var(--control-height)]');
    expect(screen.getByLabelText('Message')).toHaveClass('rounded-[var(--radius-control)]');
  });

  it('keeps switch behavior and card semantics intact', () => {
    const onChange = jest.fn();
    render(
      <SettingsCard title="Appearance">
        <Switch label="High contrast" checked={false} onChange={onChange} />
      </SettingsCard>,
    );

    fireEvent.click(screen.getByRole('switch', { name: 'High contrast' }));
    expect(onChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('region', { name: 'Appearance' })).toBeInTheDocument();
  });
});
