import { desc, eq, or } from 'drizzle-orm';
import { getDb } from './db';
import { orders, orderItems, customers } from './db/schema';

export type OrderWithItems = Awaited<ReturnType<typeof getCustomerOrder>>;

export async function getCustomerOrders(customerId: string, customerEmail: string) {
  const db = getDb();
  const email = customerEmail.toLowerCase();

  return db
    .select()
    .from(orders)
    .where(or(eq(orders.customerId, customerId), eq(orders.customerEmail, email)))
    .orderBy(desc(orders.createdAt));
}

export async function getCustomerOrder(orderId: string, customerId: string, customerEmail: string) {
  const db = getDb();
  const email = customerEmail.toLowerCase();

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) return null;
  if (order.customerId !== customerId && order.customerEmail?.toLowerCase() !== email) {
    return null;
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  return { ...order, items };
}

export async function getCustomerDashboard(customerId: string, customerEmail: string) {
  const db = getDb();
  const allOrders = await getCustomerOrders(customerId, customerEmail);

  const totalSpent = allOrders.reduce((sum, o) => sum + o.total, 0);
  const paidOrders = allOrders.filter((o) => o.paymentStatus === 'paid' || o.status !== 'cancelled');
  const avgOrder = allOrders.length ? Math.round(totalSpent / allOrders.length) : 0;

  const monthlySpend: Record<string, number> = {};
  const sizeBreakdown: Record<string, number> = {};
  const statusBreakdown: Record<string, number> = {};

  for (const order of allOrders) {
    const month = order.createdAt.slice(0, 7);
    monthlySpend[month] = (monthlySpend[month] ?? 0) + order.total;
    statusBreakdown[order.status] = (statusBreakdown[order.status] ?? 0) + 1;

    const items = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));

    for (const item of items) {
      const size = item.size || 'Standard';
      sizeBreakdown[size] = (sizeBreakdown[size] ?? 0) + item.quantity;
    }
  }

  const monthlyChart = Object.entries(monthlySpend)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, amount]) => ({
      month,
      label: new Date(`${month}-01`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      amount,
    }));

  const maxMonth = Math.max(...monthlyChart.map((m) => m.amount), 1);

  return {
    stats: {
      totalOrders: allOrders.length,
      totalSpent,
      avgOrder,
      paidOrders: paidOrders.length,
      lastOrderDate: allOrders[0]?.createdAt ?? null,
    },
    monthlyChart: monthlyChart.map((m) => ({ ...m, pct: Math.round((m.amount / maxMonth) * 100) })),
    sizeBreakdown: Object.entries(sizeBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(([size, count]) => ({ size, count })),
    statusBreakdown: Object.entries(statusBreakdown).map(([status, count]) => ({ status, count })),
    recentOrders: allOrders.slice(0, 5),
  };
}

export async function updateCustomerProfile(
  customerId: string,
  data: { name?: string; phone?: string },
) {
  const db = getDb();
  const updates: Partial<typeof customers.$inferInsert> = {};
  if (data.name?.trim()) updates.name = data.name.trim();
  if (data.phone !== undefined) updates.phone = data.phone.trim() || null;
  if (!Object.keys(updates).length) return;

  await db.update(customers).set(updates).where(eq(customers.id, customerId));
}
