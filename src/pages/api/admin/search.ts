import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../lib/auth';
import { adminSearch } from '../../../lib/admin';

export const GET: APIRoute = async ({ request, url }) => {
  const { authorized } = await requireAdmin(request);
  if (!authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const q = url.searchParams.get('q') || '';
  const results = await adminSearch(q);
  return new Response(JSON.stringify(results), {
    headers: { 'Content-Type': 'application/json' },
  });
};
