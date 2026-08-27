import { useCallback, useEffect, useState } from 'react';
import type { FulfillmentStatus, Order, OrderItem, PaymentStatus } from './types';
import { fetchOrder, fetchOrders, formatPrice, formatRelative, updateOrder } from './api';
import { StatusBadge, Empty, Spinner, Toast } from './StatusBadge';

const PIPELINE: { id: FulfillmentStatus; label: string; tone: 'neutral' | 'warning' | 'info' | 'success' }[] = [
  { id: 'pending', label: 'New', tone: 'warning' },
  { id: 'processing', label: 'Printing', tone: 'info' },
  { id: 'shipped', label: 'Shipped', tone: 'info' },
  { id: 'delivered', label: 'Delivered', tone: 'success' },
];

export function Orders({ initialSearch = '', focusOrderId }: { initialSearch?: string; focusOrderId?: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setSearch(initialSearch);
    setSelected(null);
  }, [initialSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchOrders({ status: statusFilter, search: search.trim() || undefined });
      setOrders(rows);
    } catch (e) {
      setToast({ message: (e as Error).message, tone: 'error' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (!focusOrderId) return;
    fetchOrder(focusOrderId).then((o) => o?.id && setSelected(o));
  }, [focusOrderId]);

  if (selected) {
    return (
      <OrderDetail
        order={selected}
        onBack={() => { setSelected(null); load(); }}
        onToast={(m, t) => setToast({ message: m, tone: t })}
      />
    );
  }

  const counts = PIPELINE.reduce<Record<string, number>>((acc, step) => {
    acc[step.id] = orders.filter((o) => o.fulfillmentStatus === step.id).length;
    return acc;
  }, {});

  return (
    <>
      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
      <div className="tw-page-header">
        <div>
          <h1>Orders</h1>
          <p className="tw-page-header__sub">{orders.length} order{orders.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      <div className="tw-pipeline">
        {PIPELINE.map((step) => (
          <div key={step.id} className="tw-pipeline__step">
            <span className={`tw-pipeline__dot tw-pipeline__dot--${step.tone}`} />
            <span className="tw-pipeline__label">{step.label}</span>
            <span className="tw-pipeline__count">{counts[step.id] ?? 0}</span>
          </div>
        ))}
      </div>

      <div className="tw-card">
        <div className="tw-toolbar">
          <div className="tw-input-group">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              placeholder="Search by order #, customer, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="tw-segments" role="tablist">
            {[
              { id: 'all', label: 'All' },
              ...PIPELINE.map((p) => ({ id: p.id, label: p.label })),
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={statusFilter === s.id}
                className={`tw-segments__btn ${statusFilter === s.id ? 'tw-segments__btn--active' : ''}`}
                onClick={() => setStatusFilter(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="tw-table-loading">
            <Spinner size={20} /> <span>Loading orders…</span>
          </div>
        ) : orders.length === 0 ? (
          <Empty title="No orders found" hint="Try a different search or filter." />
        ) : (
          <div className="tw-table-wrap">
            <table className="tw-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Payment</th>
                  <th>Fulfilment</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="tw-table__row--clickable" onClick={() => setSelected(o)}>
                    <td><strong>#{o.orderNumber}</strong></td>
                    <td>{formatRelative(o.createdAt)}</td>
                    <td>
                      <div>{o.customerName}</div>
                      <div className="tw-text-muted tw-text-sm">{o.customerEmail}</div>
                    </td>
                    <td>{o.items?.length ?? 0}</td>
                    <td><StatusBadge status={o.paymentStatus} /></td>
                    <td><StatusBadge status={o.fulfillmentStatus} /></td>
                    <td><strong>{formatPrice(o.total)}</strong></td>
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

function OrderDetail({
  order,
  onBack,
  onToast,
}: {
  order: Order;
  onBack: () => void;
  onToast: (message: string, tone: 'success' | 'error') => void;
}) {
  const [fulfillment, setFulfillment] = useState<FulfillmentStatus>(order.fulfillmentStatus);
  const [payment, setPayment] = useState<PaymentStatus>(order.paymentStatus);
  const [saving, setSaving] = useState(false);

  const handleAdvance = async (next: FulfillmentStatus) => {
    setSaving(true);
    try {
      await updateOrder(order.id, { fulfillmentStatus: next });
      setFulfillment(next);
      onToast(`Moved to ${next}`, 'success');
    } catch (e) {
      onToast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStatus = async () => {
    setSaving(true);
    try {
      await updateOrder(order.id, { fulfillmentStatus: fulfillment, paymentStatus: payment });
      onToast('Order updated', 'success');
    } catch (e) {
      onToast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="tw-page-header">
        <div>
          <button className="tw-btn tw-btn--ghost tw-btn--sm" onClick={onBack}>← Back to orders</button>
          <h1 style={{ marginTop: '0.5rem' }}>Order #{order.orderNumber}</h1>
          <p className="tw-page-header__sub">{new Date(order.createdAt).toLocaleString()} · {formatPrice(order.total)}</p>
        </div>
      </div>

      <div className="tw-pipeline">
        {PIPELINE.map((step, i) => {
          const currentIdx = PIPELINE.findIndex((p) => p.id === fulfillment);
          const status = currentIdx === -1 ? 'future' : i < currentIdx ? 'done' : i === currentIdx ? 'active' : 'future';
          return (
            <button
              key={step.id}
              type="button"
              disabled={saving || status === 'done'}
              className={`tw-pipeline__step tw-pipeline__step--btn tw-pipeline__step--${status}`}
              onClick={() => handleAdvance(step.id)}
              title={`Mark as ${step.label}`}
            >
              <span className={`tw-pipeline__dot tw-pipeline__dot--${step.tone}`} />
              <span className="tw-pipeline__label">{step.label}</span>
              {status === 'active' && <span className="tw-pipeline__now">Now</span>}
            </button>
          );
        })}
      </div>

      <div className="tw-grid-2">
        <div className="tw-card">
          <div className="tw-card__head">
            <h2 className="tw-card__title">Customer</h2>
          </div>
          <dl className="tw-dl">
            <div><dt>Name</dt><dd>{order.customerName || '—'}</dd></div>
            <div><dt>Email</dt><dd>{order.customerEmail || '—'}</dd></div>
            <div><dt>Phone</dt><dd>{order.customerPhone || '—'}</dd></div>
          </dl>
        </div>

        <div className="tw-card">
          <div className="tw-card__head">
            <h2 className="tw-card__title">Status</h2>
          </div>
          <div className="tw-form__row tw-form__row--2">
            <div className="tw-form__group">
              <label>Fulfilment</label>
              <select value={fulfillment} onChange={(e) => setFulfillment(e.target.value as FulfillmentStatus)}>
                {PIPELINE.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                <option value="unfulfilled">Unfulfilled</option>
                <option value="fulfilled">Fulfilled</option>
              </select>
            </div>
            <div className="tw-form__group">
              <label>Payment</label>
              <select value={payment} onChange={(e) => setPayment(e.target.value as PaymentStatus)}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
          <div className="tw-form__actions">
            <button className="tw-btn tw-btn--primary" onClick={handleSaveStatus} disabled={saving}>
              {saving ? <><Spinner size={14} /> Saving…</> : 'Save status'}
            </button>
          </div>
        </div>
      </div>

      <div className="tw-card">
        <div className="tw-card__head">
          <h2 className="tw-card__title">Items ({order.items?.length ?? 0})</h2>
          <span className="tw-text-muted">Total {formatPrice(order.total)}</span>
        </div>

        {order.items?.length ? (
          <div className="tw-table-wrap">
            <table className="tw-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Size / options</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Print / custom</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <OrderItemRow key={item.id} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title="No items" />
        )}
      </div>
    </>
  );
}

function OrderItemRow({ item }: { item: OrderItem }) {
  const details = item.customDetails || {};
  const customImg = item.customImage || details.previewUrl;
  return (
    <tr>
      <td>
        <div className="tw-table__product">
          {customImg ? (
            <div className="tw-table__thumb tw-table__thumb--custom">
              <img src={customImg} alt="" />
            </div>
          ) : (
            <div className="tw-table__thumb-empty">?</div>
          )}
          <div className="tw-table__product-meta">
            <strong>{item.title}</strong>
            {item.customImage && <StatusBadge status="active" tone="success">Customised</StatusBadge>}
          </div>
        </div>
      </td>
      <td>
        <div><strong>{item.size || 'Standard'}</strong></div>
        {details.format && <div className="tw-text-muted tw-text-sm">Format: {details.format}</div>}
        {details.color && <div className="tw-text-muted tw-text-sm">Color: {details.color}</div>}
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
            className="tw-btn tw-btn--secondary tw-btn--sm"
          >
            ⬇ Download
          </a>
        ) : (
          <span className="tw-text-muted tw-text-sm">Standard print</span>
        )}
      </td>
    </tr>
  );
}
