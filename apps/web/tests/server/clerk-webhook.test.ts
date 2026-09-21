/** @jest-environment node */
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { ConvexHttpClient } from 'convex/browser';
import { POST } from '@/app/api/webhooks/clerk/route';

jest.mock('next/headers', () => ({ headers: jest.fn() }));
jest.mock('convex/browser', () => ({ ConvexHttpClient: jest.fn() }));
const secret = 'whsec_' + Buffer.alloc(32, 42).toString('base64');
const mutate = jest.fn();
const event = { type: 'user.created', data: { id: 'test-user', email_addresses: [{ email_address: 'test@example.com' }], first_name: 'Test', last_name: 'User' } };
function request(body: string, signedBody = body, date = new Date()) {
  (headers as jest.Mock).mockResolvedValue(new Headers({
    'svix-id': 'message-id',
    'svix-timestamp': String(Math.floor(date.getTime() / 1000)),
    'svix-signature': new Webhook(secret).sign('message-id', date, signedBody),
  }));
  return new Request('https://example.com/api/webhooks/clerk', { method: 'POST', body });
}
beforeEach(() => {
  jest.clearAllMocks();
  process.env.CLERK_WEBHOOK_SECRET = secret;
  process.env.NEXT_PUBLIC_CONVEX_URL = 'https://example.convex.cloud';
  (ConvexHttpClient as unknown as jest.Mock).mockImplementation(() => ({ mutation: mutate }));
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());
test('verifies original bytes before parsing the event under Svix 2', async () => {
  const body = JSON.stringify(event, null, 2) + '\n';
  expect((await POST(request(body))).status).toBe(200);
  expect(mutate).toHaveBeenCalledWith(expect.anything(), { userId: 'test-user', email: 'test@example.com', fullName: 'Test User' });
});
test('rejects tampering and old signatures before any mutation', async () => {
  const body = JSON.stringify(event);
  expect((await POST(request(body + ' ', body))).status).toBe(400);
  expect((await POST(request(body, body, new Date(Date.now() - 10 * 60_000)))).status).toBe(400);
  expect(mutate).not.toHaveBeenCalled();
});
test('rejects missing signature headers and signed invalid JSON', async () => {
  const req = request(JSON.stringify(event));
  (headers as jest.Mock).mockResolvedValue(new Headers());
  expect((await POST(req)).status).toBe(400);
  expect((await POST(request('not json'))).status).toBe(400);
  expect(mutate).not.toHaveBeenCalled();
});
