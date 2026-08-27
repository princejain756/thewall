import type { APIRoute } from 'astro';
import { requireCustomer, getCustomerFromSession } from '../../../../../lib/customer-auth';
import { getCustomerOrder } from '../../../../../lib/customer-account';
import { renderInvoiceHtml } from '../../../../../lib/invoice';

export const GET: APIRoute = async ({ request, params }) => {
  const { authorized, token } = await requireCustomer(request);
  if (!authorized || !token) {
    return new Response('Unauthorized', { status: 401 });
  }
  const customer = await getCustomerFromSession(token);
  if (!customer) return new Response('Unauthorized', { status: 401 });

  const orderId = params.id;
  if (!orderId) return new Response('Not found', { status: 404 });

  const order = await getCustomerOrder(orderId, customer.id, customer.email);
  if (!order) return new Response('Not found', { status: 404 });

  const html = renderInvoiceHtml(order);
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="invoice-${order.orderNumber.replace('#', '')}.html"`,
    },
  });
};
