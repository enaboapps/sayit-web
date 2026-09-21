import userEvent from '@testing-library/user-event';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CustomProviderSettings from '@/app/components/CustomProviderSettings';
import { CustomTTS } from '@/lib/custom-tts';
jest.mock('@/app/contexts/SettingsContext', () => ({ useSettings: () => ({ settings: { ttsProvider: 'custom' } }) }));
beforeEach(() => {
  CustomTTS.getInstance().reset();
  global.fetch = jest.fn(async (_url, options) => ({ ok: true, json: async () => options?.method === 'POST' ? { id: 'saved', voices: [{ voice_id: 'voice', name: 'Voice' }] } : [{ id: 'saved', name: 'Personal', baseUrl: 'https://voice.example', hasKey: true }] })) as unknown as typeof fetch;
});
test('loads account metadata, keeps key masked, and loads selectable voices', async () => {
  render(<CustomProviderSettings />);
  await screen.findByText('Personal');
  fireEvent.change(screen.getByLabelText('Connection'), { target: { value: 'saved' } });
  expect(screen.getByLabelText('API key')).toHaveAttribute('type', 'password');
  expect(screen.getByLabelText('API key')).toHaveValue('');
  fireEvent.click(screen.getByRole('button', { name: 'Load voices' }));
  await screen.findByText('Connected. Found 1 voice.');
  expect(CustomTTS.getInstance().getVoices()).toHaveLength(1);
});
test('saves an edited name without returning or resubmitting the old key', async () => {
  render(<CustomProviderSettings />); await screen.findByText('Personal');
  fireEvent.change(screen.getByLabelText('Connection'), { target: { value: 'saved' } });
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Renamed' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save connection' }));
  await screen.findByText('Connection saved. Load voices to choose one.');
  const call = (fetch as jest.Mock).mock.calls.find(([url]) => url.endsWith('/save'));
  expect(JSON.parse(call[1].body)).toEqual({ id: 'saved', name: 'Renamed', baseUrl: 'https://voice.example' });
});
test('prevents duplicate requests and preserves form on failure', async () => {
  render(<CustomProviderSettings />); await screen.findByText('Personal');
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Keep this' } });
  (fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ error: 'Server unavailable.' }) });
  fireEvent.click(screen.getByRole('button', { name: 'Test connection' }));
  fireEvent.click(screen.getByRole('button', { name: 'Test connection' }));
  await screen.findByText('Server unavailable.');
  expect(screen.getByLabelText('Name')).toHaveValue('Keep this');
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
});

test('supports keyboard navigation through labelled fields and actions', async () => {
  const user = userEvent.setup();
  render(<CustomProviderSettings />); await screen.findByText('Personal');
  await user.tab(); expect(screen.getByLabelText('Connection')).toHaveFocus();
  await user.tab(); expect(screen.getByLabelText('Name')).toHaveFocus();
  await user.type(screen.getByLabelText('Name'), 'My server');
  await user.tab(); expect(screen.getByLabelText('HTTPS server address')).toHaveFocus();
  await user.tab(); expect(screen.getByLabelText('API key')).toHaveFocus();
  await user.tab(); expect(screen.getByRole('button', { name: 'Test connection' })).toHaveFocus();
});

test('cancels pending voice discovery when leaving settings', async () => {
  const { unmount } = render(<CustomProviderSettings />); await screen.findByText('Personal');
  fireEvent.change(screen.getByLabelText('Connection'), { target: { value: 'saved' } });
  let finish!: (value: { ok: boolean; json: () => Promise<object> }) => void;
  (fetch as jest.Mock).mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  fireEvent.click(screen.getByRole('button', { name: 'Load voices' }));
  const signal = (fetch as jest.Mock).mock.calls.at(-1)[1].signal;
  unmount(); expect(signal.aborted).toBe(true);
  finish({ ok: true, json: async () => ({ voices: [{ voice_id: 'private', name: 'Previous account' }] }) });
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  expect(CustomTTS.getInstance().getVoices()).toEqual([]);
});
