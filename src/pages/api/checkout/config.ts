import type { APIRoute } from 'astro';
import { isRazorpayConfigured, getRazorpayKeyId } from '../../../lib/checkout';

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      razorpayEnabled: isRazorpayConfigured(),
      razorpayKeyId: getRazorpayKeyId(),
      codEnabled: true,
      currency: 'INR',
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
};
