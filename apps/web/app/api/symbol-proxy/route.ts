import { NextResponse } from 'next/server';
import { apiRoute, ApiError } from '@/lib/server/api-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_HOSTS = ['globalsymbols.com', 'www.globalsymbols.com', 'mulberrysymbols.org', 'www.mulberrysymbols.org'];

export const GET = apiRoute({ name: 'symbol proxy', access: 'user' }, async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) throw new ApiError(400, 'URL parameter is required');

  // Only allow proxying from Global Symbols domains over HTTPS
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new ApiError(400, 'URL parameter is invalid');
  }
  if (parsedUrl.protocol !== 'https:') throw new ApiError(403, 'URL not allowed');
  if (!ALLOWED_HOSTS.some((host) => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`))) {
    throw new ApiError(403, 'URL not allowed');
  }

  const response = await fetch(url);
  if (!response.ok) throw new ApiError(response.status, 'Failed to fetch image');

  const contentType = response.headers.get('content-type') ?? 'image/png';
  const buffer = await response.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  });
});
