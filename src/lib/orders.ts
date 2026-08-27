import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { getDb } from './db';
import { orders, orderItems, customers } from './db/schema';
import {
  type CartItem,
  type CheckoutCustomer,
  type ShippingAddress,
  calculateCartTotals,
  isRazorpayConfigured,
} from './checkout';

export type CreateOrderInput = {
  items: CartItem[];
  customer: CheckoutCustomer;
  address: ShippingAddress;
  paymentMethod: 'prepaid' | 'cod';
  notes?: string;
};

export type CreateOrderResult = {
  orderId: string;
  orderNumber: string;
  totals: ReturnType<typeof calculateCartTotals>;
  razorpayOrderId?: string;
  razorpayKeyId?: string;
  amount: number;
};

export async function createStoreOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
  const db = getDb();
  const totals = calculateCartTotals(input.items, input.paymentMethod);
  const now = new Date().toISOString();
  const orderId = nanoid();

  const orderCount = await db.select().from(orders);
  const orderNumber = `#TWR${2000 + orderCount.length}`;

  let customerId: string | null = null;
  const [existing] = await db
    .select()
    .from(customers)
    .where(eq(customers.email, input.customer.email.toLowerCase()))
    .limit(1);

  if (existing) {
    customerId = existing.id;
    await db.update(customers).set({
      name: input.customer.name,
      phone: input.customer.phone,
      ordersCount: (existing.ordersCount ?? 0) + 1,
      totalSpent: (existing.totalSpent ?? 0) + totals.total,
    }).where(eq(customers.id, existing.id));
  } else {
    customerId = nanoid();
    await db.insert(customers).values({
      id: customerId,
      name: input.customer.name,
      email: input.customer.email.toLowerCase(),
      phone: input.customer.phone,
      ordersCount: 1,
      totalSpent: totals.total,
      createdAt: now,
    });
  }

  await db.insert(orders).values({
    id: orderId,
    orderNumber,
    customerId,
    customerName: input.customer.name,
    customerEmail: input.customer.email.toLowerCase(),
    customerPhone: input.customer.phone,
    status: 'pending',
    paymentStatus: input.paymentMethod === 'cod' ? 'pending' : 'pending',
    fulfillmentStatus: 'unfulfilled',
    subtotal: totals.subtotal,
    discount: totals.discount,
    shipping: totals.shipping,
    total: totals.total,
    notes: input.notes || null,
    shippingAddress: JSON.stringify(input.address),
    createdAt: now,
    updatedAt: now,
  });

  for (const item of input.items) {
    const customDetails = (item.format || item.color || item.customText || item.customImage) ? {
      format: item.format,
      color: item.color,
      customText: item.customText,
      previewUrl: item.image,
    } : null;

    await db.insert(orderItems).values({
      id: nanoid(),
      orderId,
      productId: item.productId,
      variantId: item.variantId,
      title: item.title,
      size: item.size,
      quantity: item.quantity,
      price: item.price,
      customImage: item.customImage || null,
      customDetails,
    });
  }

  let razorpayOrderId: string | undefined;
  let razorpayKeyId: string | undefined;

  if (input.paymentMethod === 'prepaid' && isRazorpayConfigured()) {
    const Razorpay = (await import('razorpay')).default;
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const rzpOrder = await rzp.orders.create({
      amount: totals.total,
      currency: 'INR',
      receipt: orderNumber.replace('#', ''),
      notes: { orderId, orderNumber },
    });

    razorpayOrderId = rzpOrder.id;
    razorpayKeyId = process.env.RAZORPAY_KEY_ID!;
  }

  return {
    orderId,
    orderNumber,
    totals,
    razorpayOrderId,
    razorpayKeyId,
    amount: totals.total,
  };
}

export async function verifyAndCompletePayment(
  orderId: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
): Promise<boolean> {
  if (!isRazorpayConfigured()) return false;

  const crypto = await import('node:crypto');
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');

  if (expected !== razorpaySignature) return false;

  const db = getDb();
  await db.update(orders).set({
    paymentStatus: 'paid',
    status: 'processing',
    updatedAt: new Date().toISOString(),
  }).where(eq(orders.id, orderId));

  return true;
}

export async function getOrderByIdPublic(orderId: string) {
  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return null;
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  return { ...order, items };
}
