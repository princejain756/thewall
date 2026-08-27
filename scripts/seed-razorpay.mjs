#!/usr/bin/env node
/**
 * Seeds Razorpay verification assets: demo account + policy page stubs in DB.
 * Run: node scripts/seed-razorpay.mjs
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL required');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);
const now = new Date().toISOString();
const DEMO_EMAIL = 'demo@2thewall.in';
const DEMO_PASSWORD = 'demo';

const PAGES = [
  { title: 'About Us', slug: 'about', type: 'page', body: 'The Wall Records — premium posters and custom memory prints. Visit https://2thewall.in' },
  { title: 'Privacy Policy', slug: 'privacy', type: 'policy', body: 'See https://2thewall.in/policies/privacy' },
  { title: 'Terms & Conditions', slug: 'terms', type: 'policy', body: 'See https://2thewall.in/policies/terms' },
  { title: 'Refund & Cancellation Policy', slug: 'refund', type: 'policy', body: 'See https://2thewall.in/policies/refund' },
  { title: 'Shipping Policy', slug: 'shipping', type: 'policy', body: 'See https://2thewall.in/policies/shipping' },
  { title: 'FAQ', slug: 'faq', type: 'faq', body: 'See https://2thewall.in/policies/faq' },
];

for (const page of PAGES) {
  const [existing] = await sql`SELECT id FROM content_pages WHERE slug = ${page.slug}`;
  if (existing) {
    await sql`
      UPDATE content_pages
      SET title = ${page.title}, body = ${page.body}, type = ${page.type}, published = true, updated_at = ${now}
      WHERE slug = ${page.slug}
    `;
  } else {
    await sql`
      INSERT INTO content_pages (id, title, slug, body, type, published, created_at, updated_at)
      VALUES (${nanoid()}, ${page.title}, ${page.slug}, ${page.body}, ${page.type}, true, ${now}, ${now})
    `;
  }
}

const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
const [existingCustomer] = await sql`SELECT id FROM customers WHERE email = ${DEMO_EMAIL}`;

let customerId;
if (existingCustomer) {
  customerId = existingCustomer.id;
  await sql`
    UPDATE customers
    SET name = 'Demo User', phone = '+919876543210'
    WHERE id = ${customerId}
  `;
} else {
  customerId = nanoid();
  await sql`
    INSERT INTO customers (id, name, email, phone, orders_count, total_spent, created_at)
    VALUES (${customerId}, 'Demo User', ${DEMO_EMAIL}, '+919876543210', 0, 0, ${now})
  `;
}

const [existingAccount] = await sql`
  SELECT id FROM customer_accounts WHERE customer_id = ${customerId}
`;

if (existingAccount) {
  await sql`
    UPDATE customer_accounts
    SET password_hash = ${passwordHash}, updated_at = ${now}
    WHERE customer_id = ${customerId}
  `;
} else {
  await sql`
    INSERT INTO customer_accounts (id, customer_id, password_hash, created_at, updated_at)
    VALUES (${nanoid()}, ${customerId}, ${passwordHash}, ${now}, ${now})
  `;
}

await sql.end();
console.log('✅ Razorpay seed ready');
console.log(`   Demo login: ${DEMO_EMAIL} (or "demo") / ${DEMO_PASSWORD}`);
console.log('   Policy pages: /policies/privacy, /terms, /refund, /shipping, /faq');
