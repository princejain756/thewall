import type { APIRoute } from 'astro';
import { createStoreOrder } from '../../../lib/orders';
import type { CartItem } from '../../../lib/checkout';
import { requireCustomer } from '../../../lib/customer-auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const auth = await requireCustomer(request);
    if (!auth.authorized) {
      return new Response(JSON.stringify({ error: 'Please sign in to checkout' }), { status: 401 });
    }

    const body = await request.json();
    const { items, customer, address, paymentMethod, notes } = body;

    if (!items?.length) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), { status: 400 });
    }
    if (!customer?.name || !customer?.email || !customer?.phone) {
      return new Response(JSON.stringify({ error: 'Contact details required' }), { status: 400 });
    }
    if (!address?.line1 || !address?.city || !address?.state || !address?.pincode) {
      return new Response(JSON.stringify({ error: 'Shipping address required' }), { status: 400 });
    }

    const method = paymentMethod === 'cod' ? 'cod' : 'prepaid';
    const result = await createStoreOrder({
      items: items as CartItem[],
      customer,
      address,
      paymentMethod: method,
      notes,
    });

    if (method === 'prepaid' && !result.razorpayOrderId) {
      return new Response(
        JSON.stringify({
          ...result,
          paymentPending: true,
          message: 'Online payment not configured yet. Order saved — pay via COD or contact support.',
        }),
        { status: 201 },
      );
    }

    return new Response(JSON.stringify(result), { status: 201 });
  } catch (err) {
    console.error('Create order error:', err);
    return new Response(JSON.stringify({ error: 'Failed to create order' }), { status: 500 });
  }
};
