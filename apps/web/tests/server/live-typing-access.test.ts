/** @jest-environment node */
import { ConvexHttpClient } from 'convex/browser';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { isLiveTypingSpeechRequest, LIVE_TYPING_SPEECH_WINDOW_MS } from '@/lib/server/live-typing-access';
import { POST as azurePOST } from '@/app/api/azure/tts/route';

jest.mock('convex/browser', () => ({ ConvexHttpClient: jest.fn() }));
jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn(), clerkClient: jest.fn() }));
jest.mock('js-tts-wrapper', () => ({
  AzureTTSClient: jest.fn(() => ({
    synthToBytestream: jest.fn(async () => ({ audioStream: new ReadableStream() })),
  })),
}));

const query = jest.fn();

function session(overrides: Record<string, unknown> = {}, command: Record<string, unknown> = {}) {
  return {
    sessionKey: 'key-1',
    content: 'hello',
    isPaused: false,
    isActive: true,
    speechCommand: {
      id: 'cmd-1',
      action: 'speak',
      text: 'Hello there',
      createdAt: Date.now(),
      settings: { provider: 'azure', rate: 1, pitch: 1, volume: 1, stability: 0.5, similarityBoost: 0.5 },
      ...command,
    },
    ...overrides,
  };
}

const body = { text: 'Hello there', voiceId: 'v', liveTyping: { sessionKey: 'key-1', commandId: 'cmd-1' } };

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_CONVEX_URL = 'https://example.convex.cloud';
  (ConvexHttpClient as unknown as jest.Mock).mockImplementation(() => ({ query }));
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('isLiveTypingSpeechRequest', () => {
  test('allows the current speak command', async () => {
    query.mockResolvedValue(session());
    await expect(isLiveTypingSpeechRequest(body, 'azure')).resolves.toBe(true);
    expect(query).toHaveBeenCalledWith(expect.anything(), { sessionKey: 'key-1' });
  });

  test.each([
    ['no live typing details', { text: 'Hello there' }, session()],
    ['different text', { ...body, text: 'Something else' }, session()],
    ['an older command', { ...body, liveTyping: { sessionKey: 'key-1', commandId: 'cmd-0' } }, session()],
    ['a stop command', body, session({}, { action: 'stop' })],
    ['an old command', body, session({}, { createdAt: Date.now() - LIVE_TYPING_SPEECH_WINDOW_MS - 1000 })],
    ['a paused session', body, session({ isPaused: true })],
    ['a stopped account link', body, session({ isActive: false })],
    ['a missing session', body, null],
  ])('refuses %s', async (_label, requestBody, stored) => {
    query.mockResolvedValue(stored);
    await expect(isLiveTypingSpeechRequest(requestBody, 'azure')).resolves.toBe(false);
  });

  test('refuses a command for another provider', async () => {
    query.mockResolvedValue(session());
    await expect(isLiveTypingSpeechRequest(body, 'elevenlabs')).resolves.toBe(false);
  });

  test('refuses when Convex fails', async () => {
    query.mockRejectedValue(new Error('down'));
    await expect(isLiveTypingSpeechRequest(body, 'azure')).resolves.toBe(false);
  });
});

describe('Azure TTS route', () => {
  beforeEach(() => {
    process.env.AZURE_SUBSCRIPTION_KEY = 'key';
    process.env.AZURE_REGION = 'region';
    (auth as unknown as jest.Mock).mockResolvedValue({ userId: null, has: () => false });
    (clerkClient as unknown as jest.Mock).mockResolvedValue({ users: { getUser: jest.fn() } });
  });

  const request = (payload: unknown) => new Request('https://example.com/api/azure/tts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  test('a signed-out viewer gets audio for the current speak command', async () => {
    query.mockResolvedValue(session());
    const res = await azurePOST(request(body));
    expect(res.status).toBe(200);
  });

  test('a signed-out caller without a live command is refused', async () => {
    query.mockResolvedValue(session());
    const res = await azurePOST(request({ text: 'Free speech please', voiceId: 'v' }));
    expect(res.status).toBe(401);
  });
});
