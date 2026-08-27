import type { APIRoute } from 'astro';
import { requireCustomer, getCustomerFromSession } from '../../../lib/customer-auth';
import { getCustomerDashboard } from '../../../lib/customer-account';

export const GET: APIRoute = async ({ request }) => {
  const { authorized, token } = await requireCustomer(request);
  if (!authorized || !token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const customer = await getCustomerFromSession(token);
  if (!customer) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const dashboard = await getCustomerDashboard(customer.id, customer.email);
  return new Response(JSON.stringify({ customer, ...dashboard }));
};
