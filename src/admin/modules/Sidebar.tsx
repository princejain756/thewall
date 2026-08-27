import { useState, type ReactNode } from 'react';
import type { Page } from './types';

type NavItem = {
  id: Page;
  label: string;
  icon: ReactNode;
  badge?: number | string;
  badgeTone?: 'danger' | 'warning' | 'success' | 'neutral';
};

type NavGroup = { label: string; items: NavItem[] };

const ICONS: Record<string, ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  products: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  customers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  discounts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  content: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  analytics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
};

export function buildNav(pendingFulfillment: number, activeDiscounts: number): NavGroup[] {
  return [
    {
      label: 'Overview',
      items: [
        { id: 'dashboard', label: 'Home', icon: ICONS.dashboard },
        { id: 'analytics', label: 'Analytics', icon: ICONS.analytics },
      ],
    },
    {
      label: 'Store',
      items: [
        {
          id: 'orders',
          label: 'Orders',
          icon: ICONS.orders,
          badge: pendingFulfillment > 0 ? pendingFulfillment : undefined,
          badgeTone: 'warning',
        },
        { id: 'products', label: 'Products', icon: ICONS.products },
        { id: 'customers', label: 'Customers', icon: ICONS.customers },
        {
          id: 'discounts',
          label: 'Discounts',
          icon: ICONS.discounts,
          badge: activeDiscounts > 0 ? activeDiscounts : undefined,
          badgeTone: 'success',
        },
      ],
    },
    {
      label: 'Online Store',
      items: [{ id: 'content', label: 'Content', icon: ICONS.content }],
    },
  ];
}

export function Sidebar({
  page,
  onNavigate,
  pendingFulfillment,
  activeDiscounts,
  collapsed,
  onToggleCollapsed,
  onLogout,
}: {
  page: Page;
  onNavigate: (p: Page) => void;
  pendingFulfillment: number;
  activeDiscounts: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onLogout: () => void;
}) {
  const groups = buildNav(pendingFulfillment, activeDiscounts);
  const [openMobile, setOpenMobile] = useState(false);

  const handleClick = (id: Page) => {
    onNavigate(id);
    setOpenMobile(false);
  };

  return (
    <>
      <button
        type="button"
        className="tw-sidebar__mobile-trigger"
        onClick={() => setOpenMobile(true)}
        aria-label="Open navigation"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {openMobile && <div className="tw-sidebar__backdrop" onClick={() => setOpenMobile(false)} />}

      <aside className={`tw-sidebar ${collapsed ? 'tw-sidebar--collapsed' : ''} ${openMobile ? 'tw-sidebar--mobile-open' : ''}`}>
        <div className="tw-sidebar__brand">
          <div className="tw-sidebar__logo" aria-hidden="true">TW</div>
          {!collapsed && (
            <div className="tw-sidebar__brand-text">
              <span className="tw-sidebar__brand-name">The Wall</span>
              <span className="tw-sidebar__brand-sub">Admin</span>
            </div>
          )}
        </div>

        <nav className="tw-nav" aria-label="Main">
          {groups.map((group) => (
            <div key={group.label} className="tw-nav__group">
              {!collapsed && <div className="tw-nav__group-label">{group.label}</div>}
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`tw-nav__link ${page === item.id ? 'tw-nav__link--active' : ''}`}
                  onClick={() => handleClick(item.id)}
                  title={collapsed ? item.label : undefined}
                  aria-current={page === item.id ? 'page' : undefined}
                >
                  <span className="tw-nav__icon">{item.icon}</span>
                  {!collapsed && <span className="tw-nav__label">{item.label}</span>}
                  {!collapsed && item.badge != null && (
                    <span className={`tw-nav__badge tw-nav__badge--${item.badgeTone ?? 'neutral'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="tw-sidebar__footer">
          <a href="/" target="_blank" rel="noopener noreferrer" className="tw-nav__link tw-nav__link--muted" title={collapsed ? 'View Store' : undefined}>
            <span className="tw-nav__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </span>
            {!collapsed && <span className="tw-nav__label">View Store</span>}
          </a>
          <button type="button" className="tw-nav__link tw-nav__link--muted" onClick={onLogout} title={collapsed ? 'Log out' : undefined}>
            <span className="tw-nav__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </span>
            {!collapsed && <span className="tw-nav__label">Log out</span>}
          </button>
          <button
            type="button"
            className="tw-sidebar__collapse-btn"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {collapsed ? <polyline points="9 18 15 12 9 6" /> : <polyline points="15 18 9 12 15 6" />}
            </svg>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
