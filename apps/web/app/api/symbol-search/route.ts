import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GlobalSymbolResult {
  picto: {
    id: number;
    image_url: string;
    name?: string;
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limit = searchParams.get('limit') ?? '50';

    if (!query || !query.trim()) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 },
      );
    }

    const apiUrl = `https://globalsymbols.com/api/v1/labels/search?query=${encodeURIComponent(query.trim())}&limit=${encodeURIComponent(limit)}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to search symbols' },
        { status: response.status },
      );
    }

    const results: GlobalSymbolResult[] = await response.json();

    const symbols = results
      .filter((r) => r.picto?.image_url)
      .map((r) => ({
        id: r.picto.id,
        imageUrl: r.picto.image_url,
        name: r.picto.name ?? '',
      }));

    return NextResponse.json({ symbols });
  } catch (error) {
    console.error('Error in symbol search API:', error);
    return NextResponse.json(
      { error: 'Server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
