import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../lib/auth';
import { listOrders, getOrderById } from '../../../lib/admin';
import { getDb } from '../../../lib/db';
import { orders } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ request, url }) => {
  const { authorized } = await requireAdmin(request);
  if (!authorized) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const id = url.searchParams.get('id');
  if (id) {
    const order = await getOrderById(id);
    if (!order) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    return new Response(JSON.stringify(order));
  }

  const status = url.searchParams.get('status') || undefined;
  const search = url.searchParams.get('search') || undefined;
  const items = await listOrders({ status, search });
  return new Response(JSON.stringify(items));
};

export const PUT: APIRoute = async ({ request }) => {
  const { authorized } = await requireAdmin(request);
  if (!authorized) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const body = await request.json();
  const db = getDb();
  await db.update(orders).set({
    status: body.status,
    paymentStatus: body.paymentStatus,
    fulfillmentStatus: body.fulfillmentStatus,
    notes: body.notes,
    updatedAt: new Date().toISOString(),
  }).where(eq(orders.id, body.id));

  return new Response(JSON.stringify({ success: true }));
};
