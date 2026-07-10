import { render, waitFor } from '@testing-library/react';
import RegisterPWA from '@/app/register-pwa';

describe('RegisterPWA', () => {
  const unregister = jest.fn(() => Promise.resolve(true));
  const register = jest.fn();
  const deleteCache = jest.fn(() => Promise.resolve(true));

  beforeEach(() => {
    jest.clearAllMocks();

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        getRegistrations: jest.fn(() => Promise.resolve([{ unregister }])),
        register,
      },
    });
    Object.defineProperty(window, 'caches', {
      configurable: true,
      value: {
        keys: jest.fn(() => Promise.resolve(['sayit-shell-v-old', 'unrelated-cache'])),
        delete: deleteCache,
      },
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'serviceWorker');
    Reflect.deleteProperty(window, 'caches');
  });

  it('removes stale SayIt service workers and caches outside production', async () => {
    render(<RegisterPWA />);

    await waitFor(() => {
      expect(unregister).toHaveBeenCalledTimes(1);
      expect(deleteCache).toHaveBeenCalledWith('sayit-shell-v-old');
    });
    expect(deleteCache).not.toHaveBeenCalledWith('unrelated-cache');
    expect(register).not.toHaveBeenCalled();
  });
});
