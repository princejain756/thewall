import { eq, desc, sql, count, gte, or, like, and } from 'drizzle-orm';
import { getDb } from './db';
import { orders, orderItems, customers, products, discounts } from './db/schema';

function lastNDates(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

export async function getDashboardStats() {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const weekStart = lastNDates(7)[0];

  const todayOrders = await db
    .select()
    .from(orders)
    .where(sql`${orders.createdAt}::date = ${today}::date`);

  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);

  const weekOrders = await db
    .select()
    .from(orders)
    .where(gte(orders.createdAt, `${weekStart}T00:00:00.000Z`));

  const [pendingOrders] = await db
    .select({ count: count() })
    .from(orders)
    .where(eq(orders.fulfillmentStatus, 'unfulfilled'));

  const [totalProducts] = await db.select({ count: count() }).from(products);
  const [totalCustomers] = await db.select({ count: count() }).from(customers);
  const [activeDiscounts] = await db
    .select({ count: count() })
    .from(discounts)
    .where(eq(discounts.active, true));

  const recentOrders = await db
    .select()
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(10);

  const chartData = lastNDates(7).map((date) => {
    const dayOrders = weekOrders.filter((o) => o.createdAt.slice(0, 10) === date);
    return {
      date,
      sessions: 0,
      pageViews: 0,
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
    };
  });

  return {
    today: {
      orders: todayOrders.length,
      revenue: todayRevenue,
      sessions: 0,
      conversionRate: '0',
    },
    totals: {
      products: totalProducts?.count ?? 0,
      customers: totalCustomers?.count ?? 0,
      pendingFulfillment: pendingOrders?.count ?? 0,
      activeDiscounts: activeDiscounts?.count ?? 0,
    },
    recentOrders,
    chartData,
  };
}

export async function listOrders(opts: { status?: string; search?: string; limit?: number } = {}) {
  const db = getDb();
  const conditions = [];

  if (opts.status) conditions.push(eq(orders.status, opts.status));
  if (opts.search?.trim()) {
    const pattern = `%${opts.search.trim()}%`;
    conditions.push(
      or(
        like(orders.orderNumber, pattern),
        like(orders.customerName, pattern),
        like(orders.customerEmail, pattern),
        like(orders.customerPhone, pattern),
      ),
    );
  }

  return db
    .select()
    .from(orders)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(orders.createdAt))
    .limit(opts.limit ?? 50);
}

export async function listCustomersSearch(search?: string) {
  const db = getDb();
  if (!search?.trim()) {
    return db.select().from(customers).orderBy(desc(customers.createdAt));
  }

  const pattern = `%${search.trim()}%`;
  return db
    .select()
    .from(customers)
    .where(or(like(customers.name, pattern), like(customers.email, pattern), like(customers.phone, pattern)))
    .orderBy(desc(customers.createdAt));
}

export async function adminSearch(query: string) {
  const q = query.trim();
  if (!q) {
    return { products: [], orders: [], customers: [], discounts: [] };
  }

  const db = getDb();
  const pattern = `%${q}%`;

  const [productResults, orderResults, customerResults, discountResults] = await Promise.all([
    db
      .select({
        id: products.id,
        title: products.title,
        slug: products.slug,
        collectionName: products.collectionName,
        status: products.status,
      })
      .from(products)
      .where(or(like(products.title, pattern), like(products.slug, pattern), like(products.collectionName, pattern)))
      .orderBy(desc(products.createdAt))
      .limit(6),
    db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        customerName: orders.customerName,
        total: orders.total,
        fulfillmentStatus: orders.fulfillmentStatus,
      })
      .from(orders)
      .where(or(like(orders.orderNumber, pattern), like(orders.customerName, pattern), like(orders.customerEmail, pattern)))
      .orderBy(desc(orders.createdAt))
      .limit(6),
    db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        ordersCount: customers.ordersCount,
      })
      .from(customers)
      .where(or(like(customers.name, pattern), like(customers.email, pattern), like(customers.phone, pattern)))
      .orderBy(desc(customers.createdAt))
      .limit(6),
    db
      .select({
        id: discounts.id,
        title: discounts.title,
        code: discounts.code,
        type: discounts.type,
        active: discounts.active,
      })
      .from(discounts)
      .where(or(like(discounts.title, pattern), like(discounts.code, pattern)))
      .orderBy(desc(discounts.createdAt))
      .limit(4),
  ]);

  return {
    products: productResults,
    orders: orderResults,
    customers: customerResults,
    discounts: discountResults,
  };
}

export async function getOrderById(id: string) {
  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
  return { ...order, items };
}

export async function listCustomers() {
  const db = getDb();
  return db.select().from(customers).orderBy(desc(customers.createdAt));
}

export async function listDiscounts() {
  const db = getDb();
  return db.select().from(discounts).orderBy(desc(discounts.createdAt));
}
