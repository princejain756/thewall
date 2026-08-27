import { useState, useEffect, useCallback, useRef } from 'react';
import './admin.css';

type Page = 'dashboard' | 'orders' | 'products' | 'customers' | 'discounts' | 'content' | 'analytics';

const NAV_ITEMS: { id: Page; label: string; icon: string; section?: string }[] = [
  { id: 'dashboard', label: 'Home', icon: '🏠' },
  { id: 'orders', label: 'Orders', icon: '📦', section: 'Store' },
  { id: 'products', label: 'Products', icon: '🏷️' },
  { id: 'customers', label: 'Customers', icon: '👥' },
  { id: 'discounts', label: 'Discounts', icon: '🎫' },
  { id: 'content', label: 'Content', icon: '📄', section: 'Online Store' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
];

function formatPrice(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

function normalizeImages(images: unknown): string[] {
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

function productToForm(product: any) {
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

function formToPayload(form: any) {
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: 'success', delivered: 'success', fulfilled: 'success', active: 'success',
    pending: 'warning', processing: 'warning', unfulfilled: 'warning',
    cancelled: 'danger', draft: 'neutral',
  };
  return <span className={`admin-badge admin-badge--${map[status] || 'neutral'}`}>{status}</span>;
}

type SearchResults = {
  products: Array<{ id: string; title: string; slug: string; collectionName: string | null; status: string }>;
  orders: Array<{ id: string; orderNumber: string; customerName: string | null; total: number; fulfillmentStatus: string }>;
  customers: Array<{ id: string; name: string; email: string; ordersCount: number }>;
  discounts: Array<{ id: string; title: string; code: string | null; type: string; active: boolean }>;
};

type SearchNavigateTarget = {
  page: Page;
  query?: string;
  orderId?: string;
  productId?: string;
};

function AdminSearchBar({
  value,
  onChange,
  onNavigate,
  placeholder = 'Search products, orders, customers...',
  variant = 'topbar',
}: {
  value: string;
  onChange: (v: string) => void;
  onNavigate: (target: SearchNavigateTarget) => void;
  placeholder?: string;
  variant?: 'topbar' | 'hero';
}) {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const q = value.trim();
    if (!q) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      fetch(`/api/admin/search?q=${encodeURIComponent(q)}`)
        .then((r) => {
          if (!r.ok) throw new Error('search failed');
          return r.json();
        })
        .then((data) => {
          setResults(data);
          setOpen(true);
        })
        .catch(() => setResults({ products: [], orders: [], customers: [], discounts: [] }))
        .finally(() => setLoading(false));
    }, 200);

    return () => window.clearTimeout(timer);
  }, [value]);

  const totalResults = results
    ? results.products.length + results.orders.length + results.customers.length + results.discounts.length
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    setOpen(false);
    if (results?.orders.length) onNavigate({ page: 'orders', query: q });
    else if (results?.products.length) onNavigate({ page: 'products', query: q });
    else if (results?.customers.length) onNavigate({ page: 'customers', query: q });
    else if (results?.discounts.length) onNavigate({ page: 'discounts', query: q });
    else onNavigate({ page: 'products', query: q });
  };

  const rootClass = variant === 'hero' ? 'admin-search admin-search--hero' : 'admin-search';

  return (
    <div className={rootClass} ref={wrapRef}>
      <form onSubmit={handleSubmit}>
        {variant === 'topbar' && <span className="admin-search__icon">🔍</span>}
        <input
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(e) => { onChange(e.target.value); setOpen(true); }}
          onFocus={() => { if (value.trim()) setOpen(true); }}
          aria-label="Search admin"
          autoComplete="off"
        />
      </form>

      {open && value.trim() && (
        <div className="admin-search__dropdown">
          {loading && <p className="admin-search__hint">Searching...</p>}
          {!loading && totalResults === 0 && (
            <p className="admin-search__hint">No results for “{value.trim()}”</p>
          )}
          {!loading && results && totalResults > 0 && (
            <>
              {results.products.length > 0 && (
                <div className="admin-search__group">
                  <p className="admin-search__label">Products</p>
                  {results.products.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="admin-search__item"
                      onClick={() => { onNavigate({ page: 'products', query: p.title, productId: p.id }); setOpen(false); }}
                    >
                      <strong>{p.title}</strong>
                      <span>{p.collectionName || p.status}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.orders.length > 0 && (
                <div className="admin-search__group">
                  <p className="admin-search__label">Orders</p>
                  {results.orders.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className="admin-search__item"
                      onClick={() => { onNavigate({ page: 'orders', orderId: o.id }); setOpen(false); }}
                    >
                      <strong>{o.orderNumber}</strong>
                      <span>{o.customerName} · {formatPrice(o.total)}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.customers.length > 0 && (
                <div className="admin-search__group">
                  <p className="admin-search__label">Customers</p>
                  {results.customers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="admin-search__item"
                      onClick={() => { onNavigate({ page: 'customers', query: c.email }); setOpen(false); }}
                    >
                      <strong>{c.name}</strong>
                      <span>{c.email}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.discounts.length > 0 && (
                <div className="admin-search__group">
                  <p className="admin-search__label">Discounts</p>
                  {results.discounts.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className="admin-search__item"
                      onClick={() => { onNavigate({ page: 'discounts', query: d.title }); setOpen(false); }}
                    >
                      <strong>{d.title}</strong>
                      <span>{d.code || d.type}</span>
                    </button>
                  ))}
                </div>
              )}
              <button type="button" className="admin-search__view-all" onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}>
                Press Enter to view all matching products
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Login ───────────────────────────────────────────
function Login({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (res.ok) onLogin();
    else setError('Invalid password. Default: admin123');
    setLoading(false);
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__logo">TW</div>
        <h1>The Wall Admin</h1>
        <p>Sign in to manage your store</p>
        {error && <div className="admin-login__error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter admin password" autoFocus />
          </div>
          <button type="submit" className="admin-btn admin-btn--primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────
function Dashboard({ onNavigate, search, onSearchChange, onSearchNavigate }: {
  onNavigate: (p: Page) => void;
  search: string;
  onSearchChange: (v: string) => void;
  onSearchNavigate: (target: SearchNavigateTarget) => void;
}) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/dashboard').then((r) => r.json()).then(setStats);
  }, []);

  if (!stats) return <div className="admin-loading">Loading dashboard...</div>;

  const maxRevenue = Math.max(...(stats.chartData?.map((d: any) => d.revenue) || [0]), 1);
  const hasRevenue = (stats.chartData || []).some((d: any) => d.revenue > 0);

  return (
    <>
      <div className="admin-greeting">
        <h1>Hey there! Let's continue growing your business.</h1>
        <AdminSearchBar
          value={search}
          onChange={onSearchChange}
          onNavigate={onSearchNavigate}
          variant="hero"
          placeholder="Search products, orders, customers..."
        />
        <div className="admin-tasks">
          {stats.totals.pendingFulfillment > 0 && (
            <button className="admin-task-pill" onClick={() => onNavigate('orders')}>
              Process orders <strong>{stats.totals.pendingFulfillment}</strong>
            </button>
          )}
          <button className="admin-task-pill" onClick={() => onNavigate('products')}>
            Add new product
          </button>
          <button className="admin-task-pill" onClick={() => onNavigate('discounts')}>
            Create discount
          </button>
        </div>
      </div>

      <div className="admin-stats">
        <div className="admin-stat">
          <div className="admin-stat__label">Today's Sessions</div>
          <div className="admin-stat__value">{stats.today.sessions}</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat__label">Today's Sales</div>
          <div className="admin-stat__value">{formatPrice(stats.today.revenue)}</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat__label">Today's Orders</div>
          <div className="admin-stat__value">{stats.today.orders}</div>
        </div>
        <div className="admin-stat">
          <div className="admin-stat__label">Conversion Rate</div>
          <div className="admin-stat__value">{stats.today.conversionRate}%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="admin-card">
          <div className="admin-card__header">
            <span className="admin-card__title">Revenue (7 days)</span>
          </div>
          <div className="admin-chart">
            {hasRevenue ? (
              stats.chartData.map((d: any, i: number) => (
                <div key={i} className="admin-chart__bar" style={{ height: `${(d.revenue / maxRevenue) * 100}%` }} title={`${d.date}: ${formatPrice(d.revenue)}`} />
              ))
            ) : (
              <p className="admin-empty">No revenue data yet. Sales will appear here after your first orders.</p>
            )}
          </div>
        </div>
        <div className="admin-card">
          <div className="admin-card__header">
            <span className="admin-card__title">Recent Orders</span>
            <button className="admin-btn admin-btn--secondary" onClick={() => onNavigate('orders')}>View all</button>
          </div>
          <table className="admin-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {stats.recentOrders.length > 0 ? stats.recentOrders.slice(0, 5).map((o: any) => (
                <tr key={o.id}>
                  <td><strong>{o.orderNumber}</strong></td>
                  <td>{o.customerName}</td>
                  <td>{formatPrice(o.total)}</td>
                  <td><StatusBadge status={o.fulfillmentStatus} /></td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="admin-empty">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── Products ────────────────────────────────────────
function Products({ initialSearch = '', focusProductId }: { initialSearch?: string; focusProductId?: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => {
    setSearch(initialSearch);
    setEditing(null);
  }, [initialSearch, focusProductId]);

  useEffect(() => {
    if (!focusProductId) return;
    fetch(`/api/admin/products?id=${focusProductId}`)
      .then((r) => r.json())
      .then((product) => { if (product?.id) setEditing(product); });
  }, [focusProductId]);

  const load = useCallback(() => {
    const params = new URLSearchParams({ status: 'all' });
    if (search.trim()) params.set('search', search.trim());
    fetch(`/api/admin/products?${params}`).then((r) => r.json()).then(setProducts);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' });
    load();
  };

  if (editing) {
    return <ProductEditor product={editing} onSave={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />;
  }

  return (
    <>
      <div className="admin-page-header">
        <h1>Products ({products.length})</h1>
        <button className="admin-btn admin-btn--primary" onClick={() => setEditing({ title: '', slug: '', status: 'draft', images: [], variants: [{ size: 'A4', price: 79, compareAtPrice: 149 }] })}>Add product</button>
      </div>
      <div className="admin-card">
        <div className="admin-card__header">
          <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: '0.5rem', border: '1px solid #e1e1e1', borderRadius: '8px', width: '300px' }} />
        </div>
        <table className="admin-table">
          <thead><tr><th>Product</th><th>Collection</th><th>Status</th><th>Price</th><th>Actions</th></tr></thead>
          <tbody>
            {products.map((p) => {
              const imgs = Array.isArray(p.images) ? p.images : JSON.parse(p.images || '[]');
              return (
                <tr key={p.id}>
                  <td>
                    <div className="admin-table__product">
                      {imgs[0] && <img src={imgs[0]} alt="" className="admin-table__thumb" />}
                      <span>{p.title}</span>
                    </div>
                  </td>
                  <td>{p.collectionName}</td>
                  <td><StatusBadge status={p.status} /></td>
                  <td>{formatPrice(p.minPrice)}</td>
                  <td>
                    <button className="admin-btn admin-btn--secondary" onClick={() => setEditing(p)} style={{ marginRight: '0.5rem' }}>Edit</button>
                    <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(p.id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ProductEditor({ product, onSave, onCancel }: { product: any; onSave: () => void; onCancel: () => void }) {
  const [form, setForm] = useState(() => productToForm(product));
  const [collections, setCollections] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    fetch('/api/admin/data?type=collections')
      .then((r) => r.json())
      .then(setCollections)
      .catch(() => setCollections([]));
  }, []);

  const images: string[] = form.images || [];

  const handleCollectionChange = (collectionId: string) => {
    const col = collections.find((c) => c.id === collectionId);
    setForm({
      ...form,
      collectionId: collectionId || null,
      collectionName: col?.name || null,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const method = form.id ? 'PUT' : 'POST';
    await fetch('/api/admin/products', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formToPayload(form)) });
    setSaving(false);
    onSave();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    setUploadError('');
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append('file', file);
      try {
        const res = await fetch('/api/admin/upload', { method: 'POST', body });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.url) {
          newUrls.push(data.url);
        } else if (res.status === 401) {
          setUploadError('Session expired — please log in again');
          break;
        } else if (res.status === 403) {
          setUploadError('Upload blocked by security check. Refresh and try again.');
          break;
        } else {
          setUploadError(data.error || `Upload failed (${res.status})`);
          break;
        }
      } catch {
        setUploadError('Network error while uploading');
        break;
      }
    }

    if (newUrls.length) {
      setForm({ ...form, images: [...images, ...newUrls] });
    }

    setUploading(false);
    e.target.value = '';
  };

  const addImageUrl = () => {
    const url = imageUrl.trim();
    if (!url) return;
    setForm({ ...form, images: [...images, url] });
    setImageUrl('');
  };

  const removeImage = (index: number) => {
    setForm({ ...form, images: images.filter((_, i) => i !== index) });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setForm({ ...form, images: next });
  };

  return (
    <>
      <div className="admin-page-header">
        <h1>{form.id ? 'Edit Product' : 'New Product'}</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="admin-btn admin-btn--secondary" onClick={onCancel}>Cancel</button>
          <button className="admin-btn admin-btn--primary" onClick={handleSave} disabled={saving || uploading}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
      <div className="admin-grid-2">
        <div className="admin-card" style={{ padding: '1.25rem' }}>
          <div className="admin-form-group">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="admin-form-group">
            <label>Slug</label>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div className="admin-form-group">
            <label>Description</label>
            <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="admin-form-group">
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label>Collection / Category</label>
            <select value={form.collectionId || ''} onChange={(e) => handleCollectionChange(e.target.value)}>
              <option value="">Uncategorized</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="admin-form-group">
            <label>Product Type</label>
            <select value={form.productType || 'single'} onChange={(e) => setForm({ ...form, productType: e.target.value })}>
              <option value="single">Single Poster</option>
              <option value="bundle">Bundle / Set</option>
              <option value="custom">Custom / Memory</option>
            </select>
          </div>
          <div className="admin-form-group">
            <label>Tags (comma-separated)</label>
            <input
              value={(form.tags || []).join(', ')}
              onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) })}
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            <input type="checkbox" checked={form.onSale} onChange={(e) => setForm({ ...form, onSale: e.target.checked })} /> On Sale / Offer Pricing
          </label>
        </div>
        <div className="admin-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>Variants (Sizes & Pricing)</h3>
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            style={{ marginBottom: '0.75rem' }}
            onClick={() => setForm({ ...form, variants: [...(form.variants || []), { size: 'A4', price: 79, compareAtPrice: 149 }] })}
          >
            + Add size variant
          </button>
          {(form.variants || []).map((v: any, i: number) => (
            <div key={i} style={{ marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid #eee' }}>
              <div className="admin-grid-2">
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label>Size</label>
                  <select value={v.size} onChange={(e) => { const variants = [...form.variants]; variants[i] = { ...v, size: e.target.value }; setForm({ ...form, variants }); }}>
                    <option>A4</option><option>A5</option><option>Square</option><option>A3</option><option>13x19"</option>
                  </select>
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label>Sale Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={v.price}
                    onChange={(e) => {
                      const variants = [...form.variants];
                      variants[i] = { ...v, price: parseFloat(e.target.value) || 0 };
                      setForm({ ...form, variants });
                    }}
                  />
                </div>
              </div>
              <div className="admin-grid-2" style={{ marginTop: '0.5rem' }}>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label>Compare-at / Offer Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={v.compareAtPrice ?? ''}
                    placeholder="Original price for offers"
                    onChange={(e) => {
                      const variants = [...form.variants];
                      variants[i] = { ...v, compareAtPrice: e.target.value ? parseFloat(e.target.value) : null };
                      setForm({ ...form, variants });
                    }}
                  />
                </div>
                <div className="admin-form-group" style={{ marginBottom: 0 }}>
                  <label>Inventory</label>
                  <input
                    type="number"
                    min="0"
                    value={v.inventory ?? 999}
                    onChange={(e) => {
                      const variants = [...form.variants];
                      variants[i] = { ...v, inventory: parseInt(e.target.value, 10) || 0 };
                      setForm({ ...form, variants });
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card" style={{ padding: '1.25rem', marginTop: '1rem' }}>
        <div className="admin-card__header" style={{ marginBottom: '1rem', padding: 0 }}>
          <span className="admin-card__title">Product Images</span>
          <span className="admin-text-muted">{images.length} image{images.length === 1 ? '' : 's'} — first image is the main PDP photo</span>
        </div>

        {images.length > 0 && (
          <div className="admin-image-grid">
            {images.map((src, i) => (
              <div key={`${src}-${i}`} className="admin-image-item">
                <img src={src} alt="" />
                {i === 0 && <span className="admin-image-item__badge">Main</span>}
                <div className="admin-image-item__actions">
                  <button type="button" className="admin-btn admin-btn--secondary" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Move left">←</button>
                  <button type="button" className="admin-btn admin-btn--secondary" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} aria-label="Move right">→</button>
                  <button type="button" className="admin-btn admin-btn--danger" onClick={() => removeImage(i)} aria-label="Remove">×</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="admin-image-add">
          <label className="admin-btn admin-btn--secondary admin-image-add__upload">
            {uploading ? 'Uploading...' : 'Upload images'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={handleImageUpload} disabled={uploading} hidden />
          </label>
          <div className="admin-image-add__url">
            <input
              type="text"
              placeholder="Or paste image path / URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImageUrl(); } }}
            />
            <button type="button" className="admin-btn admin-btn--secondary" onClick={addImageUrl}>Add URL</button>
          </div>
        </div>
        {uploadError && <p className="admin-login__error" style={{ marginTop: '0.75rem' }}>{uploadError}</p>}
      </div>
    </>
  );
}

// ─── Orders ──────────────────────────────────────────
function Orders({ initialSearch = '', focusOrderId }: { initialSearch?: string; focusOrderId?: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    setSearch(initialSearch);
    setSelected(null);
  }, [initialSearch, focusOrderId]);

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    const q = params.toString() ? `?${params}` : '';
    fetch(`/api/admin/orders${q}`).then((r) => r.json()).then(setOrders);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!focusOrderId) return;
    fetch(`/api/admin/orders?id=${focusOrderId}`)
      .then((r) => r.json())
      .then((order) => { if (order?.id) setSelected(order); });
  }, [focusOrderId]);

  const updateOrder = async (id: string, updates: any) => {
    await fetch('/api/admin/orders', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) });
    const res = await fetch('/api/admin/orders');
    setOrders(await res.json());
    setSelected(null);
  };

  if (selected) {
    return (
      <>
        <div className="admin-page-header">
          <h1>Order {selected.orderNumber}</h1>
          <button className="admin-btn admin-btn--secondary" onClick={() => setSelected(null)}>Back</button>
        </div>
        <div className="admin-grid-2">
          <div className="admin-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Customer</h3>
            <p><strong>{selected.customerName}</strong></p>
            <p>{selected.customerEmail}</p>
            <p>{selected.customerPhone}</p>
          </div>
          <div className="admin-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Fulfillment</h3>
            <div className="admin-form-group">
              <label>Status</label>
              <select defaultValue={selected.status} id="order-status">
                <option value="pending">Pending</option><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option>
              </select>
            </div>
            <div className="admin-form-group">
              <label>Payment</label>
              <select defaultValue={selected.paymentStatus} id="payment-status">
                <option value="pending">Pending</option><option value="paid">Paid</option><option value="refunded">Refunded</option>
              </select>
            </div>
            <button className="admin-btn admin-btn--green" onClick={() => {
              updateOrder(selected.id, {
                status: (document.getElementById('order-status') as HTMLSelectElement).value,
                paymentStatus: (document.getElementById('payment-status') as HTMLSelectElement).value,
                fulfillmentStatus: 'fulfilled',
              });
            }}>Mark Fulfilled</button>
          </div>
        </div>
        <div className="admin-card" style={{ marginTop: '1rem' }}>
          <table className="admin-table">
            <thead><tr><th>Item</th><th>Size / Options</th><th>Qty</th><th>Price</th><th>Print / Custom Photo</th></tr></thead>
            <tbody>
              {(selected.items || []).map((item: any) => {
                const details = item.customDetails || {};
                const customImg = item.customImage || details.previewUrl;
                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        {customImg && (
                          <img src={customImg} alt="" style={{ width: '48px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} />
                        )}
                        <div>
                          <strong>{item.title}</strong>
                          {item.customImage && <span className="admin-badge admin-badge--success" style={{ display: 'inline-block', marginLeft: '0.5rem', fontSize: '0.65rem' }}>Customized</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div><strong>{item.size || 'Standard'}</strong></div>
                      {details.format && <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Format: {details.format}</div>}
                      {details.color && <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Color: {details.color}</div>}
                    </td>
                    <td>{item.quantity}</td>
                    <td>{formatPrice(item.price * item.quantity)}</td>
                    <td>
                      {item.customImage ? (
                        <a
                          href={item.customImage}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-btn admin-btn--primary"
                          style={{ fontSize: '0.72rem', padding: '0.35rem 0.65rem' }}
                        >
                          ⬇ Download High-Res Image
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>Standard Print</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ padding: '1rem 1.25rem', textAlign: 'right', fontWeight: 600 }}>Total: {formatPrice(selected.total)}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="admin-page-header"><h1>Orders ({orders.length})</h1></div>
      <div className="admin-card">
        <div className="admin-card__header">
          <input
            type="search"
            placeholder="Search orders by number, customer, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #e1e1e1', borderRadius: '8px', width: '320px' }}
          />
        </div>
        <table className="admin-table">
          <thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Payment</th><th>Fulfillment</th><th>Total</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ cursor: 'pointer' }} onClick={async () => {
                const res = await fetch(`/api/admin/orders?id=${o.id}`);
                setSelected(await res.json());
              }}>
                <td><strong>{o.orderNumber}</strong></td>
                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                <td>{o.customerName}</td>
                <td><StatusBadge status={o.paymentStatus} /></td>
                <td><StatusBadge status={o.fulfillmentStatus} /></td>
                <td>{formatPrice(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Customers ───────────────────────────────────────
function Customers({ initialSearch = '' }: { initialSearch?: string }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  const load = useCallback(() => {
    const q = search.trim();
    if (!q) {
      fetch('/api/admin/data?type=customers').then((r) => r.json()).then(setCustomers);
      return;
    }
    fetch(`/api/admin/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => setCustomers(data.customers || []));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const saveCustomer = async () => {
    if (!selected) return;
    setSaving(true);
    await fetch('/api/admin/data?type=customers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selected.id,
        name: selected.name,
        phone: selected.phone,
        source: selected.source,
        notes: selected.notes,
        tags: selected.tags || [],
      }),
    });
    setSaving(false);
    setSelected(null);
    load();
  };

  if (selected) {
    return (
      <>
        <div className="admin-page-header">
          <h1>{selected.name}</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="admin-btn admin-btn--secondary" onClick={() => setSelected(null)}>Back</button>
            <button className="admin-btn admin-btn--primary" onClick={saveCustomer} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
        <div className="admin-grid-2">
          <div className="admin-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Contact</h3>
            <div className="admin-form-group">
              <label>Name</label>
              <input value={selected.name || ''} onChange={(e) => setSelected({ ...selected, name: e.target.value })} />
            </div>
            <div className="admin-form-group">
              <label>Email</label>
              <input value={selected.email || ''} disabled />
            </div>
            <div className="admin-form-group">
              <label>Phone</label>
              <input value={selected.phone || ''} onChange={(e) => setSelected({ ...selected, phone: e.target.value })} />
            </div>
            <p style={{ fontSize: '0.85rem', color: '#616161' }}>
              {selected.ordersCount} orders · {formatPrice(selected.totalSpent)} spent · Joined {new Date(selected.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="admin-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Tracking</h3>
            <div className="admin-form-group">
              <label>Acquisition Source</label>
              <select value={selected.source || ''} onChange={(e) => setSelected({ ...selected, source: e.target.value })}>
                <option value="">Unknown</option>
                <option value="organic">Organic / Direct</option>
                <option value="instagram">Instagram</option>
                <option value="google">Google</option>
                <option value="referral">Referral</option>
                <option value="repeat">Repeat Customer</option>
              </select>
            </div>
            <div className="admin-form-group">
              <label>Tags (comma-separated)</label>
              <input
                value={(selected.tags || []).join(', ')}
                onChange={(e) => setSelected({ ...selected, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) })}
                placeholder="vip, wedding, bulk-order"
              />
            </div>
            <div className="admin-form-group">
              <label>Internal Notes</label>
              <textarea
                value={selected.notes || ''}
                onChange={(e) => setSelected({ ...selected, notes: e.target.value })}
                placeholder="Follow-up notes, preferences, special requests..."
                rows={5}
              />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="admin-page-header"><h1>Customers ({customers.length})</h1></div>
      <div className="admin-card">
        <div className="admin-card__header">
          <input
            type="search"
            placeholder="Search customers by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #e1e1e1', borderRadius: '8px', width: '320px' }}
          />
        </div>
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Source</th><th>Orders</th><th>Total Spent</th><th>Joined</th></tr></thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(c)}>
                <td><strong>{c.name}</strong></td>
                <td>{c.email}</td>
                <td>{c.phone || '—'}</td>
                <td>{c.source || '—'}</td>
                <td>{c.ordersCount}</td>
                <td>{formatPrice(c.totalSpent)}</td>
                <td>{new Date(c.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Discounts ───────────────────────────────────────
function Discounts({ initialSearch = '' }: { initialSearch?: string }) {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    fetch('/api/admin/data?type=discounts')
      .then((r) => r.json())
      .then((rows) => {
        const q = search.trim().toLowerCase();
        if (!q) {
          setDiscounts(rows);
          return;
        }
        setDiscounts(rows.filter((d: any) =>
          d.title?.toLowerCase().includes(q) || d.code?.toLowerCase().includes(q),
        ));
      });
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const saveDiscount = async () => {
    if (!editing) return;
    setSaving(true);
    const method = editing.id ? 'PUT' : 'POST';
    await fetch('/api/admin/data?type=discounts', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    setSaving(false);
    setEditing(null);
    load();
  };

  if (editing) {
    return (
      <>
        <div className="admin-page-header">
          <h1>{editing.id ? 'Edit Discount' : 'New Discount'}</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="admin-btn admin-btn--secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button className="admin-btn admin-btn--primary" onClick={saveDiscount} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
        <div className="admin-card" style={{ padding: '1.25rem', maxWidth: '560px' }}>
          <div className="admin-form-group">
            <label>Title</label>
            <input value={editing.title || ''} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
          </div>
          <div className="admin-form-group">
            <label>Discount Code (optional)</label>
            <input value={editing.code || ''} onChange={(e) => setEditing({ ...editing, code: e.target.value })} placeholder="SUMMER20" />
          </div>
          <div className="admin-grid-2">
            <div className="admin-form-group">
              <label>Type</label>
              <select value={editing.type || 'percentage'} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                <option value="percentage">Percentage off</option>
                <option value="fixed">Fixed amount off</option>
                <option value="bogo">Buy X Get Y</option>
                <option value="shipping">Free shipping</option>
              </select>
            </div>
            <div className="admin-form-group">
              <label>Value</label>
              <input type="number" min="0" value={editing.value || 0} onChange={(e) => setEditing({ ...editing, value: parseInt(e.target.value, 10) || 0 })} />
            </div>
          </div>
          <div className="admin-grid-2">
            <div className="admin-form-group">
              <label>Minimum Order (₹)</label>
              <input type="number" min="0" value={editing.minOrder || 0} onChange={(e) => setEditing({ ...editing, minOrder: parseInt(e.target.value, 10) || 0 })} />
            </div>
            <div className="admin-form-group">
              <label>Usage Limit</label>
              <input type="number" min="0" value={editing.usageLimit || ''} onChange={(e) => setEditing({ ...editing, usageLimit: e.target.value ? parseInt(e.target.value, 10) : null })} />
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            <input type="checkbox" checked={editing.automatic} onChange={(e) => setEditing({ ...editing, automatic: e.target.checked })} /> Apply automatically at checkout
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <input type="checkbox" checked={editing.active !== false} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> Active
          </label>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="admin-page-header">
        <h1>Discounts ({discounts.length})</h1>
        <button className="admin-btn admin-btn--primary" onClick={() => setEditing({ title: '', type: 'percentage', value: 10, active: true, automatic: false })}>Create discount</button>
      </div>
      <div className="admin-card">
        <div className="admin-card__header">
          <input
            type="search"
            placeholder="Search discounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '0.5rem', border: '1px solid #e1e1e1', borderRadius: '8px', width: '280px' }}
          />
        </div>
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Code</th><th>Type</th><th>Value</th><th>Automatic</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {discounts.map((d) => (
              <tr key={d.id}>
                <td><strong>{d.title}</strong></td>
                <td>{d.code || '—'}</td>
                <td>{d.type}</td>
                <td>{d.type === 'percentage' ? `${d.value}%` : d.type === 'bogo' ? `Buy X Get Y (${d.value}%)` : d.type === 'fixed' ? formatPrice(d.value) : 'Free shipping'}</td>
                <td>{d.automatic ? 'Yes' : '—'}</td>
                <td><StatusBadge status={d.active ? 'active' : 'draft'} /></td>
                <td><button className="admin-btn admin-btn--secondary" onClick={() => setEditing(d)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Content ─────────────────────────────────────────
function Content() {
  return (
    <>
      <div className="admin-page-header"><h1>Content</h1></div>
      <div className="admin-card" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Store Pages</h3>
        <p style={{ color: '#616161', marginBottom: '1.5rem' }}>Manage your store's pages, policies, and FAQs.</p>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {['About Us', 'Shipping Policy', 'Refund Policy', 'FAQ', 'Terms of Service', 'Privacy Policy'].map((page) => (
            <div key={page} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#fafafa', borderRadius: '8px' }}>
              <span>{page}</span>
              <button className="admin-btn admin-btn--secondary">Edit</button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Analytics ───────────────────────────────────────
function Analytics() {
  const [stats, setStats] = useState<any>(null);
  useEffect(() => { fetch('/api/admin/dashboard').then((r) => r.json()).then(setStats); }, []);

  if (!stats) return <div className="admin-loading">Loading analytics...</div>;

  return (
    <>
      <div className="admin-page-header"><h1>Analytics</h1></div>
      <div className="admin-stats">
        <div className="admin-stat"><div className="admin-stat__label">Total Products</div><div className="admin-stat__value">{stats.totals.products}</div></div>
        <div className="admin-stat"><div className="admin-stat__label">Total Customers</div><div className="admin-stat__value">{stats.totals.customers}</div></div>
        <div className="admin-stat"><div className="admin-stat__label">Active Discounts</div><div className="admin-stat__value">{stats.totals.activeDiscounts}</div></div>
        <div className="admin-stat"><div className="admin-stat__label">Pending Fulfillment</div><div className="admin-stat__value">{stats.totals.pendingFulfillment}</div></div>
      </div>
      <div className="admin-card">
        <div className="admin-card__header"><span className="admin-card__title">Daily Performance (7 days)</span></div>
        <table className="admin-table">
          <thead><tr><th>Date</th><th>Sessions</th><th>Page Views</th><th>Orders</th><th>Revenue</th></tr></thead>
          <tbody>
            {(stats.chartData || []).some((d: any) => d.orders > 0 || d.revenue > 0) ? stats.chartData.map((d: any) => (
              <tr key={d.date}>
                <td>{d.date}</td><td>{d.sessions}</td><td>{d.pageViews}</td><td>{d.orders}</td><td>{formatPrice(d.revenue)}</td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="admin-empty">No analytics data yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Main App ────────────────────────────────────────
export default function AdminApp() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [page, setPage] = useState<Page>('dashboard');
  const [pendingCount, setPendingCount] = useState(0);
  const [globalSearch, setGlobalSearch] = useState('');
  const [pageSearch, setPageSearch] = useState('');
  const [focusOrderId, setFocusOrderId] = useState<string | undefined>();
  const [focusProductId, setFocusProductId] = useState<string | undefined>();
  const [navRevision, setNavRevision] = useState(0);

  useEffect(() => {
    fetch('/api/admin/session').then((r) => r.json()).then((d) => setAuthenticated(d.authenticated));
    fetch('/api/admin/dashboard').then((r) => r.ok ? r.json() : null).then((d) => { if (d) setPendingCount(d.totals.pendingFulfillment); });
  }, [authenticated]);

  const handleLogout = async () => {
    await fetch('/api/admin/session', { method: 'POST' });
    setAuthenticated(false);
  };

  const handleSearchNavigate = ({ page: nextPage, query, orderId, productId }: SearchNavigateTarget) => {
    setPage(nextPage);
    setPageSearch(query || '');
    setGlobalSearch(query || '');
    setFocusOrderId(orderId);
    setFocusProductId(productId);
    setNavRevision((n) => n + 1);
  };

  if (authenticated === null) return <div className="admin-loading">Loading...</div>;
  if (!authenticated) return <Login onLogin={() => setAuthenticated(true)} />;

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={setPage}
            search={globalSearch}
            onSearchChange={setGlobalSearch}
            onSearchNavigate={handleSearchNavigate}
          />
        );
      case 'products': return <Products key={`products-${navRevision}`} initialSearch={pageSearch} focusProductId={focusProductId} />;
      case 'orders': return <Orders key={`orders-${navRevision}`} initialSearch={pageSearch} focusOrderId={focusOrderId} />;
      case 'customers': return <Customers key={`customers-${navRevision}`} initialSearch={pageSearch} />;
      case 'discounts': return <Discounts key={`discounts-${navRevision}`} initialSearch={pageSearch} />;
      case 'content': return <Content />;
      case 'analytics': return <Analytics />;
    }
  };

  let lastSection = '';

  return (
    <div className="admin-root">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__logo">TW</div>
          <span className="admin-sidebar__name">The Wall</span>
        </div>
        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => {
            const section = item.section && item.section !== lastSection ? (
              <div key={`section-${item.section}`} className="admin-nav__section">{item.section}</div>
            ) : null;
            if (item.section) lastSection = item.section;
            return (
              <div key={item.id}>
                {section}
                <button
                  className={`admin-nav__link ${page === item.id ? 'admin-nav__link--active' : ''}`}
                  onClick={() => setPage(item.id)}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.id === 'orders' && pendingCount > 0 && <span className="admin-nav__badge">{pendingCount}</span>}
                </button>
              </div>
            );
          })}
        </nav>
        <div className="admin-sidebar__footer">
          <a href="/" className="admin-nav__link" target="_blank">🌐 View Store</a>
          <button className="admin-nav__link" onClick={handleLogout}>🚪 Log out</button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <AdminSearchBar
            value={globalSearch}
            onChange={setGlobalSearch}
            onNavigate={handleSearchNavigate}
            placeholder="Search products, orders, customers..."
          />
          <div className="admin-topbar__actions">
            <div className="admin-avatar">A</div>
          </div>
        </header>
        <main className="admin-content">{renderPage()}</main>
      </div>
    </div>
  );
}
