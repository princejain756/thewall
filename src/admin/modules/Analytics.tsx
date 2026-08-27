import { useEffect, useState } from 'react';
import type { DashboardStats } from './types';
import { fetchDashboard, formatPrice, formatPriceCompact } from './api';
import { Skeleton } from './StatusBadge';

export function Analytics() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetchDashboard().then(setStats).catch(() => setStats(null));
  }, []);

  if (!stats) {
    return (
      <>
        <div className="tw-page-header">
          <h1>Analytics</h1>
        </div>
        <Skeleton rows={5} />
      </>
    );
  }

  const totalRevenue = stats.chartData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = stats.chartData.reduce((sum, d) => sum + d.orders, 0);
  const totalSessions = stats.chartData.reduce((sum, d) => sum + d.sessions, 0);
  const totalPageViews = stats.chartData.reduce((sum, d) => sum + d.pageViews, 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return (
    <>
      <div className="tw-page-header">
        <div>
          <h1>Analytics</h1>
          <p className="tw-page-header__sub">Last 7 days · all metrics in one place</p>
        </div>
      </div>

      <div className="tw-kpi-grid">
        <div className="tw-kpi tw-kpi--success">
          <div className="tw-kpi__head"><span className="tw-kpi__label">Revenue (7d)</span></div>
          <div className="tw-kpi__value">{formatPriceCompact(totalRevenue)}</div>
          <div className="tw-kpi__foot"><span className="tw-text-muted tw-text-sm">7-day total</span></div>
        </div>
        <div className="tw-kpi tw-kpi--accent">
          <div className="tw-kpi__head"><span className="tw-kpi__label">Orders (7d)</span></div>
          <div className="tw-kpi__value">{totalOrders}</div>
          <div className="tw-kpi__foot"><span className="tw-text-muted tw-text-sm">7-day total</span></div>
        </div>
        <div className="tw-kpi tw-kpi--info">
          <div className="tw-kpi__head"><span className="tw-kpi__label">Avg. order value</span></div>
          <div className="tw-kpi__value">{formatPrice(avgOrderValue)}</div>
          <div className="tw-kpi__foot"><span className="tw-text-muted tw-text-sm">Revenue ÷ orders</span></div>
        </div>
        <div className="tw-kpi tw-kpi--warning">
          <div className="tw-kpi__head"><span className="tw-kpi__label">Sessions (7d)</span></div>
          <div className="tw-kpi__value">{totalSessions.toLocaleString()}</div>
          <div className="tw-kpi__foot"><span className="tw-text-muted tw-text-sm">{totalPageViews.toLocaleString()} page views</span></div>
        </div>
      </div>

      <div className="tw-card">
        <div className="tw-card__head">
          <h2 className="tw-card__title">Daily performance</h2>
          <p className="tw-card__sub">Sessions, page views, orders, and revenue per day</p>
        </div>
        {stats.chartData.length === 0 ? (
          <p className="tw-text-muted">No data yet.</p>
        ) : (
          <div className="tw-table-wrap">
            <table className="tw-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sessions</th>
                  <th>Page views</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {stats.chartData.map((d) => (
                  <tr key={d.date}>
                    <td><strong>{new Date(d.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</strong></td>
                    <td>{d.sessions}</td>
                    <td>{d.pageViews}</td>
                    <td>{d.orders}</td>
                    <td><strong>{formatPrice(d.revenue)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="tw-grid-2">
        <div className="tw-card">
          <div className="tw-card__head">
            <h2 className="tw-card__title">Top products</h2>
          </div>
          <p className="tw-text-muted">Top-selling product breakdown is on the way. Track bestsellers from the Products page in the meantime.</p>
        </div>
        <div className="tw-card">
          <div className="tw-card__head">
            <h2 className="tw-card__title">Acquisition channels</h2>
          </div>
          <p className="tw-text-muted">Channel attribution comes from your customer's "source" field. Tag customers from their profile to track performance here.</p>
        </div>
      </div>
    </>
  );
}
