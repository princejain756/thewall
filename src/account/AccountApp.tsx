import { useState, useEffect, useCallback } from 'react';
import './account.css';

type Page = 'overview' | 'orders' | 'analytics' | 'profile';

type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  ordersCount: number;
  totalSpent: number;
  createdAt: string;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  total: number;
  createdAt: string;
  items?: { title: string; size: string | null; quantity: number; price: number }[];
};

type DashboardData = {
  customer: Customer;
  stats: {
    totalOrders: number;
    totalSpent: number;
    avgOrder: number;
    paidOrders: number;
    lastOrderDate: string | null;
  };
  monthlyChart: { month: string; label: string; amount: number; pct: number }[];
  sizeBreakdown: { size: string; count: number }[];
  statusBreakdown: { status: string; count: number }[];
  recentOrders: Order[];
};

const NAV: { id: Page; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '◈' },
  { id: 'orders', label: 'Orders', icon: '▣' },
  { id: 'analytics', label: 'Analytics', icon: '◎' },
  { id: 'profile', label: 'Profile', icon: '◇' },
];

function formatPrice(paise: number) {
  return `₹${(paise / 100).toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: string }) {
  const cls = ['paid', 'delivered', 'fulfilled'].includes(status)
    ? 'paid'
    : status === 'cancelled'
      ? 'cancelled'
      : 'pending';
  return <span className={`ac-badge ac-badge--${cls}`}>{status}</span>;
}

function AuthScreen({ onAuth }: { onAuth: (returnTo?: string) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const returnTo =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('return') || undefined
      : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const endpoint = mode === 'login' ? '/api/account/login' : '/api/account/register';
    const body =
      mode === 'login'
        ? { email: form.email, password: form.password }
        : form;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (res.ok) onAuth(returnTo);
    else setError(data.error || 'Something went wrong');
    setLoading(false);
  };

  return (
    <div className="ac-auth">
      <div className="ac-auth__visual">
        <div>
          <div className="ac-auth__brand">the.Wall</div>
          <div className="ac-auth__tagline">Your personal archive</div>
        </div>
        <div className="ac-auth__quote">
          <p>&ldquo;Every poster tells a story. Track yours.&rdquo;</p>
        </div>
      </div>
      <div className="ac-auth__form-wrap">
        <div className="ac-auth__card">
          <a href="/" className="ac-back">← Back to store</a>
          <h1>{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
          <p>
            {mode === 'login'
              ? returnTo === '/checkout'
                ? 'Sign in to complete your order. Razorpay verification requires a logged-in checkout.'
                : 'Sign in to view orders, download invoices, and track your collection.'
              : 'Register to access your order history and exclusive perks.'}
          </p>

          <div className="ac-tabs">
            <button
              type="button"
              className={mode === 'login' ? 'is-active' : ''}
              onClick={() => { setMode('login'); setError(''); }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={mode === 'register' ? 'is-active' : ''}
              onClick={() => { setMode('register'); setError(''); }}
            >
              Register
            </button>
          </div>

          {error && <div className="ac-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="ac-field">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                  required
                />
              </div>
            )}
            <div className="ac-field">
              <label htmlFor="email">{mode === 'login' ? 'Email or username' : 'Email'}</label>
              <input
                id="email"
                type={mode === 'login' ? 'text' : 'email'}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={mode === 'login' ? 'demo or you@email.com' : 'you@email.com'}
                required
                autoComplete={mode === 'login' ? 'username' : 'email'}
              />
            </div>
            {mode === 'register' && (
              <div className="ac-field">
                <label htmlFor="phone">Phone (optional)</label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            )}
            <div className="ac-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={mode === 'register' ? 'Min. 6 characters' : 'Your password'}
                required
                minLength={mode === 'register' ? 6 : undefined}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
            <button type="submit" className="ac-btn ac-btn--primary" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function OrderModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="ac-modal-backdrop" onClick={onClose} role="presentation">
      <div className="ac-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ac-modal__head">
          <div>
            <h2>{order.orderNumber}</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {formatDate(order.createdAt)}
            </p>
          </div>
          <button type="button" className="ac-modal__close" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <StatusBadge status={order.paymentStatus} />
          <StatusBadge status={order.fulfillmentStatus} />
        </div>
        <div className="ac-modal__items">
          {order.items?.map((item, i) => (
            <div key={i} className="ac-modal__item">
              <span>
                {item.title}
                {item.size && <span style={{ opacity: 0.6 }}> · {item.size}</span>}
                {' '}× {item.quantity}
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="ac-modal__total">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
        <div style={{ marginTop: '1.25rem' }}>
          <a
            href={`/api/account/orders/${order.id}/invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className="ac-btn ac-btn--primary"
            style={{ textDecoration: 'none' }}
          >
            Download Invoice
          </a>
        </div>
      </div>
    </div>
  );
}

function OverviewPage({ data, onViewOrder }: { data: DashboardData; onViewOrder: (o: Order) => void }) {
  return (
    <>
      <div className="ac-stats">
        <div className="ac-stat">
          <div className="ac-stat__label">Total Orders</div>
          <div className="ac-stat__value">{data.stats.totalOrders}</div>
        </div>
        <div className="ac-stat">
          <div className="ac-stat__label">Total Spent</div>
          <div className="ac-stat__value">{formatPrice(data.stats.totalSpent)}</div>
        </div>
        <div className="ac-stat">
          <div className="ac-stat__label">Avg. Order</div>
          <div className="ac-stat__value">{formatPrice(data.stats.avgOrder)}</div>
        </div>
        <div className="ac-stat">
          <div className="ac-stat__label">Last Order</div>
          <div className="ac-stat__value" style={{ fontSize: '1.15rem' }}>
            {data.stats.lastOrderDate ? formatDate(data.stats.lastOrderDate) : '—'}
          </div>
        </div>
      </div>

      <div className="ac-card">
        <div className="ac-card__title">Recent Orders</div>
        {data.recentOrders.length === 0 ? (
          <div className="ac-empty">
            <h3>No orders yet</h3>
            <p>Your poster journey starts here.</p>
            <a href="/shop" className="ac-btn ac-btn--primary" style={{ display: 'inline-flex', width: 'auto', marginTop: '1rem', textDecoration: 'none' }}>
              Browse Shop
            </a>
          </div>
        ) : (
          <div className="ac-table-wrap">
            <table className="ac-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>{o.orderNumber}</strong></td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td><StatusBadge status={o.paymentStatus} /></td>
                    <td><strong>{formatPrice(o.total)}</strong></td>
                    <td>
                      <div className="ac-order-actions">
                        <button type="button" onClick={() => onViewOrder(o)}>View</button>
                        <a href={`/api/account/orders/${o.id}/invoice`} target="_blank" rel="noopener noreferrer">Invoice</a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function OrdersPage({ customer, onViewOrder }: { customer: Customer; onViewOrder: (o: Order) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/account/orders')
      .then((r) => r.json())
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="ac-empty">Loading orders…</div>;

  return (
    <div className="ac-card">
      <div className="ac-card__title">Order History ({orders.length})</div>
      {orders.length === 0 ? (
        <div className="ac-empty">
          <h3>No orders found</h3>
          <p>Orders placed with {customer.email} will appear here.</p>
        </div>
      ) : (
        <div className="ac-table-wrap">
          <table className="ac-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Payment</th>
                <th>Fulfillment</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td><strong>{o.orderNumber}</strong></td>
                  <td>{formatDate(o.createdAt)}</td>
                  <td><StatusBadge status={o.paymentStatus} /></td>
                  <td><StatusBadge status={o.fulfillmentStatus} /></td>
                  <td><strong>{formatPrice(o.total)}</strong></td>
                  <td>
                    <div className="ac-order-actions">
                      <button type="button" onClick={async () => {
                        const res = await fetch(`/api/account/orders?id=${o.id}`);
                        const detail = await res.json();
                        onViewOrder(detail);
                      }}>Details</button>
                      <a href={`/api/account/orders/${o.id}/invoice`} target="_blank" rel="noopener noreferrer">Invoice</a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AnalyticsPage({ data }: { data: DashboardData }) {
  const maxSize = Math.max(...data.sizeBreakdown.map((s) => s.count), 1);

  return (
    <div className="ac-grid-2">
      <div className="ac-card">
        <div className="ac-card__title">Monthly Spending</div>
        {data.monthlyChart.length === 0 ? (
          <div className="ac-empty"><p>No spending data yet</p></div>
        ) : (
          <div className="ac-chart">
            {data.monthlyChart.map((m) => (
              <div key={m.month} className="ac-chart__bar-wrap">
                <div className="ac-chart__amt">{formatPrice(m.amount)}</div>
                <div className="ac-chart__bar" style={{ height: `${m.pct}%` }} />
                <div className="ac-chart__label">{m.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ac-card">
        <div className="ac-card__title">Poster Sizes</div>
        {data.sizeBreakdown.length === 0 ? (
          <div className="ac-empty"><p>No size data yet</p></div>
        ) : (
          <div className="ac-sizes">
            {data.sizeBreakdown.map((s) => (
              <div key={s.size} className="ac-size-row">
                <span className="ac-size-row__label">{s.size}</span>
                <div className="ac-size-row__track">
                  <div className="ac-size-row__fill" style={{ width: `${(s.count / maxSize) * 100}%` }} />
                </div>
                <span className="ac-size-row__count">{s.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ac-card" style={{ gridColumn: '1 / -1' }}>
        <div className="ac-card__title">Order Status Breakdown</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          {data.statusBreakdown.map((s) => (
            <div key={s.status} style={{ textAlign: 'center', minWidth: '80px' }}>
              <div style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 600 }}>{s.count}</div>
              <StatusBadge status={s.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ customer, onUpdate }: { customer: Customer; onUpdate: (c: Customer) => void }) {
  const [form, setForm] = useState({ name: customer.name, phone: customer.phone || '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    const res = await fetch('/api/account/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      onUpdate(data.customer);
      setMsg('Profile updated successfully.');
    } else {
      setMsg(data.error || 'Update failed');
    }
    setSaving(false);
  };

  return (
    <div className="ac-card ac-profile-form">
      <div className="ac-card__title">Your Profile</div>
      <form onSubmit={handleSave}>
        <div className="ac-field">
          <label htmlFor="pname">Full Name</label>
          <input id="pname" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="ac-field">
          <label>Email</label>
          <input value={customer.email} disabled style={{ opacity: 0.6 }} />
        </div>
        <div className="ac-field">
          <label htmlFor="pphone">Phone</label>
          <input id="pphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        {msg && <div className={msg.includes('success') ? 'ac-error' : 'ac-error'} style={msg.includes('success') ? { background: 'rgba(34,120,60,0.08)', borderColor: 'rgba(34,120,60,0.2)', color: '#1a6b35' } : undefined}>{msg}</div>}
        <button type="submit" className="ac-btn ac-btn--primary" disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
      <p style={{ marginTop: '1.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        Member since {formatDate(customer.createdAt)}
      </p>
    </div>
  );
}

function Dashboard({ customer: initial, onLogout }: { customer: Customer; onLogout: () => void }) {
  const [page, setPage] = useState<Page>('overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [customer, setCustomer] = useState(initial);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadDashboard = useCallback(() => {
    fetch('/api/account/dashboard')
      .then((r) => r.json())
      .then((d) => setData(d));
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const handleViewOrder = (order: Order) => setSelectedOrder(order);

  const initials = customer.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const pageTitle = NAV.find((n) => n.id === page)?.label ?? 'Account';

  return (
    <div className="ac-shell">
      <aside className="ac-sidebar">
        <div className="ac-sidebar__brand">
          the.Wall
          <span>My Account</span>
        </div>
        <nav className="ac-nav" aria-label="Account navigation">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={page === item.id ? 'is-active' : ''}
              onClick={() => setPage(item.id)}
            >
              <span className="ac-nav__icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="ac-sidebar__foot">
          <div className="ac-user">
            <div className="ac-user__avatar">{initials}</div>
            <div>
              <div className="ac-user__name">{customer.name}</div>
              <div className="ac-user__email">{customer.email}</div>
            </div>
          </div>
          <button type="button" className="ac-btn ac-btn--ghost" style={{ width: '100%', color: 'var(--cream)', borderColor: 'rgba(255,255,255,0.2)' }} onClick={onLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      <main className="ac-main">
        <div className="ac-topbar">
          <h1>{pageTitle}</h1>
          <div className="ac-topbar__actions">
            <a href="/shop" className="ac-shop-link">Continue Shopping</a>
          </div>
        </div>

        {data && page === 'overview' && <OverviewPage data={data} onViewOrder={handleViewOrder} />}
        {page === 'orders' && <OrdersPage customer={customer} onViewOrder={handleViewOrder} />}
        {data && page === 'analytics' && <AnalyticsPage data={data} />}
        {page === 'profile' && (
          <ProfilePage customer={customer} onUpdate={(c) => { setCustomer(c); loadDashboard(); }} />
        )}
      </main>

      {selectedOrder && (
        <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}

export default function AccountApp() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetch('/api/account/session')
      .then((r) => r.json())
      .then((d) => {
        setAuthenticated(d.authenticated);
        if (d.customer) setCustomer(d.customer);
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/account/session', { method: 'POST' });
    setAuthenticated(false);
    setCustomer(null);
  };

  if (authenticated === null) return <div className="ac-loading">Loading your archive…</div>;
  if (!authenticated || !customer) {
    return <AuthScreen onAuth={(returnTo) => {
      fetch('/api/account/session')
        .then((r) => r.json())
        .then((d) => {
          setAuthenticated(d.authenticated);
          if (d.customer) setCustomer(d.customer);
          if (returnTo && d.authenticated) {
            window.location.href = returnTo;
          }
        });
    }} />;
  }

  return <Dashboard customer={customer} onLogout={handleLogout} />;
}
