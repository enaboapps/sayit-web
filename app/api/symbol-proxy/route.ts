import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 },
      );
    }

    // Only allow proxying from Global Symbols domains
    const parsedUrl = new URL(url);
    const allowedHosts = ['globalsymbols.com', 'www.globalsymbols.com', 'mulberrysymbols.org', 'www.mulberrysymbols.org'];
    if (!allowedHosts.some((host) => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`))) {
      return NextResponse.json(
        { error: 'URL not allowed' },
        { status: 403 },
      );
    }

    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status },
      );
    }

    const contentType = response.headers.get('content-type') ?? 'image/png';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error in symbol proxy:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 },
    );
  }
}
