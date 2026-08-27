import type { APIRoute } from 'astro';
import { requireAdmin, destroySession, clearSessionCookieHeader } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  const { authorized, token } = await requireAdmin(request);
  if (authorized && token) await destroySession(token);
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Set-Cookie': clearSessionCookieHeader() },
  });
};

export const GET: APIRoute = async ({ request }) => {
  const { authorized } = await requireAdmin(request);
  return new Response(JSON.stringify({ authenticated: authorized }));
};
