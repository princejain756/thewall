import type { APIRoute } from 'astro';
import { requireCustomer, getCustomerFromSession } from '../../../lib/customer-auth';
import { updateCustomerProfile } from '../../../lib/customer-account';

export const POST: APIRoute = async ({ request }) => {
  const { authorized, customerId, token } = await requireCustomer(request);
  if (!authorized || !customerId || !token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  try {
    const { name, phone } = await request.json();
    await updateCustomerProfile(customerId, { name, phone });
    const customer = await getCustomerFromSession(token);
    return new Response(JSON.stringify({ success: true, customer }));
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }
};
