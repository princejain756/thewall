import { pgTable, text, integer, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const collections = pgTable('collections', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  image: text('image'),
  parentId: text('parent_id'),
  productCount: integer('product_count').default(0),
  createdAt: text('created_at').notNull(),
}, (t) => [uniqueIndex('collections_slug_idx').on(t.slug)]);

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  collectionId: text('collection_id').references(() => collections.id),
  collectionName: text('collection_name'),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  status: text('status').notNull().default('active'),
  productType: text('product_type').notNull().default('single'),
  tags: jsonb('tags').$type<string[]>().default([]),
  vendor: text('vendor').default('The Wall Records'),
  featured: boolean('featured').default(false),
  onSale: boolean('on_sale').default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (t) => [
  uniqueIndex('products_slug_idx').on(t.slug),
  index('idx_products_collection').on(t.collectionId),
  index('idx_products_status').on(t.status),
]);

export const productVariants = pgTable('product_variants', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  size: text('size').notNull(),
  price: integer('price').notNull(),
  compareAtPrice: integer('compare_at_price'),
  sku: text('sku'),
  inventory: integer('inventory').default(999),
});

export const customers = pgTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  source: text('source'),
  notes: text('notes'),
  tags: jsonb('tags').$type<string[]>().default([]),
  ordersCount: integer('orders_count').default(0),
  totalSpent: integer('total_spent').default(0),
  createdAt: text('created_at').notNull(),
}, (t) => [uniqueIndex('customers_email_idx').on(t.email)]);

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  orderNumber: text('order_number').notNull(),
  customerId: text('customer_id').references(() => customers.id),
  customerName: text('customer_name'),
  customerEmail: text('customer_email'),
  customerPhone: text('customer_phone'),
  status: text('status').notNull().default('pending'),
  paymentStatus: text('payment_status').notNull().default('pending'),
  fulfillmentStatus: text('fulfillment_status').notNull().default('unfulfilled'),
  subtotal: integer('subtotal').notNull(),
  discount: integer('discount').default(0),
  shipping: integer('shipping').default(0),
  total: integer('total').notNull(),
  notes: text('notes'),
  shippingAddress: text('shipping_address'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (t) => [
  uniqueIndex('orders_number_idx').on(t.orderNumber),
  index('idx_orders_status').on(t.status),
  index('idx_orders_created').on(t.createdAt),
]);

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id'),
  variantId: text('variant_id'),
  title: text('title').notNull(),
  size: text('size'),
  quantity: integer('quantity').notNull(),
  price: integer('price').notNull(),
  customImage: text('custom_image'),
  customDetails: jsonb('custom_details').$type<{
    format?: string;
    color?: string;
    customText?: string;
    previewUrl?: string;
  }>(),
});

export const discounts = pgTable('discounts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  code: text('code'),
  type: text('type').notNull().default('percentage'),
  value: integer('value').notNull(),
  minOrder: integer('min_order').default(0),
  usageLimit: integer('usage_limit'),
  usedCount: integer('used_count').default(0),
  active: boolean('active').default(true),
  automatic: boolean('automatic').default(false),
  startsAt: text('starts_at'),
  endsAt: text('ends_at'),
  createdAt: text('created_at').notNull(),
}, (t) => [uniqueIndex('discounts_code_idx').on(t.code)]);

export const contentPages = pgTable('content_pages', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  body: text('body'),
  type: text('type').notNull().default('page'),
  published: boolean('published').default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (t) => [uniqueIndex('content_pages_slug_idx').on(t.slug)]);

export const customerAccounts = pgTable('customer_accounts', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
}, (t) => [uniqueIndex('customer_accounts_customer_idx').on(t.customerId)]);

export const customerSessions = pgTable('customer_sessions', {
  id: text('id').primaryKey(),
  customerId: text('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
}, (t) => [uniqueIndex('customer_sessions_token_idx').on(t.token)]);

export const adminSessions = pgTable('admin_sessions', {
  id: text('id').primaryKey(),
  token: text('token').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
}, (t) => [uniqueIndex('admin_sessions_token_idx').on(t.token)]);

export const analyticsDaily = pgTable('analytics_daily', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  sessions: integer('sessions').default(0),
  pageViews: integer('page_views').default(0),
  orders: integer('orders').default(0),
  revenue: integer('revenue').default(0),
}, (t) => [uniqueIndex('analytics_daily_date_idx').on(t.date)]);

export type Product = typeof products.$inferSelect;
export type ProductVariant = typeof productVariants.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Discount = typeof discounts.$inferSelect;
