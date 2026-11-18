import { NextResponse } from 'next/server';
import { apiRoute, ApiError } from '@/lib/server/api-route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GlobalSymbolResult {
  picto: {
    id: number;
    image_url: string;
    name?: string;
  };
}

export const GET = apiRoute({ name: 'symbol search API', access: 'user' }, async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');
  const limit = searchParams.get('limit') ?? '50';

  if (!query || !query.trim()) throw new ApiError(400, 'Query parameter is required');

  const apiUrl = `https://globalsymbols.com/api/v1/labels/search?query=${encodeURIComponent(query.trim())}&limit=${encodeURIComponent(limit)}`;
  const response = await fetch(apiUrl);

  if (!response.ok) throw new ApiError(response.status, 'Failed to search symbols');

  const results: GlobalSymbolResult[] = await response.json();

  const symbols = results
    .filter((r) => r.picto?.image_url)
    .map((r) => ({
      id: r.picto.id,
      imageUrl: r.picto.image_url,
      name: r.picto.name ?? '',
    }));

  return NextResponse.json({ symbols });
});
