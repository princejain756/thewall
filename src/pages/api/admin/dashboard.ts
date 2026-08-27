import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../lib/auth';
import { getDashboardStats } from '../../../lib/admin';

export const GET: APIRoute = async ({ request }) => {
  const { authorized } = await requireAdmin(request);
  if (!authorized) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  const stats = await getDashboardStats();
  return new Response(JSON.stringify(stats), { headers: { 'Content-Type': 'application/json' } });
};
