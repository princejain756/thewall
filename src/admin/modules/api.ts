// Shared API client for the admin panel.
// Centralises fetch calls, JSON parsing, error handling, and paise ↔ rupee conversion.

import type {
  Collection,
  Customer,
  DashboardStats,
  Discount,
  Order,
  Product,
  ProductType,
  SearchResults,
  Variant,
} from './types';

export function formatPrice(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

export function formatPriceCompact(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000) return `₹${(rupees / 1000).toFixed(1)}k`;
  return `₹${rupees.toFixed(0)}`;
}

export function formatRelative(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

export function normalizeImages(images: unknown): string[] {
  if (Array.isArray(images)) return images.filter(Boolean);
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
      return images ? [images] : [];
    }
  }
  return [];
}

export function productToForm(product: any) {
  return {
    ...product,
    images: normalizeImages(product.images),
    variants: (product.variants || []).map((v: any) => ({
      ...v,
      price: v.price / 100,
      compareAtPrice: v.compareAtPrice != null ? v.compareAtPrice / 100 : null,
    })),
  };
}

export function formToPayload(form: any) {
  return {
    ...form,
    images: normalizeImages(form.images),
    variants: (form.variants || []).map((v: any) => ({
      ...v,
      price: Math.round(Number(v.price) * 100),
      compareAtPrice: v.compareAtPrice != null ? Math.round(Number(v.compareAtPrice) * 100) : null,
    })),
  };
}

async function request(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  if (res.status === 401) {
    window.location.reload();
    throw new Error('Session expired');
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {}
    throw new Error(msg);
  }
  return res;
}

// ─── Auth ───────────────────────────────────────────────
export async function checkSession(): Promise<boolean> {
  const res = await fetch('/api/admin/session');
  const data = await res.json();
  return !!data.authenticated;
}

export async function login(password: string): Promise<boolean> {
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return res.ok;
}

export async function logout(): Promise<void> {
  await fetch('/api/admin/session', { method: 'POST' });
}

// ─── Dashboard ──────────────────────────────────────────
export const fetchDashboard = () =>
  request('/api/admin/dashboard').then((r) => r.json() as Promise<DashboardStats>);

// ─── Products ───────────────────────────────────────────
export const fetchProducts = (params: { status?: string; search?: string } = {}) => {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.search) qs.set('search', params.search);
  return request(`/api/admin/products?${qs}`).then((r) => r.json() as Promise<Product[]>);
};

export const fetchProduct = (id: string) =>
  request(`/api/admin/products?id=${id}`).then((r) => r.json() as Promise<Product>);

export const saveProduct = (form: any) =>
  request('/api/admin/products', {
    method: form.id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formToPayload(form)),
  });

export const deleteProduct = (id: string) =>
  request(`/api/admin/products?id=${id}`, { method: 'DELETE' });

// ─── Orders ─────────────────────────────────────────────
export const fetchOrders = (params: { status?: string; search?: string } = {}) => {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.search) qs.set('search', params.search);
  return request(`/api/admin/orders?${qs}`).then((r) => r.json() as Promise<Order[]>);
};

export const fetchOrder = (id: string) =>
  request(`/api/admin/orders?id=${id}`).then((r) => r.json() as Promise<Order>);

export const updateOrder = (id: string, updates: Partial<Order>) =>
  request('/api/admin/orders', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
  });

// ─── Customers ──────────────────────────────────────────
export const fetchCustomers = () =>
  request('/api/admin/data?type=customers').then((r) => r.json() as Promise<Customer[]>);

export const saveCustomer = (customer: Partial<Customer> & { id: string }) =>
  request('/api/admin/data?type=customers', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer),
  });

// ─── Discounts ──────────────────────────────────────────
export const fetchDiscounts = () =>
  request('/api/admin/data?type=discounts').then((r) => r.json() as Promise<Discount[]>);

export const saveDiscount = (discount: Partial<Discount>) => {
  const method = discount.id ? 'PUT' : 'POST';
  return request('/api/admin/data?type=discounts', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(discount),
  });
};

// ─── Collections ────────────────────────────────────────
export const fetchCollections = () =>
  request('/api/admin/data?type=collections').then((r) => r.json() as Promise<Collection[]>);

// ─── Search ─────────────────────────────────────────────
export const search = (q: string) =>
  request(`/api/admin/search?q=${encodeURIComponent(q)}`).then((r) => r.json() as Promise<SearchResults>);

// ─── Uploads ────────────────────────────────────────────
export async function uploadFiles(files: File[]): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const body = new FormData();
    body.append('file', file);
    const res = await fetch('/api/admin/upload', { method: 'POST', body });
    if (res.status === 401) throw new Error('Session expired — please log in again');
    if (res.status === 403) throw new Error('Upload blocked by security check. Refresh and try again.');
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.url) throw new Error(data.error || `Upload failed (${res.status})`);
    urls.push(data.url);
  }
  return urls;
}
