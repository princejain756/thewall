import type { APIRoute } from 'astro';
import { type CartItem, calculateCartTotals } from '../../../lib/checkout';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { items, paymentMethod } = await request.json();
    if (!items?.length) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), { status: 400 });
    }
    const totals = calculateCartTotals(items as CartItem[], paymentMethod || 'prepaid');
    return new Response(JSON.stringify(totals), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to calculate' }), { status: 500 });
  }
};
