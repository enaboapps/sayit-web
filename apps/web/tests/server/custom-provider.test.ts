/** @jest-environment node */
import { encryptKey, decryptKey, isPublicAddress, normalizeBase, resolvePublic, providerRequest } from '@/lib/server/custom-provider';
import { lookup } from 'node:dns/promises';
import { request } from 'node:https';
import { EventEmitter } from 'node:events';
jest.mock('node:dns/promises', () => ({ lookup: jest.fn() }));
jest.mock('node:https', () => ({ request: jest.fn() }));

beforeEach(() => {
  process.env.CUSTOM_PROVIDER_ENCRYPTION_KEYS = JSON.stringify({ '1': Buffer.alloc(32, 42).toString('base64') });
  process.env.CUSTOM_PROVIDER_KEY_VERSION = '1';
  jest.clearAllMocks();
});
test('authenticated encryption binds credentials to their owner and supports rotation', () => {
  const first = encryptKey('secret', 'alice');
  expect(first).not.toContain('secret');
  expect(encryptKey('secret', 'alice')).not.toBe(first);
  expect(decryptKey(first, 'alice')).toBe('secret');
  expect(() => decryptKey(first, 'bob')).toThrow();
  const parts = first.split('.'); parts[3] = Buffer.from('tampered').toString('base64');
  expect(() => decryptKey(parts.join('.'), 'alice')).toThrow();
  process.env.CUSTOM_PROVIDER_ENCRYPTION_KEYS = JSON.stringify({ '1': Buffer.alloc(32, 42).toString('base64'), '2': Buffer.alloc(32, 43).toString('base64') });
  process.env.CUSTOM_PROVIDER_KEY_VERSION = '2';
  expect(decryptKey(first, 'alice')).toBe('secret');
  expect(encryptKey('new', 'alice')).toMatch(/^2\./);
});
test.each(['127.0.0.1', '10.1.2.3', '169.254.169.254', '172.16.1.1', '192.168.1.1', '100.64.1.1', '0.0.0.0', '224.1.1.1', '::1', '::ffff:127.0.0.1', 'fd00::1', 'fe80::1', '2002:7f00::1', '2001:db8::1', 'not-ip'])('rejects nonpublic destination %s', address => expect(isPublicAddress(address)).toBe(false));
test.each(['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111'])('accepts public destination %s', address => expect(isPublicAddress(address)).toBe(true));
test.each(['http://example.com', 'https://user:pass@example.com', 'https://example.com/?key=secret', 'https://example.com:8080', 'https://example.com/v1'])('rejects unsafe base %s', base => expect(() => normalizeBase(base)).toThrow());
test('rejects mixed public/private DNS answers', async () => {
  (lookup as jest.Mock).mockResolvedValue([{ address: '8.8.8.8', family: 4 }, { address: '10.0.0.1', family: 4 }]);
  await expect(resolvePublic('example.com')).rejects.toThrow('not a public');
});
test('pins a checked address and rejects redirects without forwarding credentials', async () => {
  (lookup as jest.Mock).mockResolvedValue([{ address: '8.8.8.8', family: 4 }]);
  let options: { lookup: (hostname: string, options: object, callback: jest.Mock) => void };
  (request as jest.Mock).mockImplementation((_url, opts, callback) => {
    options = opts;
    const req = new EventEmitter() as EventEmitter & { end: () => void; destroy: () => void; statusCode: number; headers: Record<string, string> };
    req.end = () => { const res = new EventEmitter() as EventEmitter & { end: () => void; destroy: () => void; statusCode: number; headers: Record<string, string> }; res.statusCode = 302; res.destroy = jest.fn(); callback(res); req.emit('close'); };
    return req;
  });
  await expect(providerRequest('https://example.com', '/v1/voices', 'secret')).rejects.toThrow('could not complete');
  const callback = jest.fn(); options.lookup('example.com', {}, callback);
  expect(callback).toHaveBeenCalledWith(null, '8.8.8.8', 4);
  expect(request).toHaveBeenCalledTimes(1);
});

test('bounds response bytes', async () => {
  (lookup as jest.Mock).mockResolvedValue([{ address: '8.8.8.8', family: 4 }]);
  const destroy = jest.fn();
  (request as jest.Mock).mockImplementation((_url, _opts, callback) => {
    const req = new EventEmitter() as EventEmitter & { end: () => void; destroy: () => void; statusCode: number; headers: Record<string, string> };
    req.destroy = () => { destroy(); req.emit('close'); };
    req.end = () => {
      const res = new EventEmitter() as EventEmitter & { end: () => void; destroy: () => void; statusCode: number; headers: Record<string, string> }; res.statusCode = 200; res.headers = { 'content-type': 'application/json' };
      callback(res); res.emit('data', Buffer.alloc(512 * 1024 + 1));
    };
    return req;
  });
  await expect(providerRequest('https://example.com', '/v1/voices', 'secret')).rejects.toThrow('too large');
  expect(destroy).toHaveBeenCalled();
});
test('bounds a stalled response even if the server never closes the socket', async () => {
  jest.useFakeTimers();
  (lookup as jest.Mock).mockResolvedValue([{ address: '8.8.8.8', family: 4 }]);
  (request as jest.Mock).mockImplementation(() => {
    const req = new EventEmitter() as EventEmitter & { end: () => void; destroy: () => void; statusCode: number; headers: Record<string, string> };
    req.end = jest.fn(); req.destroy = () => req.emit('close'); return req;
  });
  const result = providerRequest('https://example.com', '/v1/voices', 'secret');
  const assertion = expect(result).rejects.toThrow('timed out');
  await jest.advanceTimersByTimeAsync(16_000);
  await assertion;
  jest.useRealTimers();
});
