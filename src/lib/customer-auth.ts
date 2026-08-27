import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import { getDb } from './db';
import { customers, customerAccounts, customerSessions } from './db/schema';
import { parseCookies } from './auth';

const SESSION_COOKIE = 'tw_customer_session';
const SESSION_DAYS = 30;

export type CustomerProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  ordersCount: number;
  totalSpent: number;
  createdAt: string;
};

export function getCustomerSessionCookie(): string {
  return SESSION_COOKIE;
}

export function customerSessionCookieHeader(token: string): string {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearCustomerSessionCookieHeader(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export async function registerCustomer(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const phone = input.phone?.trim() || null;

  if (!name || !email || !input.password) {
    return { ok: false, error: 'Name, email, and password are required.' };
  }
  if (input.password.length < 6) {
    return { ok: false, error: 'Password must be at least 6 characters.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }

  const db = getDb();
  const now = new Date().toISOString();

  const [existingAccount] = await db
    .select({ id: customerAccounts.id })
    .from(customerAccounts)
    .innerJoin(customers, eq(customers.id, customerAccounts.customerId))
    .where(eq(customers.email, email))
    .limit(1);

  if (existingAccount) {
    return { ok: false, error: 'An account with this email already exists. Please sign in.' };
  }

  let customerId: string;
  const [existingCustomer] = await db
    .select()
    .from(customers)
    .where(eq(customers.email, email))
    .limit(1);

  if (existingCustomer) {
    customerId = existingCustomer.id;
    await db.update(customers).set({ name, phone }).where(eq(customers.id, customerId));
  } else {
    customerId = nanoid();
    await db.insert(customers).values({
      id: customerId,
      name,
      email,
      phone,
      ordersCount: 0,
      totalSpent: 0,
      createdAt: now,
    });
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  await db.insert(customerAccounts).values({
    id: nanoid(),
    customerId,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  const token = await createCustomerSession(customerId);
  return { ok: true, token };
}

export async function loginCustomer(
  email: string,
  password: string,
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  let normalized = email.trim().toLowerCase();
  if (normalized === 'demo') normalized = 'demo@2thewall.in';
  if (!normalized || !password) {
    return { ok: false, error: 'Email and password are required.' };
  }

  const db = getDb();
  const [row] = await db
    .select({
      customerId: customers.id,
      passwordHash: customerAccounts.passwordHash,
    })
    .from(customers)
    .innerJoin(customerAccounts, eq(customerAccounts.customerId, customers.id))
    .where(eq(customers.email, normalized))
    .limit(1);

  if (!row) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  const valid = await bcrypt.compare(password, row.passwordHash);
  if (!valid) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  const token = await createCustomerSession(row.customerId);
  return { ok: true, token };
}

async function createCustomerSession(customerId: string): Promise<string> {
  const db = getDb();
  const token = nanoid(48);
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(customerSessions).values({
    id: nanoid(),
    customerId,
    token,
    expiresAt: expires.toISOString(),
    createdAt: now.toISOString(),
  });

  return token;
}

export async function validateCustomerSession(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const db = getDb();
  const [session] = await db
    .select()
    .from(customerSessions)
    .where(eq(customerSessions.token, token))
    .limit(1);

  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    await db.delete(customerSessions).where(eq(customerSessions.token, token));
    return null;
  }
  return session.customerId;
}

export async function destroyCustomerSession(token: string) {
  const db = getDb();
  await db.delete(customerSessions).where(eq(customerSessions.token, token));
}

export async function getCustomerFromSession(token: string | undefined): Promise<CustomerProfile | null> {
  const customerId = await validateCustomerSession(token);
  if (!customerId) return null;

  const db = getDb();
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  if (!customer) return null;

  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    ordersCount: customer.ordersCount ?? 0,
    totalSpent: customer.totalSpent ?? 0,
    createdAt: customer.createdAt,
  };
}

export async function requireCustomer(request: Request): Promise<{
  authorized: boolean;
  customerId?: string;
  token?: string;
}> {
  const cookies = parseCookies(request.headers.get('cookie'));
  const token = cookies[SESSION_COOKIE];
  const customerId = await validateCustomerSession(token);
  return { authorized: !!customerId, customerId: customerId ?? undefined, token };
}
