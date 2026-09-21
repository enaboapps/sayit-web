import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { NextRequest, NextResponse } from 'next/server';
import { decryptKey, encryptKey, normalizeBase, providerRequest, ProviderError, resolvePublic } from '@/lib/server/custom-provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
const headers = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) throw new ProviderError('Sign in to use custom voices.', 401);
    if (request.method !== 'GET' && request.headers.get('origin') !== request.nextUrl.origin) throw new ProviderError('Request origin is not allowed.', 403);
    const token = await getToken({ template: 'convex' });
    const bridge = process.env.CUSTOM_PROVIDER_BRIDGE_SECRET;
    if (!token || !bridge || bridge.length < 32 || !process.env.NEXT_PUBLIC_CONVEX_URL) throw new ProviderError('Custom providers are not configured. Contact the administrator.', 503);
    const db = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
    db.setAuth(token);
    const { path } = await context.params;
    if (path.length !== 1) throw new ProviderError('Not found.', 404);
    if (request.method === 'GET' && path[0] === 'connections') return NextResponse.json(await db.query(api.customProviders.list, { bridge }), { headers });
    if (request.method !== 'POST') throw new ProviderError('Not found.', 404);
    const reader = request.body?.getReader();
    const chunks: Uint8Array[] = []; let size = 0;
    if (reader) {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 12_000) { await reader.cancel(); throw new ProviderError('Request is too large.', 413); }
        chunks.push(value);
      }
    }
    const raw = Buffer.concat(chunks).toString('utf8');
    let body;
    try { body = JSON.parse(raw); } catch { throw new ProviderError('Invalid request.'); }
    if (!body || typeof body !== 'object') throw new ProviderError('Invalid request.');
    const action = path[0];
    if (!['save', 'remove', 'voices', 'speech', 'test'].includes(action)) throw new ProviderError('Not found.', 404);
    let saved;
    if (body.id) {
      if (typeof body.id !== 'string') throw new ProviderError('Invalid connection.');
      try { saved = await db.query(api.customProviders.read, { bridge, id: body.id }); } catch { throw new ProviderError('Connection not found. Refresh voice settings.', 404); }
    }
    if (action === 'remove') {
      if (!saved) throw new ProviderError('Select a connection.');
      await db.mutation(api.customProviders.remove, { bridge, id: body.id });
      return NextResponse.json({ ok: true }, { headers });
    }
    const editing = action === 'save' || action === 'test';
    const baseUrl = normalizeBase(editing ? body.baseUrl : saved?.baseUrl);
    // Retaining a key while changing its destination could disclose it to another server.
    if (editing && saved && baseUrl !== saved.baseUrl && !body.apiKey) throw new ProviderError('Enter the key again when changing the server address.');
    const key = editing && body.apiKey ? body.apiKey : saved ? decryptKey(saved.encryptedKey, userId) : '';
    if (typeof key !== 'string' || !key.length || key.length > 4096 || /[\r\n]/.test(key)) throw new ProviderError('Enter a valid provider API key.');
    if (action === 'save') {
      if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 80) throw new ProviderError('Enter a connection name (up to 80 characters).');
      await resolvePublic(new URL(baseUrl).hostname);
      const id = await db.mutation(api.customProviders.save, { bridge, ...(saved ? { id: body.id } : {}), name: body.name.trim(), baseUrl, encryptedKey: encryptKey(key, userId) });
      return NextResponse.json({ id }, { headers });
    }
    if (action === 'speech') {
      if (!saved || typeof body.text !== 'string' || !body.text.trim() || body.text.length > 500 || typeof body.voiceId !== 'string' || !body.voiceId || body.voiceId.length > 256) throw new ProviderError('Select a voice and enter between 1 and 500 characters.');
      const response = await providerRequest(baseUrl, '/v1/text-to-speech/' + encodeURIComponent(body.voiceId), key, { text: body.text }, request.signal);
      if (!['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/ogg', 'audio/mp4', 'audio/flac'].includes(response.type) || !response.data.length) throw new ProviderError('Provider returned unsupported or empty audio.', 502);
      return new Response(new Uint8Array(response.data), { headers: { ...headers, 'Content-Type': response.type } });
    }
    const response = await providerRequest(baseUrl, '/v1/voices', key, undefined, request.signal);
    let data;
    try { data = JSON.parse(response.data.toString('utf8')); } catch { throw new ProviderError('Provider returned an invalid voice list.', 502); }
    if (!Array.isArray(data.voices) || data.voices.length > 1000 || data.voices.some((v: { voice_id?: unknown; name?: unknown }) => !v || typeof v.voice_id !== 'string' || !v.voice_id || v.voice_id.length > 256 || typeof v.name !== 'string' || v.name.length > 200)) throw new ProviderError('Provider returned an invalid voice list.', 502);
    return NextResponse.json({ voices: data.voices.map((v: { voice_id: string; name: string }) => ({ voice_id: v.voice_id, name: v.name })) }, { headers });
  } catch (error) {
    // Never reflect upstream payloads, keys, URLs, or database errors.
    return NextResponse.json({ error: error instanceof ProviderError ? error.message : 'Custom voice request failed. Check your settings and try again.' }, { status: error instanceof ProviderError ? error.status : 502, headers });
  }
}
export const GET = handle;
export const POST = handle;
