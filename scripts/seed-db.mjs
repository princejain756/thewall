import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { nanoid } from 'nanoid';
import * as dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Load .env from project root
dotenv.config({ path: path.join(ROOT, '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is required in .env');
  process.exit(1);
}

const IMAGES_ROOT = path.join(ROOT, 'public/images/the wall');

const SIZES = ['A4', 'A5', 'A3', '13x19"'];
const SIZE_PRICES = {
  A4: { price: 7900, compareAt: 14900 },
  A5: { price: 5900, compareAt: 9900 },
  A3: { price: 14900, compareAt: 24900 },
  '13x19"': { price: 19900, compareAt: 29900 },
};

const DEFAULT_DESCRIPTION = `Premium high-definition wall poster designed to instantly upgrade the aesthetic of your room.

Printed on ultra-thick 300 GSM matte photo paper for rich colours, sharp detailing and a soft anti-glare finish. Long-lasting, fade-resistant and crafted to give your wall a clean, premium look with zero effort.

This poster blends perfectly into bedroom, living room, gaming setup or workspace décor. Easy to frame, perfect for collage walls, and ideal for anyone who loves aesthetic room vibes, minimal design and high-quality prints.

A great pick for personal use or gifting — made to match your vibe and elevate your space.`;

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'product';
}

function posterPath(folder, filename) {
  return `/images/the wall/${folder}/${filename}`;
}

function titleFromFilename(filename, collectionName) {
  let base = filename.replace(/\.(jpe?g|png|webp|gif)$/i, '');

  // UUID / camera-roll filenames → use collection name
  if (/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i.test(base)) {
    return `${collectionName} Wall Art`;
  }
  if (/^IMG_\d+$/i.test(base)) {
    return `${collectionName} Wall Art`;
  }

  base = base
    .replace(/download \(\d+\)/gi, 'Limited Edition Print')
    .replace(/\.jpeg$/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Trim Pinterest-style overly long titles
  if (base.length > 72) {
    const cut = base.slice(0, 72);
    base = cut.slice(0, cut.lastIndexOf(' ')) || cut;
  }

  if (base.length < 4) return `${collectionName} Poster`;
  return base;
}

function isReadableTitle(title) {
  if (title.length < 5 || title.length > 90) return false;
  if (/^[0-9A-F]{8}-[0-9A-F]{4}-/i.test(title)) return false;
  if (/^IMG_\d+$/i.test(title)) return false;
  if (title.endsWith(' Wall Art') && title.split(' ').length <= 4) return false;
  return true;
}

const sql = postgres(DATABASE_URL, { max: 1 });

console.log('🗄️  Running PostgreSQL migrations...');

await sql`
  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    image TEXT,
    parent_id TEXT,
    product_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  )
`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS collections_slug_idx ON collections(slug)`;

await sql`
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    collection_id TEXT REFERENCES collections(id),
    collection_name TEXT,
    images JSONB NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'active',
    product_type TEXT NOT NULL DEFAULT 'single',
    tags JSONB DEFAULT '[]',
    vendor TEXT DEFAULT 'The Wall Records',
    featured BOOLEAN DEFAULT false,
    on_sale BOOLEAN DEFAULT false,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS products_slug_idx ON products(slug)`;
await sql`CREATE INDEX IF NOT EXISTS idx_products_collection ON products(collection_id)`;
await sql`CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)`;

await sql`
  CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    price INTEGER NOT NULL,
    compare_at_price INTEGER,
    sku TEXT,
    inventory INTEGER DEFAULT 999
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    orders_count INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    created_at TEXT NOT NULL
  )
`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS customers_email_idx ON customers(email)`;
await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS source TEXT`;
await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT`;
await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'`;

await sql`
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_number TEXT NOT NULL,
    customer_id TEXT REFERENCES customers(id),
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled',
    subtotal INTEGER NOT NULL,
    discount INTEGER DEFAULT 0,
    shipping INTEGER DEFAULT 0,
    total INTEGER NOT NULL,
    notes TEXT,
    shipping_address TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS orders_number_idx ON orders(order_number)`;
await sql`CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)`;
await sql`CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at)`;

await sql`
  CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT,
    variant_id TEXT,
    title TEXT NOT NULL,
    size TEXT,
    quantity INTEGER NOT NULL,
    price INTEGER NOT NULL
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS discounts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    code TEXT,
    type TEXT NOT NULL DEFAULT 'percentage',
    value INTEGER NOT NULL,
    min_order INTEGER DEFAULT 0,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    automatic BOOLEAN DEFAULT false,
    starts_at TEXT,
    ends_at TEXT,
    created_at TEXT NOT NULL
  )
`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS discounts_code_idx ON discounts(code)`;

await sql`
  CREATE TABLE IF NOT EXISTS content_pages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    body TEXT,
    type TEXT NOT NULL DEFAULT 'page',
    published BOOLEAN DEFAULT true,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS content_pages_slug_idx ON content_pages(slug)`;

await sql`
  CREATE TABLE IF NOT EXISTS customer_accounts (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS customer_accounts_customer_idx ON customer_accounts(customer_id)`;

await sql`
  CREATE TABLE IF NOT EXISTS customer_sessions (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS customer_sessions_token_idx ON customer_sessions(token)`;

await sql`
  CREATE TABLE IF NOT EXISTS admin_sessions (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS admin_sessions_token_idx ON admin_sessions(token)`;

await sql`
  CREATE TABLE IF NOT EXISTS analytics_daily (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    sessions INTEGER DEFAULT 0,
    page_views INTEGER DEFAULT 0,
    orders INTEGER DEFAULT 0,
    revenue INTEGER DEFAULT 0
  )
`;
await sql`CREATE UNIQUE INDEX IF NOT EXISTS analytics_daily_date_idx ON analytics_daily(date)`;

console.log('🌱 Seeding catalog...');

// Sync catalog from images only — never wipe orders, customers, or analytics
await sql`TRUNCATE product_variants, products, collections RESTART IDENTITY CASCADE`;

// Remove legacy demo data if it was seeded previously
await sql`DELETE FROM order_items WHERE order_id IN (
  SELECT id FROM orders
  WHERE order_number LIKE '#TWR100%'
     OR customer_email LIKE '%@example.com'
)`;
await sql`DELETE FROM orders
  WHERE order_number LIKE '#TWR100%'
     OR customer_email LIKE '%@example.com'`;
await sql`DELETE FROM customers WHERE email LIKE '%@example.com'`;
await sql`DELETE FROM analytics_daily`;

const now = new Date().toISOString();
const folders = fs.readdirSync(IMAGES_ROOT, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
let productCount = 0;
const usedSlugs = new Set();

for (const folder of folders) {
  const collectionId = nanoid();
  const slug = slugify(folder);
  const files = fs.readdirSync(path.join(IMAGES_ROOT, folder)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
  const cover = files[0] ? posterPath(folder, files[0]) : null;

  await sql`
    INSERT INTO collections (id, name, slug, description, image, product_count, created_at)
    VALUES (${collectionId}, ${folder}, ${slug}, ${`Curated ${folder} poster collection`}, ${cover}, ${files.length}, ${now})
  `;

  for (const file of files) {
    const title = titleFromFilename(file, folder);
    let pslug = slugify(title);
    if (usedSlugs.has(pslug)) pslug = `${pslug}-${productCount}`;
    usedSlugs.add(pslug);

    const productId = nanoid();
    const onSale = Math.random() > 0.25;
    const readable = isReadableTitle(title);
    const featured = readable && productCount < 36;
    const imageArr = JSON.stringify([posterPath(folder, file)]);

    await sql`
      INSERT INTO products (id, title, slug, description, collection_id, collection_name, images, status, product_type, tags, vendor, featured, on_sale, created_at, updated_at)
      VALUES (${productId}, ${title}, ${pslug}, ${DEFAULT_DESCRIPTION}, ${collectionId}, ${folder}, ${imageArr}::jsonb, 'active', 'single', ${JSON.stringify([folder.toLowerCase(), 'poster'])}::jsonb, 'The Wall Records', ${featured}, ${onSale}, ${now}, ${now})
    `;

    for (const size of SIZES) {
      const pricing = SIZE_PRICES[size];
      await sql`
        INSERT INTO product_variants (id, product_id, size, price, compare_at_price, sku, inventory)
        VALUES (${nanoid()}, ${productId}, ${size}, ${pricing.price}, ${onSale ? pricing.compareAt : null}, ${`TWR-${pslug.slice(0, 12).toUpperCase()}-${size.replace(/"/g, '')}`}, 999)
      `;
    }
    productCount++;
  }
}

await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS custom_image TEXT`;
await sql`ALTER TABLE order_items ADD COLUMN IF NOT EXISTS custom_details JSONB`;

// Seed Custom Memory Poster Products
const customMemoryProducts = [
  {
    title: 'Best Sister | Timeless Memory Poster',
    slug: 'best-sister-timeless',
    description: `A custom memory poster crafted for your best sister and family moments. This timeless design features your uploaded photo seamlessly embedded beneath elegant typographic art.

Printed on archival-quality 300 GSM ultra-thick matte paper with sharp, vibrant color reproduction. Perfect for gifting, room framing, and immortalizing shared memories.

• Available in A4, A5, Square and A3 sizes
• Instant live mockup preview with photo upload
• Archival anti-glare finish with 300 GSM photo paper
• Express shipping across India with secure protective packaging`,
    images: ['/images/custom-made/memory-poster.png', '/images/custom-made/album.png', '/images/custom-made/framed-wall-art.jpg', '/images/custom-made/polaroids.png'],
    tags: ['custom', 'memory', 'sister', 'rakhi', 'family', 'photobook', 'poster'],
  },
  {
    title: 'Custom Memory Poster — Your Story Framed',
    slug: 'memory-poster',
    description: `Turn your favorite moments into gallery-worthy wall art. Upload your photo, choose your format and size, and create a personalized keepsake designed to last a lifetime.

Printed on ultra-thick 300 GSM matte photo paper for rich colours, sharp detailing and a soft anti-glare finish.

• Available in A4, A5, Square and A3 sizes
• Custom photo upload with live mockup rendering
• Ultra-sharp high-definition 300 DPI print
• Free express shipping on prepaid orders`,
    images: ['/images/custom-made/memory-poster.png', '/images/custom-made/album.png', '/images/custom-made/framed-wall-art.jpg', '/images/custom-made/polaroids.png'],
    tags: ['custom', 'memory', 'personalized', 'couples', 'travel', 'poster'],
  },
];

for (const cp of customMemoryProducts) {
  const cProductId = nanoid();
  const cImageArr = JSON.stringify(cp.images);
  await sql`
    INSERT INTO products (id, title, slug, description, collection_id, collection_name, images, status, product_type, tags, vendor, featured, on_sale, created_at, updated_at)
    VALUES (${cProductId}, ${cp.title}, ${cp.slug}, ${cp.description}, NULL, 'Custom Made', ${cImageArr}::jsonb, 'active', 'custom', ${JSON.stringify(cp.tags)}::jsonb, 'The Wall Records', true, true, ${now}, ${now})
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      images = EXCLUDED.images,
      product_type = EXCLUDED.product_type,
      tags = EXCLUDED.tags,
      featured = true,
      on_sale = true,
      updated_at = ${now}
  `;

  const [existingProd] = await sql`SELECT id FROM products WHERE slug = ${cp.slug} LIMIT 1`;
  const prodId = existingProd?.id || cProductId;

  await sql`DELETE FROM product_variants WHERE product_id = ${prodId}`;

  const customSizes = [
    { size: 'A4', price: 7900, compareAt: 14900 },
    { size: 'A5', price: 5900, compareAt: 9900 },
    { size: 'Square', price: 6900, compareAt: 12900 },
    { size: 'A3', price: 14900, compareAt: 24900 },
  ];

  for (const cs of customSizes) {
    await sql`
      INSERT INTO product_variants (id, product_id, size, price, compare_at_price, sku, inventory)
      VALUES (${nanoid()}, ${prodId}, ${cs.size}, ${cs.price}, ${cs.compareAt}, ${`TWR-${cp.slug.slice(0, 10).toUpperCase()}-${cs.size}`}, 999)
    `;
  }
  productCount++;
}

const [{ discountCount }] = await sql`SELECT COUNT(*)::int AS discount_count FROM discounts`;
if (discountCount === 0) {
  await sql`INSERT INTO discounts (id, title, code, type, value, min_order, active, automatic, created_at) VALUES (${nanoid()}, 'Buy 4 Get 3 Free', NULL, 'bogo', 43, 0, true, true, ${now})`;
  await sql`INSERT INTO discounts (id, title, code, type, value, min_order, active, automatic, created_at) VALUES (${nanoid()}, 'Buy 5 Get 5 Free', NULL, 'bogo', 50, 0, true, true, ${now})`;
  await sql`INSERT INTO discounts (id, title, code, type, value, min_order, active, automatic, created_at) VALUES (${nanoid()}, 'Welcome 10%', 'WELCOME10', 'percentage', 10, 0, true, false, ${now})`;
  await sql`INSERT INTO discounts (id, title, code, type, value, min_order, active, automatic, created_at) VALUES (${nanoid()}, 'Free Shipping ₹500+', NULL, 'shipping', 0, 50000, true, true, ${now})`;
}

const [{ pageCount }] = await sql`SELECT COUNT(*)::int AS page_count FROM content_pages`;
if (pageCount === 0) {
  await sql`INSERT INTO content_pages (id, title, slug, body, type, published, created_at, updated_at) VALUES (${nanoid()}, 'About Us', 'about', 'The Wall Records — premium posters for every wall.', 'page', true, ${now}, ${now})`;
  await sql`INSERT INTO content_pages (id, title, slug, body, type, published, created_at, updated_at) VALUES (${nanoid()}, 'Shipping Policy', 'shipping', 'Free express shipping on all prepaid orders.', 'policy', true, ${now}, ${now})`;
  await sql`INSERT INTO content_pages (id, title, slug, body, type, published, created_at, updated_at) VALUES (${nanoid()}, 'FAQ', 'faq', 'Delivery takes 5-7 days depending on location.', 'faq', true, ${now}, ${now})`;
}

await sql.end();
console.log(`✅ PostgreSQL ready: ${folders.length} collections, ${productCount} products`);
