import { createAppLogger } from '@/lib/logger';

describe('appLogger', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs structured warning context in tests', () => {
    const appLogger = createAppLogger(() => 'test');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    appLogger.warn('FixedAACGrid skipped an out-of-bounds tile', {
      tileId: 'tile-1',
      row: 3,
      column: 0,
    });

    expect(warnSpy).toHaveBeenCalledWith('FixedAACGrid skipped an out-of-bounds tile', {
      tileId: 'tile-1',
      row: 3,
      column: 0,
    });
  });

  it('does not hide expected diagnostics in tests when production logging is disabled', () => {
    const appLogger = createAppLogger(() => 'test');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    appLogger.warn('Development-only warning', { feature: 'fixed-grid' }, { production: false });

    expect(warnSpy).toHaveBeenCalledWith('Development-only warning', {
      feature: 'fixed-grid',
    });
  });

  it('suppresses development-only diagnostics in production', () => {
    const appLogger = createAppLogger(() => 'production');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    appLogger.warn('Development-only warning', { feature: 'fixed-grid' }, { production: false });

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('keeps errors visible in production', () => {
    const appLogger = createAppLogger(() => 'production');
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    appLogger.error('Failed to sync setting', { key: 'voice' });

    expect(errorSpy).toHaveBeenCalledWith('Failed to sync setting', { key: 'voice' });
  });
});
