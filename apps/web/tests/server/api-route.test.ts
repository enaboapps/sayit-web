/** @jest-environment node */
import { auth, clerkClient } from '@clerk/nextjs/server';
import { apiRoute, ApiError, requireServerEnv, serverEnv } from '@/lib/server/api-route';

jest.mock('@clerk/nextjs/server', () => ({ auth: jest.fn(), clerkClient: jest.fn() }));

const getUser = jest.fn();

function signedIn(userId: string | null, plans: string[] = []) {
  (auth as unknown as jest.Mock).mockResolvedValue({
    userId,
    has: ({ plan }: { plan: string }) => plans.includes(plan),
  });
}

function post(body: unknown = {}) {
  return new Request('https://example.com/api/test', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const ok = jest.fn(async () => Response.json({ ok: true }));

beforeEach(() => {
  jest.clearAllMocks();
  (clerkClient as unknown as jest.Mock).mockResolvedValue({ users: { getUser } });
  getUser.mockResolvedValue({ publicMetadata: {} });
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('access levels', () => {
  test('public routes skip the sign-in check', async () => {
    const res = await apiRoute({ name: 'test', access: 'public' }, ok)(post());
    expect(res.status).toBe(200);
    expect(auth).not.toHaveBeenCalled();
  });

  test('user routes reject signed-out callers', async () => {
    signedIn(null);
    const res = await apiRoute({ name: 'test', access: 'user' }, ok)(post());
    expect(res.status).toBe(401);
    expect(ok).not.toHaveBeenCalled();
  });

  test('user routes pass the user ID to the handler', async () => {
    signedIn('user-1');
    await apiRoute({ name: 'test', access: 'user' }, ok)(post({ a: 1 }));
    expect(ok).toHaveBeenCalledWith(expect.objectContaining({ userId: 'user-1', body: { a: 1 } }));
  });

  test('pro routes accept the Pro plan without a Clerk lookup', async () => {
    signedIn('user-1', ['sayit_pro_monthly']);
    const res = await apiRoute({ name: 'test', access: 'pro' }, ok)(post());
    expect(res.status).toBe(200);
    expect(getUser).not.toHaveBeenCalled();
  });

  test('pro routes accept the bypass flag', async () => {
    signedIn('user-1');
    getUser.mockResolvedValue({ publicMetadata: { bypassSubscriptionCheck: true } });
    const res = await apiRoute({ name: 'test', access: 'pro' }, ok)(post());
    expect(res.status).toBe(200);
    expect(getUser).toHaveBeenCalledWith('user-1');
  });

  test('pro routes reject signed-in users without Pro', async () => {
    signedIn('user-1');
    const res = await apiRoute({ name: 'test', access: 'pro' }, ok)(post());
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'SayIt Pro is required' });
    expect(ok).not.toHaveBeenCalled();
  });

  test('pro routes reject signed-out callers before looking anything up', async () => {
    signedIn(null);
    const res = await apiRoute({ name: 'test', access: 'pro' }, ok)(post());
    expect(res.status).toBe(401);
    expect(getUser).not.toHaveBeenCalled();
  });
});

describe('allow', () => {
  test('lets a caller through who fails the access check', async () => {
    signedIn(null);
    const allow = jest.fn(async () => true);
    const res = await apiRoute({ name: 'test', access: 'pro', allow }, ok)(post({ text: 'hi' }));
    expect(res.status).toBe(200);
    expect(allow).toHaveBeenCalledWith(expect.objectContaining({ body: { text: 'hi' } }));
  });

  test('keeps the original denial when it says no', async () => {
    signedIn('user-1');
    const res = await apiRoute({ name: 'test', access: 'pro', allow: async () => false }, ok)(post());
    expect(res.status).toBe(403);
  });

  test('is not consulted when the caller already has access', async () => {
    signedIn('user-1', ['sayit_pro_monthly']);
    const allow = jest.fn(async () => false);
    await apiRoute({ name: 'test', access: 'pro', allow }, ok)(post());
    expect(allow).not.toHaveBeenCalled();
  });
});

describe('errors', () => {
  test('invalid JSON is a 400', async () => {
    const res = await apiRoute({ name: 'test', access: 'public' }, ok)(post('not json'));
    expect(res.status).toBe(400);
  });

  test('ApiError becomes its status and message', async () => {
    const res = await apiRoute({ name: 'test', access: 'public' }, async () => {
      throw new ApiError(422, 'Nope');
    })(post());
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({ error: 'Nope' });
  });

  test('other errors are a 500 without internal details', async () => {
    const res = await apiRoute({ name: 'test', access: 'public' }, async () => {
      throw new Error('secret internals');
    })(post());
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'Server error' });
  });

  test('GET requests have an empty body', async () => {
    await apiRoute({ name: 'test', access: 'public' }, ok)(new Request('https://example.com/api/test'));
    expect(ok).toHaveBeenCalledWith(expect.objectContaining({ body: {} }));
  });
});

describe('server env', () => {
  const saved = { ...process.env };
  afterEach(() => { process.env = { ...saved }; });

  test('serverEnv trims a BOM and whitespace, and treats blank as unset', () => {
    process.env.TEST_KEY = '﻿ value \n';
    process.env.BLANK_KEY = '  ';
    expect(serverEnv('TEST_KEY')).toBe('value');
    expect(serverEnv('BLANK_KEY')).toBeUndefined();
  });

  test('requireServerEnv throws a 500 ApiError when one is missing', () => {
    process.env.TEST_KEY = 'value';
    delete process.env.OTHER_KEY;
    expect(requireServerEnv('TEST_KEY')).toEqual({ TEST_KEY: 'value' });
    expect(() => requireServerEnv('TEST_KEY', 'OTHER_KEY')).toThrow(ApiError);
  });
});
