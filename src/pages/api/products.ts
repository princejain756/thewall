import type { APIRoute } from 'astro';
import { listProducts, getCollectionBySlug, getProductBySlug } from '../../lib/products';

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('slug');
  const collection = url.searchParams.get('collection');
  const search = url.searchParams.get('search') || undefined;
  const featured = url.searchParams.get('featured') === 'true';
  const limit = parseInt(url.searchParams.get('limit') || '24', 10);

  if (slug) {
    const product = await getProductBySlug(slug);
    if (!product) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    return new Response(JSON.stringify(product));
  }

  if (collection) {
    const col = await getCollectionBySlug(collection);
    if (!col) return new Response(JSON.stringify({ error: 'Collection not found' }), { status: 404 });
    const items = await listProducts({ collection: col.id, limit });
    return new Response(JSON.stringify({ collection: col, products: items }));
  }

  const items = await listProducts({ featured, search, limit });
  return new Response(JSON.stringify(items));
};
