import type { APIRoute } from 'astro';
import { requireCustomer, getCustomerFromSession } from '../../../lib/customer-auth';
import { getCustomerOrders, getCustomerOrder } from '../../../lib/customer-account';

export const GET: APIRoute = async ({ request, url }) => {
  const { authorized, token } = await requireCustomer(request);
  if (!authorized || !token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  const customer = await getCustomerFromSession(token);
  if (!customer) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const orderId = url.searchParams.get('id');
  if (orderId) {
    const order = await getCustomerOrder(orderId, customer.id, customer.email);
    if (!order) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
    return new Response(JSON.stringify(order));
  }

  const orders = await getCustomerOrders(customer.id, customer.email);
  return new Response(JSON.stringify(orders));
};
