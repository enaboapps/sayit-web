/** @jest-environment node */
import { ConvexHttpClient } from 'convex/browser';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { isLiveTypingSpeechRequest, LIVE_TYPING_SPEECH_WINDOW_MS } from '@/lib/server/live-typing-access';
import { clearProAccessCache } from '@/lib/server/pro-access';
import { POST as azurePOST } from '@/app/api/azure/tts/route';
import { POST as geminiPOST } from '@/app/api/gemini/tts/route';
import { POST as elevenLabsPOST } from '@/app/api/text-to-speech/route';

jest.mock('convex/browser', () => ({ ConvexHttpClient: jest.fn() }));
jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn(), clerkClient: jest.fn() }));
jest.mock('js-tts-wrapper', () => {
  const stream = () => ({ audioStream: new ReadableStream({ start(controller) { controller.close(); } }) });
  return {
    AzureTTSClient: jest.fn(() => ({ synthToBytestream: jest.fn(async () => stream()) })),
    ElevenLabsTTSClient: jest.fn(() => ({ synthToBytestream: jest.fn(async () => stream()) })),
    GeminiTTSClient: jest.fn(() => ({ synthToBytes: jest.fn(async () => new Uint8Array([1, 2])) })),
  };
});

const query = jest.fn();
const getUserBillingSubscription = jest.fn();
const getUser = jest.fn();

function proSubscription() {
  return { subscriptionItems: [{ status: 'active', plan: { slug: 'sayit_pro_monthly' } }] };
}

function session(overrides: Record<string, unknown> = {}, command: Record<string, unknown> = {}) {
  return {
    sessionKey: 'key-1',
    userId: 'owner-1',
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
  clearProAccessCache();
  process.env.NEXT_PUBLIC_CONVEX_URL = 'https://example.convex.cloud';
  process.env.CONVEX_WEBHOOK_SECRET = 's'.repeat(40);
  (ConvexHttpClient as unknown as jest.Mock).mockImplementation(() => ({ query }));
  (clerkClient as unknown as jest.Mock).mockResolvedValue({
    billing: { getUserBillingSubscription },
    users: { getUser },
  });
  getUserBillingSubscription.mockResolvedValue(proSubscription());
  getUser.mockResolvedValue({ publicMetadata: {} });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('isLiveTypingSpeechRequest', () => {
  test('allows the current speak command from a Pro sharer', async () => {
    query.mockResolvedValue(session());
    await expect(isLiveTypingSpeechRequest(body, 'azure')).resolves.toBe(true);
    expect(query).toHaveBeenCalledWith(expect.anything(), { serverSecret: 's'.repeat(40), sessionKey: 'key-1' });
    expect(getUserBillingSubscription).toHaveBeenCalledWith('owner-1');
  });

  test.each([
    ['no live typing details', { text: 'Hello there' }, session()],
    ['different text', { ...body, text: 'Something else' }, session()],
    ['an older command', { ...body, liveTyping: { sessionKey: 'key-1', commandId: 'cmd-0' } }, session()],
    ['a stop command', body, session({}, { action: 'stop' })],
    ['an old command', body, session({}, { createdAt: Date.now() - LIVE_TYPING_SPEECH_WINDOW_MS - 1000 })],
    ['a paused session', body, session({ isPaused: true })],
    ['a stopped account link', body, session({ isActive: false })],
    ['a session with no command', body, session({ speechCommand: undefined })],
    ['a missing session', body, null],
  ])('refuses %s', async (_label, requestBody, stored) => {
    query.mockResolvedValue(stored);
    await expect(isLiveTypingSpeechRequest(requestBody, 'azure')).resolves.toBe(false);
  });

  test('refuses a command for another provider', async () => {
    query.mockResolvedValue(session());
    await expect(isLiveTypingSpeechRequest(body, 'elevenlabs')).resolves.toBe(false);
  });

  test('refuses when the sharer has no Pro plan or bypass flag', async () => {
    query.mockResolvedValue(session());
    getUserBillingSubscription.mockRejectedValue(new Error('Not found'));
    await expect(isLiveTypingSpeechRequest(body, 'azure')).resolves.toBe(false);
  });

  test('refuses an ended Pro subscription', async () => {
    query.mockResolvedValue(session());
    getUserBillingSubscription.mockResolvedValue({ subscriptionItems: [{ status: 'ended', plan: { slug: 'sayit_pro_monthly' } }] });
    await expect(isLiveTypingSpeechRequest(body, 'azure')).resolves.toBe(false);
  });

  test('allows a sharer with the bypass flag', async () => {
    query.mockResolvedValue(session());
    getUserBillingSubscription.mockResolvedValue({ subscriptionItems: [] });
    getUser.mockResolvedValue({ publicMetadata: { bypassSubscriptionCheck: true } });
    await expect(isLiveTypingSpeechRequest(body, 'azure')).resolves.toBe(true);
  });

  test('caches the sharer check between utterances', async () => {
    query.mockResolvedValue(session());
    await isLiveTypingSpeechRequest(body, 'azure');
    await isLiveTypingSpeechRequest(body, 'azure');
    expect(getUserBillingSubscription).toHaveBeenCalledTimes(1);
  });

  test('refuses when the server secret is not set', async () => {
    delete process.env.CONVEX_WEBHOOK_SECRET;
    query.mockResolvedValue(session());
    await expect(isLiveTypingSpeechRequest(body, 'azure')).resolves.toBe(false);
    expect(query).not.toHaveBeenCalled();
  });

  test('refuses when Convex fails', async () => {
    query.mockRejectedValue(new Error('down'));
    await expect(isLiveTypingSpeechRequest(body, 'azure')).resolves.toBe(false);
  });
});

describe('TTS routes', () => {
  beforeEach(() => {
    process.env.AZURE_SUBSCRIPTION_KEY = 'key';
    process.env.AZURE_REGION = 'region';
    process.env.ELEVENLABS_API_KEY = 'key';
    process.env.GEMINI_API_KEY = 'key';
    (auth as unknown as jest.Mock).mockResolvedValue({ userId: null, has: () => false });
  });

  const request = (payload: unknown) => new Request('https://example.com/api/tts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  test.each([
    ['Azure', azurePOST, 'azure'],
    ['ElevenLabs', elevenLabsPOST, 'elevenlabs'],
    ['Gemini', geminiPOST, 'gemini'],
  ] as const)('%s gives a signed-out viewer audio for the current speak command', async (_label, post, provider) => {
    query.mockResolvedValue(session({}, { settings: { provider } }));
    const res = await post(request(body));
    expect(res.status).toBe(200);
  });

  test('a signed-out caller without a live command is refused', async () => {
    query.mockResolvedValue(session());
    const res = await azurePOST(request({ text: 'Free speech please', voiceId: 'v' }));
    expect(res.status).toBe(401);
  });

  test('a signed-in non-Pro viewer still gets the current speak command', async () => {
    (auth as unknown as jest.Mock).mockResolvedValue({ userId: 'viewer-1', has: () => false });
    query.mockResolvedValue(session());
    const res = await azurePOST(request(body));
    expect(res.status).toBe(200);
    expect(getUser).toHaveBeenCalledWith('viewer-1');
  });

  test('a signed-in non-Pro caller without a live command gets 403', async () => {
    (auth as unknown as jest.Mock).mockResolvedValue({ userId: 'viewer-1', has: () => false });
    const res = await azurePOST(request({ text: 'Free speech please', voiceId: 'v' }));
    expect(res.status).toBe(403);
  });
});
