import { useEffect, useState } from 'react';
import type { Page, DashboardStats } from './types';
import { fetchDashboard, formatPrice, formatPriceCompact } from './api';
import { StatusBadge, Skeleton } from './StatusBadge';

type SparklineProps = { data: number[]; tone?: 'up' | 'down' | 'flat' };
function Sparkline({ data, tone = 'up' }: SparklineProps) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 88;
  const h = 28;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg className={`tw-spark tw-spark--${tone}`} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type KpiCardProps = {
  label: string;
  value: string;
  delta?: { value: number; suffix?: string };
  spark?: number[];
  tone?: 'accent' | 'success' | 'warning' | 'info';
  icon: React.ReactNode;
};
function KpiCard({ label, value, delta, spark, tone = 'accent', icon }: KpiCardProps) {
  const trendTone = !delta ? 'flat' : delta.value > 0 ? 'up' : delta.value < 0 ? 'down' : 'flat';
  return (
    <div className={`tw-kpi tw-kpi--${tone}`}>
      <div className="tw-kpi__head">
        <span className="tw-kpi__label">{label}</span>
        <span className="tw-kpi__icon">{icon}</span>
      </div>
      <div className="tw-kpi__value">{value}</div>
      <div className="tw-kpi__foot">
        {delta && (
          <span className={`tw-kpi__delta tw-kpi__delta--${trendTone}`}>
            {delta.value > 0 ? '↑' : delta.value < 0 ? '↓' : '→'} {Math.abs(delta.value)}
            {delta.suffix ?? '%'}
          </span>
        )}
        {spark && <Sparkline data={spark} tone={trendTone as 'up' | 'down' | 'flat'} />}
      </div>
    </div>
  );
}

function Chart({ data }: { data: DashboardStats['chartData'] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const hasRevenue = data.some((d) => d.revenue > 0);
  if (!hasRevenue) {
    return (
      <div className="tw-empty">
        <div className="tw-empty__icon" aria-hidden="true">📈</div>
        <h3 className="tw-empty__title">No revenue yet</h3>
        <p className="tw-empty__hint">Once orders come in, your daily revenue will appear here.</p>
      </div>
    );
  }
  return (
    <div className="tw-barchart">
      {data.map((d) => {
        const h = Math.max(2, (d.revenue / max) * 100);
        return (
          <div key={d.date} className="tw-barchart__col" title={`${d.date}: ${formatPrice(d.revenue)} · ${d.orders} orders`}>
            <div className="tw-barchart__bar" style={{ height: `${h}%` }} />
            <div className="tw-barchart__label">{formatDayLabel(d.date)}</div>
          </div>
        );
      })}
    </div>
  );
}

function formatDayLabel(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, { weekday: 'short' });
}

export function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetchDashboard().then(setStats).catch(() => setStats(null));
  }, []);

  if (!stats) {
    return (
      <>
        <div className="tw-page-header">
          <h1>Welcome back</h1>
          <p className="tw-page-header__sub">Here's a snapshot of how your store is doing.</p>
        </div>
        <div className="tw-kpi-grid">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} rows={1} />)}
        </div>
      </>
    );
  }

  const chartData = stats.chartData ?? [];
  const revenueSeries = chartData.map((d) => d.revenue);
  const ordersSeries = chartData.map((d) => d.orders);

  // Compute a "vs yesterday" delta for today's KPIs.
  const yesterdayRevenue = chartData[chartData.length - 2]?.revenue ?? 0;
  const todayRevenue = stats.today.revenue;
  const revenueDelta = yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : 0;
  const yesterdayOrders = chartData[chartData.length - 2]?.orders ?? 0;
  const todayOrders = stats.today.orders;
  const ordersDelta = yesterdayOrders > 0 ? Math.round(((todayOrders - yesterdayOrders) / yesterdayOrders) * 100) : 0;

  return (
    <>
      <div className="tw-page-header">
        <div>
          <h1>Welcome back 👋</h1>
          <p className="tw-page-header__sub">Here's a snapshot of how your store is doing today.</p>
        </div>
        <div className="tw-page-header__actions">
          {stats.totals.pendingFulfillment > 0 && (
            <button className="tw-btn tw-btn--primary" onClick={() => onNavigate('orders')}>
              {stats.totals.pendingFulfillment} order{stats.totals.pendingFulfillment === 1 ? '' : 's'} to fulfil →
            </button>
          )}
        </div>
      </div>

      <div className="tw-kpi-grid">
        <KpiCard
          label="Today's revenue"
          value={formatPrice(stats.today.revenue)}
          delta={{ value: revenueDelta }}
          spark={revenueSeries}
          tone="success"
          icon={<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
        />
        <KpiCard
          label="Today's orders"
          value={String(stats.today.orders)}
          delta={{ value: ordersDelta }}
          spark={ordersSeries}
          tone="accent"
          icon={<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>}
        />
        <KpiCard
          label="Conversion rate"
          value={`${stats.today.conversionRate.toFixed(2)}%`}
          tone="info"
          icon={<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>}
        />
        <KpiCard
          label="Sessions today"
          value={stats.today.sessions.toLocaleString()}
          tone="warning"
          icon={<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
        />
      </div>

      <div className="tw-grid-2-1">
        <div className="tw-card">
          <div className="tw-card__head">
            <div>
              <h2 className="tw-card__title">Revenue — last 7 days</h2>
              <p className="tw-card__sub">Total revenue per day</p>
            </div>
            <div className="tw-card__actions">
              <span className="tw-badge tw-badge--success">Live</span>
            </div>
          </div>
          <Chart data={chartData} />
        </div>

        <div className="tw-card">
          <div className="tw-card__head">
            <h2 className="tw-card__title">Quick actions</h2>
          </div>
          <div className="tw-quickactions">
            <button className="tw-quickaction" onClick={() => onNavigate('products')}>
              <span className="tw-quickaction__icon">＋</span>
              <span className="tw-quickaction__label">Add a product</span>
              <span className="tw-quickaction__sub">Create a new poster, bundle, or memory print</span>
            </button>
            <button className="tw-quickaction" onClick={() => onNavigate('discounts')}>
              <span className="tw-quickaction__icon">％</span>
              <span className="tw-quickaction__label">Create a discount</span>
              <span className="tw-quickaction__sub">Run a code or auto-apply offer</span>
            </button>
            <button className="tw-quickaction" onClick={() => onNavigate('content')}>
              <span className="tw-quickaction__icon">📄</span>
              <span className="tw-quickaction__label">Edit a page</span>
              <span className="tw-quickaction__sub">Update policies, FAQ, or About</span>
            </button>
            <button className="tw-quickaction" onClick={() => onNavigate('analytics')}>
              <span className="tw-quickaction__icon">📊</span>
              <span className="tw-quickaction__label">View analytics</span>
              <span className="tw-quickaction__sub">Traffic, sessions, sales trends</span>
            </button>
          </div>
        </div>
      </div>

      <div className="tw-grid-2-1">
        <div className="tw-card">
          <div className="tw-card__head">
            <div>
              <h2 className="tw-card__title">Recent orders</h2>
              <p className="tw-card__sub">Latest 6 orders across the store</p>
            </div>
            <button className="tw-btn tw-btn--ghost" onClick={() => onNavigate('orders')}>
              View all →
            </button>
          </div>
          {stats.recentOrders.length === 0 ? (
            <div className="tw-empty tw-empty--compact">
              <div className="tw-empty__icon" aria-hidden="true">📦</div>
              <h3 className="tw-empty__title">No orders yet</h3>
              <p className="tw-empty__hint">Your first order will appear here.</p>
            </div>
          ) : (
            <div className="tw-table-wrap">
              <table className="tw-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.slice(0, 6).map((o) => (
                    <tr key={o.id} onClick={() => onNavigate('orders')} className="tw-table__row--clickable">
                      <td><strong>#{o.orderNumber}</strong></td>
                      <td>{o.customerName || 'Guest'}</td>
                      <td>{formatPriceCompact(o.total)}</td>
                      <td><StatusBadge status={o.fulfillmentStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="tw-card">
          <div className="tw-card__head">
            <h2 className="tw-card__title">Store at a glance</h2>
          </div>
          <ul className="tw-stats">
            <li>
              <span>Products</span>
              <strong>{stats.totals.products}</strong>
            </li>
            <li>
              <span>Customers</span>
              <strong>{stats.totals.customers}</strong>
            </li>
            <li>
              <span>Active discounts</span>
              <strong>{stats.totals.activeDiscounts}</strong>
            </li>
            <li>
              <span>Pending fulfilment</span>
              <strong>{stats.totals.pendingFulfillment}</strong>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
