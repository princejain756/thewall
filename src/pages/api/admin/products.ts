import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../lib/auth';
import { listProducts, getProductById } from '../../../lib/products';
import { getDb } from '../../../lib/db';
import { products, productVariants } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export const GET: APIRoute = async ({ request, url }) => {
  const { authorized } = await requireAdmin(request);
  if (!authorized) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const search = url.searchParams.get('search') || undefined;
  const status = url.searchParams.get('status') || undefined;
  const collection = url.searchParams.get('collection') || undefined;
  const id = url.searchParams.get('id');

  if (id) {
    const product = await getProductById(id);
    if (!product) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    return new Response(JSON.stringify(product));
  }

  const items = await listProducts({ search, status, collection, limit: 5000 });
  return new Response(JSON.stringify(items));
};

export const POST: APIRoute = async ({ request }) => {
  const { authorized } = await requireAdmin(request);
  if (!authorized) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const body = await request.json();
  const db = getDb();
  const now = new Date().toISOString();
  const id = nanoid();

  await db.insert(products).values({
    id,
    title: body.title,
    slug: body.slug,
    description: body.description || '',
    collectionId: body.collectionId,
    collectionName: body.collectionName,
    images: body.images || [],
    status: body.status || 'draft',
    productType: body.productType || 'single',
    tags: body.tags || [],
    vendor: body.vendor || 'The Wall Records',
    featured: body.featured || false,
    onSale: body.onSale || false,
    createdAt: now,
    updatedAt: now,
  });

  if (body.variants) {
    for (const v of body.variants) {
      await db.insert(productVariants).values({
        id: nanoid(),
        productId: id,
        size: v.size,
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        sku: v.sku,
        inventory: v.inventory ?? 999,
      });
    }
  }

  return new Response(JSON.stringify({ id }), { status: 201 });
};

export const PUT: APIRoute = async ({ request }) => {
  const { authorized } = await requireAdmin(request);
  if (!authorized) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const body = await request.json();
  const db = getDb();
  const now = new Date().toISOString();

  await db.update(products).set({
    title: body.title,
    slug: body.slug,
    description: body.description,
    collectionId: body.collectionId,
    collectionName: body.collectionName,
    images: body.images || [],
    status: body.status,
    productType: body.productType,
    tags: body.tags || [],
    featured: body.featured,
    onSale: body.onSale,
    updatedAt: now,
  }).where(eq(products.id, body.id));

  if (body.variants) {
    await db.delete(productVariants).where(eq(productVariants.productId, body.id));
    for (const v of body.variants) {
      await db.insert(productVariants).values({
        id: v.id || nanoid(),
        productId: body.id,
        size: v.size,
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        sku: v.sku,
        inventory: v.inventory ?? 999,
      });
    }
  }

  return new Response(JSON.stringify({ success: true }));
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const { authorized } = await requireAdmin(request);
  if (!authorized) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const id = url.searchParams.get('id');
  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

  const db = getDb();
  await db.delete(productVariants).where(eq(productVariants.productId, id));
  await db.delete(products).where(eq(products.id, id));
  return new Response(JSON.stringify({ success: true }));
};
