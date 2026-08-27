import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../lib/auth';
import { listCustomers, listDiscounts } from '../../../lib/admin';
import { getDb } from '../../../lib/db';
import { discounts, customers } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { listCollections } from '../../../lib/products';

export const GET: APIRoute = async ({ request, url }) => {
  const { authorized } = await requireAdmin(request);
  if (!authorized) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const type = url.searchParams.get('type');
  if (type === 'customers') return new Response(JSON.stringify(await listCustomers()));
  if (type === 'discounts') return new Response(JSON.stringify(await listDiscounts()));
  if (type === 'collections') return new Response(JSON.stringify(await listCollections()));

  return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });
};

export const POST: APIRoute = async ({ request, url }) => {
  const { authorized } = await requireAdmin(request);
  if (!authorized) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const type = url.searchParams.get('type');
  if (type !== 'discounts') return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });

  const body = await request.json();
  const db = getDb();
  const id = nanoid();
  await db.insert(discounts).values({
    id,
    title: body.title,
    code: body.code || null,
    type: body.type || 'percentage',
    value: body.value,
    minOrder: body.minOrder || 0,
    usageLimit: body.usageLimit,
    active: body.active ?? true,
    automatic: body.automatic ?? false,
    createdAt: new Date().toISOString(),
  });

  return new Response(JSON.stringify({ id }), { status: 201 });
};

export const PUT: APIRoute = async ({ request, url }) => {
  const { authorized } = await requireAdmin(request);
  if (!authorized) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const type = url.searchParams.get('type');
  const body = await request.json();
  const db = getDb();

  if (type === 'discounts') {
    await db.update(discounts).set({
      title: body.title,
      code: body.code,
      type: body.type,
      value: body.value,
      minOrder: body.minOrder,
      usageLimit: body.usageLimit,
      active: body.active,
      automatic: body.automatic,
    }).where(eq(discounts.id, body.id));

    return new Response(JSON.stringify({ success: true }));
  }

  if (type === 'customers') {
    await db.update(customers).set({
      name: body.name,
      phone: body.phone,
      source: body.source || null,
      notes: body.notes || null,
      tags: body.tags || [],
    }).where(eq(customers.id, body.id));

    return new Response(JSON.stringify({ success: true }));
  }

  return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });
};
