import { useEffect, useRef, useState } from 'react';
import type { SearchNavigateTarget, SearchResults } from './types';
import { search, formatPrice, formatRelative } from './api';

export function Topbar({
  page,
  onNavigate,
  collapsed,
  onToggleCollapsed,
}: {
  page: string;
  onNavigate: (target: SearchNavigateTarget) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const input = wrapRef.current?.querySelector('input');
        input?.focus();
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    const query = q.trim();
    if (!query) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = window.setTimeout(() => {
      search(query)
        .then((data) => {
          setResults(data);
          setOpen(true);
        })
        .catch(() => setResults({ products: [], orders: [], customers: [], discounts: [] }))
        .finally(() => setLoading(false));
    }, 180);
    return () => window.clearTimeout(t);
  }, [q]);

  const total = results ? results.products.length + results.orders.length + results.customers.length + results.discounts.length : 0;

  return (
    <header className="tw-topbar">
      <button
        type="button"
        className="tw-topbar__collapse-toggle"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {collapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
        </svg>
      </button>

      <div className="tw-topbar__title">
        <span className="tw-topbar__page">{pageLabel(page)}</span>
      </div>

      <div className="tw-topbar__search" ref={wrapRef}>
        <svg className="tw-topbar__search-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          placeholder="Search anything…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => q.trim() && setOpen(true)}
          aria-label="Search admin"
          autoComplete="off"
        />
        <kbd className="tw-topbar__kbd">⌘K</kbd>

        {open && q.trim() && (
          <div className="tw-search-dropdown" role="listbox">
            {loading && <p className="tw-search-dropdown__hint">Searching…</p>}
            {!loading && total === 0 && <p className="tw-search-dropdown__hint">No results for “{q.trim()}”</p>}
            {!loading && results && total > 0 && (
              <>
                {results.orders.length > 0 && (
                  <div className="tw-search-dropdown__group">
                    <p className="tw-search-dropdown__label">Orders</p>
                    {results.orders.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        className="tw-search-dropdown__item"
                        onClick={() => { onNavigate({ page: 'orders', orderId: o.id }); setOpen(false); setQ(''); }}
                      >
                        <span className="tw-search-dropdown__item-main">#{o.orderNumber}</span>
                        <span className="tw-search-dropdown__item-sub">
                          {o.customerName || 'Guest'} · {formatPrice(o.total)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {results.products.length > 0 && (
                  <div className="tw-search-dropdown__group">
                    <p className="tw-search-dropdown__label">Products</p>
                    {results.products.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="tw-search-dropdown__item"
                        onClick={() => { onNavigate({ page: 'products', productId: p.id }); setOpen(false); setQ(''); }}
                      >
                        <span className="tw-search-dropdown__item-main">{p.title}</span>
                        <span className="tw-search-dropdown__item-sub">{p.collectionName || p.status}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results.customers.length > 0 && (
                  <div className="tw-search-dropdown__group">
                    <p className="tw-search-dropdown__label">Customers</p>
                    {results.customers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="tw-search-dropdown__item"
                        onClick={() => { onNavigate({ page: 'customers', query: c.email }); setOpen(false); setQ(''); }}
                      >
                        <span className="tw-search-dropdown__item-main">{c.name}</span>
                        <span className="tw-search-dropdown__item-sub">{c.email}</span>
                      </button>
                    ))}
                  </div>
                )}
                {results.discounts.length > 0 && (
                  <div className="tw-search-dropdown__group">
                    <p className="tw-search-dropdown__label">Discounts</p>
                    {results.discounts.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className="tw-search-dropdown__item"
                        onClick={() => { onNavigate({ page: 'discounts', query: d.title }); setOpen(false); setQ(''); }}
                      >
                        <span className="tw-search-dropdown__item-main">{d.title}</span>
                        <span className="tw-search-dropdown__item-sub">{d.code || d.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="tw-topbar__actions">
        <button type="button" className="tw-iconbtn" title="Notifications" aria-label="Notifications">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="tw-iconbtn__dot" />
        </button>
        <div className="tw-topbar__user" title="Admin">
          <span className="tw-topbar__avatar">A</span>
        </div>
      </div>
    </header>
  );
}

function pageLabel(page: string): string {
  return page.charAt(0).toUpperCase() + page.slice(1);
}
