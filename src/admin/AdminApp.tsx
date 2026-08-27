import { useEffect, useState } from 'react';
import { Sidebar } from './modules/Sidebar';
import { Topbar } from './modules/Topbar';
import { Dashboard } from './modules/Dashboard';
import { ProductsList } from './modules/Products';
import { Orders } from './modules/Orders';
import { Customers } from './modules/Customers';
import { Discounts } from './modules/Discounts';
import { Content } from './modules/Content';
import { Analytics } from './modules/Analytics';
import { checkSession, fetchDashboard, login, logout } from './modules/api';
import type { Page, SearchNavigateTarget } from './modules/types';
import { Spinner } from './modules/StatusBadge';
import './admin.css';

const PAGE_LABELS: Record<Page, string> = {
  dashboard: 'Home',
  orders: 'Orders',
  products: 'Products',
  customers: 'Customers',
  discounts: 'Discounts',
  content: 'Content',
  analytics: 'Analytics',
};

export default function AdminApp() {
  const [auth, setAuth] = useState<boolean | null>(null);
  const [page, setPage] = useState<Page>('dashboard');
  const [navRevision, setNavRevision] = useState(0);
  const [pending, setPending] = useState(0);
  const [activeDiscounts, setActiveDiscounts] = useState(0);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('tw-sidebar-collapsed') === '1';
  });

  useEffect(() => {
    checkSession().then(setAuth);
  }, []);

  useEffect(() => {
    fetchDashboard()
      .then((d) => {
        setPending(d.totals.pendingFulfillment);
        setActiveDiscounts(d.totals.activeDiscounts);
      })
      .catch(() => {});
  }, [navRevision]);

  useEffect(() => {
    window.localStorage.setItem('tw-sidebar-collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const handleSearchNavigate = (target: SearchNavigateTarget) => {
    setPage(target.page);
    setNavRevision((n) => n + 1);
  };

  if (auth === null) {
    return (
      <div className="tw-loading-screen">
        <Spinner size={28} />
        <p>Loading admin…</p>
      </div>
    );
  }

  if (!auth) {
    return <LoginScreen onLogin={() => setAuth(true)} />;
  }

  return (
    <div className={`tw-shell ${collapsed ? 'tw-shell--collapsed' : ''}`}>
      <Sidebar
        page={page}
        onNavigate={setPage}
        pendingFulfillment={pending}
        activeDiscounts={activeDiscounts}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        onLogout={async () => {
          await logout();
          setAuth(false);
        }}
      />
      <div className="tw-main">
        <Topbar
          page={PAGE_LABELS[page]}
          onNavigate={handleSearchNavigate}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((c) => !c)}
        />
        <main className="tw-content" key={`${page}-${navRevision}`}>
          {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
          {page === 'products' && <ProductsList key={navRevision} />}
          {page === 'orders' && <Orders key={navRevision} />}
          {page === 'customers' && <Customers key={navRevision} />}
          {page === 'discounts' && <Discounts key={navRevision} />}
          {page === 'content' && <Content />}
          {page === 'analytics' && <Analytics />}
        </main>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const ok = await login(password);
      if (ok) onLogin();
      else setError('Invalid password.');
    } catch {
      setError('Could not sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tw-login">
      <div className="tw-login__card">
        <div className="tw-login__brand">
          <div className="tw-login__logo">TW</div>
          <div>
            <h1>The Wall Admin</h1>
            <p>Sign in to manage your store</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="tw-login__form">
          {error && <div className="tw-login__error">{error}</div>}
          <div className="tw-form__group">
            <label htmlFor="tw-password">Password</label>
            <input
              id="tw-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
            />
          </div>
          <button type="submit" className="tw-btn tw-btn--primary tw-btn--block" disabled={loading}>
            {loading ? <><Spinner size={14} /> Signing in…</> : 'Sign in'}
          </button>
        </form>
        <p className="tw-login__hint">
          <a href="/">← Back to the store</a>
        </p>
      </div>
    </div>
  );
}
