import type { APIRoute } from 'astro';
import {
  requireCustomer,
  getCustomerFromSession,
  destroyCustomerSession,
  clearCustomerSessionCookieHeader,
} from '../../../lib/customer-auth';

export const GET: APIRoute = async ({ request }) => {
  const { authorized, token } = await requireCustomer(request);
  if (!authorized || !token) {
    return new Response(JSON.stringify({ authenticated: false }));
  }
  const customer = await getCustomerFromSession(token);
  return new Response(JSON.stringify({ authenticated: true, customer }));
};

export const POST: APIRoute = async ({ request }) => {
  const { token } = await requireCustomer(request);
  if (token) await destroyCustomerSession(token);
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Set-Cookie': clearCustomerSessionCookieHeader() },
  });
};
