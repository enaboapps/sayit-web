import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { request } from 'node:https';

export class ProviderError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function encryptionKeys() {
  const keys: Record<string, string> = JSON.parse(process.env.CUSTOM_PROVIDER_ENCRYPTION_KEYS || '{}');
  const version = process.env.CUSTOM_PROVIDER_KEY_VERSION || '1';
  if (!keys[version] || Buffer.from(keys[version], 'base64').length !== 32) throw new ProviderError('Custom providers are not configured. Contact the administrator.', 503);
  return { keys, version };
}
export function encryptKey(value: string, owner: string): string {
  const { keys, version } = encryptionKeys();
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(keys[version], 'base64'), nonce);
  cipher.setAAD(Buffer.from(owner));
  const data = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [version, nonce.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join('.');
}
export function decryptKey(value: string, owner: string): string {
  try {
    const { keys } = encryptionKeys();
    const [version, nonce, tag, data] = value.split('.');
    const cipher = createDecipheriv('aes-256-gcm', Buffer.from(keys[version], 'base64'), Buffer.from(nonce, 'base64'));
    cipher.setAAD(Buffer.from(owner));
    cipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([cipher.update(Buffer.from(data, 'base64')), cipher.final()]).toString('utf8');
  } catch { throw new ProviderError('Saved key cannot be read. Enter the provider key again.', 503); }
}
// Allow public unicast only. IPv6 is deliberately limited to global 2000::/3,
// excluding transition/documentation ranges which can embed private IPv4.
export function isPublicAddress(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b, c] = ip.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127)
      || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99)))
      || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113));
  }
  if (isIP(ip) !== 6) return false;
  const first = parseInt(ip.split(':')[0], 16);
  return first >= 0x2000 && first <= 0x3fff && !/^200[12]:/i.test(ip) && !/^3fff:/i.test(ip);
}
export function normalizeBase(value: string): string {
  let url: URL;
  try { url = new URL(value); } catch { throw new ProviderError('Enter a valid HTTPS server address.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || (url.port && url.port !== '443')) throw new ProviderError('Use an HTTPS address without credentials, query parameters, or a custom port.');
  if (url.pathname.split('/').includes('v1')) throw new ProviderError('Enter the server address without /v1.');
  return url.toString().replace(/\/+$/, '');
}
export async function resolvePublic(hostname: string) {
  const host = hostname.replace(/^\[|\]$/g, '');
  let timer: ReturnType<typeof setTimeout> | undefined;
  const addresses = await Promise.race([
    isIP(host) ? Promise.resolve([{ address: host, family: isIP(host) }]) : lookup(host, { all: true }),
    new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new ProviderError('Server address lookup timed out.', 504)), 3000); }),
  ]).finally(() => clearTimeout(timer));
  if (!addresses.length || addresses.some(a => !isPublicAddress(a.address))) throw new ProviderError('This server address is not a public internet destination.');
  return addresses[0];
}
export async function providerRequest(base: string, path: string, key: string, body?: object, signal?: AbortSignal) {
  const url = new URL(normalizeBase(base) + path);
  const address = await resolvePublic(url.hostname);
  const payload = body ? JSON.stringify(body) : undefined;
  return new Promise<{ data: Buffer; type: string }>((resolve, reject) => {
    const limit = body ? 4 * 1024 * 1024 : 512 * 1024;
    const req = request(url, {
      method: body ? 'POST' : 'GET', agent: false, signal, family: address.family,
      headers: { 'xi-api-key': key, Accept: body ? 'audio/*' : 'application/json', ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}) },
      // Pin the validated address for this connection, retaining hostname TLS verification.
      lookup: (_hostname, _options, callback) => callback(null, address.address, address.family),
    }, res => {
      const status = res.statusCode || 502;
      if (status < 200 || status >= 300) {
        res.destroy();
        reject(new ProviderError(status === 401 || status === 403 ? 'Provider rejected the key. Update it in voice settings.' : status === 409 || status === 429 ? 'Voice server is busy. Wait a moment and try again.' : status === 503 ? 'Voice server is off or starting. Start it in your provider app.' : 'Provider could not complete the request. Check your server address and try again.', status === 409 || status === 429 ? 409 : 502));
        return;
      }
      const chunks: Buffer[] = []; let size = 0;
      res.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > limit) { req.destroy(); reject(new ProviderError('Provider response is too large.', 502)); }
        else chunks.push(chunk);
      });
      res.on('error', () => reject(new ProviderError('Provider connection ended unexpectedly. Try again.', 502)));
      res.on('end', () => resolve({ data: Buffer.concat(chunks), type: String(res.headers['content-type'] || '').split(';')[0].toLowerCase() }));
    });
    const timer = setTimeout(() => { req.destroy(); reject(new ProviderError('Voice request timed out. Check your provider before trying again.', 504)); }, body ? 110_000 : 15_000);
    req.on('close', () => clearTimeout(timer));
    req.on('error', () => reject(new ProviderError('Cannot reach the voice server. Check the address and try again.', 502)));
    req.end(payload);
  });
}
