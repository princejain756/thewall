import type { APIRoute } from 'astro';
import { registerCustomer, customerSessionCookieHeader } from '../../../lib/customer-auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { name, email, phone, password } = await request.json();
    const result = await registerCustomer({ name, email, phone, password });
    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error }), { status: 400 });
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Set-Cookie': customerSessionCookieHeader(result.token) },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }
};
