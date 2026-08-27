import type { APIRoute } from 'astro';
import { verifyPassword, createSession, sessionCookieHeader } from '../../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { password } = await request.json();
    if (!password || !(await verifyPassword(password))) {
      return new Response(JSON.stringify({ error: 'Invalid password' }), { status: 401 });
    }
    const token = await createSession();
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': sessionCookieHeader(token),
      },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Login failed' }), { status: 500 });
  }
};
