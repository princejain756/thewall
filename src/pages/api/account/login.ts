import type { APIRoute } from 'astro';
import { loginCustomer, customerSessionCookieHeader } from '../../../lib/customer-auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, password } = await request.json();
    const result = await loginCustomer(email, password);
    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error }), { status: 401 });
    }
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Set-Cookie': customerSessionCookieHeader(result.token) },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }
};
