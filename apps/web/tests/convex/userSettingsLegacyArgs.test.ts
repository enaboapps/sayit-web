import { describe, expect, jest, test } from '@jest/globals';
import { initializeSettings, updateSettings } from '@/convex/userSettings';

// Clients cached before v5.4.0 can still send the removed custom voice values.
// The schema no longer allows them, so the mutations must translate them.

function mockCtx(existing: Record<string, unknown> | null) {
  return {
    auth: { getUserIdentity: jest.fn(async () => ({ subject: 'user-1' })) },
    db: {
      query: jest.fn(() => ({
        withIndex: jest.fn(() => ({ first: jest.fn(async () => existing) })),
      })),
      insert: jest.fn(async () => 'settings-1'),
      patch: jest.fn(async () => undefined),
    },
  };
}

const fullSettings = {
  textSize: 24,
  speechRate: 1,
  speechPitch: 1,
  speechVolume: 1,
  speechVoice: '',
  enterKeyBehavior: 'newline' as const,
  doubleEnterEnabled: false,
  doubleEnterAction: 'speak' as const,
  doubleEnterTimeoutMs: 1000,
  ttsVoiceId: 'custom:conn:voice',
  ttsStability: 0.5,
  ttsSimilarityBoost: 0.5,
  aiReplySuggestionsEnabled: true,
  messageCaptureMode: 'disabled' as const,
  typingAreaVisible: true,
  typingAreaExpanded: false,
  typingShareFontSize: 24,
};

describe('settings mutations with values from old clients', () => {
  test('initializeSettings stores a removed custom provider as browser speech', async () => {
    const ctx = mockCtx(null);

    await initializeSettings._handler(ctx as never, {
      ...fullSettings,
      ttsProvider: 'custom',
      prepareSpeechWhileTyping: true,
    });

    const [, doc] = ctx.db.insert.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(doc).toEqual(expect.objectContaining({ ttsProvider: 'browser', ttsVoiceId: '' }));
    expect(doc).not.toHaveProperty('prepareSpeechWhileTyping');
  });

  test('updateSettings stores a removed custom provider as browser speech', async () => {
    const ctx = mockCtx({ _id: 'settings-1', userId: 'user-1' });

    await updateSettings._handler(ctx as never, {
      lastSyncedAt: 1,
      ttsProvider: 'custom',
      ttsVoiceId: 'custom:conn:voice',
      prepareSpeechWhileTyping: true,
    });

    const [, patch] = ctx.db.patch.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(patch).toEqual(expect.objectContaining({ ttsProvider: 'browser', ttsVoiceId: '' }));
    expect(patch).not.toHaveProperty('prepareSpeechWhileTyping');
  });

  test('initializeSettings rejects out-of-range numbers with the original messages', async () => {
    const ctx = mockCtx(null);

    await expect(initializeSettings._handler(ctx as never, { ...fullSettings, ttsProvider: 'browser', speechRate: 3 }))
      .rejects.toThrow('speechRate must be a valid number between 0.1 and 2.0');
    await expect(initializeSettings._handler(ctx as never, { ...fullSettings, ttsProvider: 'browser', speechVolume: Number.NaN }))
      .rejects.toThrow('speechVolume must be a valid number between 0.0 and 1.0');
    // The first failing setting in the original order wins.
    await expect(initializeSettings._handler(ctx as never, { ...fullSettings, ttsProvider: 'browser', textSize: 100, typingShareFontSize: 1 }))
      .rejects.toThrow('textSize must be a valid number between 8 and 72');
    expect(ctx.db.insert).not.toHaveBeenCalled();
  });

  test('updateSettings rejects an infinite value and patches nothing', async () => {
    const ctx = mockCtx({ _id: 'settings-1', userId: 'user-1' });

    await expect(updateSettings._handler(ctx as never, { lastSyncedAt: 1, doubleEnterTimeoutMs: Number.POSITIVE_INFINITY }))
      .rejects.toThrow('doubleEnterTimeoutMs must be a valid number between 1000 and 10000');
    expect(ctx.db.patch).not.toHaveBeenCalled();
  });

  test('updateSettings patches only known settings', async () => {
    const ctx = mockCtx({ _id: 'settings-1', userId: 'user-1' });

    await updateSettings._handler(ctx as never, { lastSyncedAt: 1, speechRate: 1.5, notASetting: 'x' } as never);

    const [, patch] = ctx.db.patch.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(patch).toEqual(expect.objectContaining({ speechRate: 1.5, lastSyncedAt: 1 }));
    expect(patch).not.toHaveProperty('notASetting');
  });

  test('updateSettings leaves supported providers alone', async () => {
    const ctx = mockCtx({ _id: 'settings-1', userId: 'user-1' });

    await updateSettings._handler(ctx as never, {
      lastSyncedAt: 1,
      ttsProvider: 'elevenlabs',
      ttsVoiceId: 'voice-1',
    });

    const [, patch] = ctx.db.patch.mock.calls[0] as unknown as [string, Record<string, unknown>];
    expect(patch).toEqual(expect.objectContaining({ ttsProvider: 'elevenlabs', ttsVoiceId: 'voice-1' }));
  });
});
