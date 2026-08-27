import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { getDb } from './db';
import { adminSessions } from './db/schema';

const SESSION_COOKIE = 'tw_admin_session';
const SESSION_DAYS = 7;

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || 'admin123';
}

export async function verifyPassword(password: string): Promise<boolean> {
  const adminPass = getAdminPassword();
  if (adminPass.startsWith('$2')) {
    return bcrypt.compare(password, adminPass);
  }
  return password === adminPass;
}

export async function createSession(): Promise<string> {
  const db = getDb();
  const token = nanoid(48);
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(adminSessions).values({
    id: nanoid(),
    token,
    expiresAt: expires.toISOString(),
    createdAt: now.toISOString(),
  });

  return token;
}

export async function validateSession(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const db = getDb();
  const [session] = await db
    .select()
    .from(adminSessions)
    .where(eq(adminSessions.token, token))
    .limit(1);

  if (!session) return false;
  if (new Date(session.expiresAt) < new Date()) {
    await db.delete(adminSessions).where(eq(adminSessions.token, token));
    return false;
  }
  return true;
}

export async function destroySession(token: string) {
  const db = getDb();
  await db.delete(adminSessions).where(eq(adminSessions.token, token));
}

export function getSessionCookie(): string {
  return SESSION_COOKIE;
}

export function sessionCookieHeader(token: string): string {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...rest] = c.trim().split('=');
      return [key, rest.join('=')];
    }),
  );
}

export async function requireAdmin(request: Request): Promise<{ authorized: boolean; token?: string }> {
  const cookies = parseCookies(request.headers.get('cookie'));
  const token = cookies[SESSION_COOKIE];
  return { authorized: await validateSession(token), token };
}
