import { eq, desc, asc, like, and, sql, count } from 'drizzle-orm';
import { getDb, normalizeImages } from './db';
import { products, productVariants, collections } from './db/schema';
import type { Product, ProductVariant } from './db/schema';

export type ProductWithVariants = Product & {
  variants: ProductVariant[];
  minPrice: number;
  maxPrice: number;
};

export function parseImages(images: unknown): string[] {
  return normalizeImages(images);
}

export function parseTags(tags: unknown): string[] {
  return normalizeImages(tags);
}

function withVariantPrices(product: Product, variants: ProductVariant[]): ProductWithVariants {
  const prices = variants.map((v) => v.price);
  return {
    ...product,
    images: parseImages(product.images),
    tags: parseTags(product.tags),
    variants,
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
  };
}

function isReadableTitle(title: string): boolean {
  if (title.length < 5 || title.length > 90) return false;
  if (/^[0-9A-F]{8}-[0-9A-F]{4}-/i.test(title)) return false;
  if (/^IMG_\d+$/i.test(title)) return false;
  if (/^download$/i.test(title)) return false;
  return true;
}

export async function getProductBySlug(slug: string): Promise<ProductWithVariants | null> {
  const db = getDb();
  const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  if (!product) return null;

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, product.id));

  return withVariantPrices(product, variants);
}

export async function getProductById(id: string): Promise<ProductWithVariants | null> {
  const db = getDb();
  const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!product) return null;

  const variants = await db
    .select()
    .from(productVariants)
    .where(eq(productVariants.productId, product.id));

  return withVariantPrices(product, variants);
}

export async function listProducts(opts: {
  collection?: string;
  status?: string;
  search?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
} = {}): Promise<ProductWithVariants[]> {
  const db = getDb();
  const conditions = [];

  if (opts.collection) conditions.push(eq(products.collectionId, opts.collection));
  if (opts.status === 'all') {
    // Admin: show every status
  } else if (opts.status) {
    conditions.push(eq(products.status, opts.status));
  } else {
    conditions.push(eq(products.status, 'active'));
  }
  if (opts.search) conditions.push(like(products.title, `%${opts.search}%`));
  if (opts.featured) conditions.push(eq(products.featured, true));

  const rows = await db
    .select()
    .from(products)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(products.createdAt))
    .limit(opts.limit ?? 100)
    .offset(opts.offset ?? 0);

  const result: ProductWithVariants[] = [];
  for (const product of rows) {
    const variants = await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, product.id));
    result.push(withVariantPrices(product, variants));
  }
  return result;
}

/** One standout product per collection for the homepage carousel — real catalog only. */
export async function listHomepageProducts(limit = 12): Promise<ProductWithVariants[]> {
  const cols = await listCollections();
  const picked: ProductWithVariants[] = [];

  for (const col of cols) {
    const items = await listProducts({ collection: col.id, limit: 30 });
    const best =
      items.find((p) => isReadableTitle(p.title) && p.onSale) ||
      items.find((p) => isReadableTitle(p.title)) ||
      items[0];
    if (best) picked.push(best);
    if (picked.length >= limit) break;
  }

  return picked.slice(0, limit);
}

export async function listCollections() {
  const db = getDb();
  return db.select().from(collections).orderBy(asc(collections.name));
}

export async function getCollectionBySlug(slug: string) {
  const db = getDb();
  const [col] = await db.select().from(collections).where(eq(collections.slug, slug)).limit(1);
  return col ?? null;
}

export async function getProductCount(): Promise<number> {
  const db = getDb();
  const [result] = await db.select({ count: count() }).from(products);
  return result?.count ?? 0;
}

export const SIZES = ['A4', 'A5', 'A3', '13x19"'] as const;
export const SIZE_PRICES: Record<string, { price: number; compareAt: number }> = {
  A4: { price: 7900, compareAt: 14900 },
  A5: { price: 5900, compareAt: 9900 },
  A3: { price: 14900, compareAt: 24900 },
  '13x19"': { price: 19900, compareAt: 29900 },
};

export const DEFAULT_DESCRIPTION = `Premium high-definition wall poster designed to instantly upgrade the aesthetic of your room.

Printed on ultra-thick 300 GSM matte photo paper for rich colours, sharp detailing and a soft anti-glare finish. Long-lasting, fade-resistant and crafted to give your wall a clean, premium look with zero effort.

This poster blends perfectly into bedroom, living room, gaming setup or workspace décor. Easy to frame, perfect for collage walls, and ideal for anyone who loves aesthetic room vibes, minimal design and high-quality prints.

A great pick for personal use or gifting — made to match your vibe and elevate your space.`;
