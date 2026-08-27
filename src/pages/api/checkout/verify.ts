import type { APIRoute } from 'astro';
import { verifyAndCompletePayment } from '../../../lib/orders';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      await request.json();

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Missing payment details' }), { status: 400 });
    }

    const verified = await verifyAndCompletePayment(
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );

    if (!verified) {
      return new Response(JSON.stringify({ error: 'Payment verification failed' }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true, orderId }));
  } catch {
    return new Response(JSON.stringify({ error: 'Verification failed' }), { status: 500 });
  }
};
