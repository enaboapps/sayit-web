/** @jest-environment node */
import { GET, POST } from '@/app/api/custom-providers/[...path]/route';
import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { encryptKey, decryptKey, providerRequest } from '@/lib/server/custom-provider';
jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn() }));
jest.mock('convex/browser', () => ({ ConvexHttpClient: jest.fn() }));
jest.mock('@/lib/server/custom-provider', () => ({ ...jest.requireActual('@/lib/server/custom-provider'), providerRequest: jest.fn(), resolvePublic: jest.fn() }));
const db = { setAuth: jest.fn(), query: jest.fn(), mutation: jest.fn() };
function call(action: string, body?: object, origin = 'https://sayit.example') {
  const req = new NextRequest('https://sayit.example/api/custom-providers/' + action, { method: body ? 'POST' : 'GET', headers: { Origin: origin, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return (body ? POST : GET)(req, { params: Promise.resolve({ path: [action] }) });
}
beforeEach(() => {
  jest.clearAllMocks();
  process.env.CUSTOM_PROVIDER_BRIDGE_SECRET = 'b'.repeat(40);
  process.env.NEXT_PUBLIC_CONVEX_URL = 'https://example.convex.cloud';
  process.env.CUSTOM_PROVIDER_ENCRYPTION_KEYS = JSON.stringify({ '1': Buffer.alloc(32, 42).toString('base64') });
  process.env.CUSTOM_PROVIDER_KEY_VERSION = '1';
  (auth as jest.Mock).mockResolvedValue({ userId: 'alice', getToken: async () => 'signed-user-token' });
  (ConvexHttpClient as unknown as jest.Mock).mockImplementation(() => db);
  db.query.mockResolvedValue({ baseUrl: 'https://voice.example', encryptedKey: encryptKey('private-key', 'alice') });
  db.mutation.mockResolvedValue('connection');
  (providerRequest as jest.Mock).mockResolvedValue({ data: Buffer.from(JSON.stringify({ voices: [{ voice_id: 'voice', name: 'Voice', private: 'hidden' }] })), type: 'application/json' });
});
test('requires sign-in and same-origin mutations', async () => {
  expect((await call('test', {}, 'https://evil.example')).status).toBe(403);
  (auth as jest.Mock).mockResolvedValue({ userId: null });
  expect((await call('connections')).status).toBe(401);
  expect(providerRequest).not.toHaveBeenCalled();
});
test('masked edit retains key but changing the destination requires re-entry', async () => {
  const result = await call('save', { id: 'connection', name: 'Renamed', baseUrl: 'https://voice.example' });
  expect(result.status).toBe(200);
  const args = db.mutation.mock.calls[0][1];
  expect(decryptKey(args.encryptedKey, 'alice')).toBe('private-key');
  expect(await result.text()).not.toContain('private-key');
  expect((await call('save', { id: 'connection', name: 'Moved', baseUrl: 'https://another.example' })).status).toBe(400);
});
test('never leaks private upstream voice fields or secret errors', async () => {
  const result = await call('voices', { id: 'connection' });
  expect(await result.json()).toEqual({ voices: [{ voice_id: 'voice', name: 'Voice' }] });
  (providerRequest as jest.Mock).mockRejectedValue(new Error('private-key private URL'));
  const failed = await call('voices', { id: 'connection' });
  expect(await failed.text()).not.toContain('private-key');
});
test('speech only uses owned saved destination and returns typed audio', async () => {
  (providerRequest as jest.Mock).mockResolvedValue({ data: Buffer.from('RIFFaudio'), type: 'audio/wav' });
  const result = await call('speech', { id: 'connection', text: 'Hello', voiceId: 'a/b', baseUrl: 'https://evil.example', apiKey: 'injected' });
  expect(result.status).toBe(200); expect(result.headers.get('content-type')).toBe('audio/wav');
  expect((providerRequest as jest.Mock).mock.calls[0].slice(0, 4)).toEqual(['https://voice.example', '/v1/text-to-speech/a%2Fb', 'private-key', { text: 'Hello' }]);
});
test('rejects inaccessible connections, excessive text and non-audio responses', async () => {
  db.query.mockRejectedValueOnce(new Error('not owner'));
  expect((await call('speech', { id: 'other', text: 'Hello', voiceId: 'voice' })).status).toBe(404);
  expect((await call('speech', { id: 'connection', text: 'x'.repeat(501), voiceId: 'voice' })).status).toBe(400);
  (providerRequest as jest.Mock).mockResolvedValue({ data: Buffer.from('<html>'), type: 'text/html' });
  expect((await call('speech', { id: 'connection', text: 'Hello', voiceId: 'voice' })).status).toBe(502);
});
