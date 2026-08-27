import { useEffect, useState } from 'react';
import type { Customer } from './types';
import { fetchCustomers, formatPrice, formatRelative, saveCustomer } from './api';
import { Empty, Spinner, Toast } from './StatusBadge';

export function Customers({ initialSearch = '' }: { initialSearch?: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (initialSearch) setSearch(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      fetchCustomers()
        .then((rows) => {
          if (!search.trim()) {
            setCustomers(rows);
            return;
          }
          const q = search.trim().toLowerCase();
          setCustomers(
            rows.filter(
              (c) =>
                c.name?.toLowerCase().includes(q) ||
                c.email?.toLowerCase().includes(q) ||
                c.phone?.toLowerCase().includes(q),
            ),
          );
        })
        .catch((e) => setToast({ message: (e as Error).message, tone: 'error' }))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [search]);

  if (selected) {
    return (
      <CustomerDetail
        customer={selected}
        onBack={() => { setSelected(null); }}
        onSaved={() => {
          setSelected(null);
          setSearch((s) => s); // re-run filter
          setToast({ message: 'Customer saved', tone: 'success' });
        }}
        onToast={(m, t) => setToast({ message: m, tone: t })}
      />
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
      <div className="tw-page-header">
        <div>
          <h1>Customers</h1>
          <p className="tw-page-header__sub">{customers.length} customer{customers.length === 1 ? '' : 's'}</p>
        </div>
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
              placeholder="Search by name, email, or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="tw-table-loading">
            <Spinner size={20} /> <span>Loading customers…</span>
          </div>
        ) : customers.length === 0 ? (
          <Empty title="No customers yet" hint="Customers appear here after their first order." />
        ) : (
          <div className="tw-table-wrap">
            <table className="tw-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Source</th>
                  <th>Orders</th>
                  <th>Total spent</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="tw-table__row--clickable" onClick={() => setSelected(c)}>
                    <td>
                      <div className="tw-table__product">
                        <div className="tw-avatar">{c.name?.charAt(0).toUpperCase() || '?'}</div>
                        <div className="tw-table__product-meta">
                          <strong>{c.name || 'Unnamed'}</strong>
                          {c.tags && c.tags.length > 0 && (
                            <div className="tw-tag-row">
                              {c.tags.slice(0, 3).map((t) => <span key={t} className="tw-chip">{t}</span>)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{c.email}</td>
                    <td>{c.phone || <span className="tw-text-muted">—</span>}</td>
                    <td>{c.source ? <span className="tw-chip tw-chip--neutral">{c.source}</span> : <span className="tw-text-muted">—</span>}</td>
                    <td><strong>{c.ordersCount}</strong></td>
                    <td><strong>{formatPrice(c.totalSpent)}</strong></td>
                    <td className="tw-text-muted">{formatRelative(c.createdAt)}</td>
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

function CustomerDetail({
  customer,
  onBack,
  onSaved,
  onToast,
}: {
  customer: Customer;
  onBack: () => void;
  onSaved: () => void;
  onToast: (message: string, tone: 'success' | 'error') => void;
}) {
  const [form, setForm] = useState(customer);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveCustomer({
        id: form.id,
        name: form.name,
        phone: form.phone,
        source: form.source,
        notes: form.notes,
        tags: form.tags || [],
      });
      onSaved();
    } catch (e) {
      onToast((e as Error).message, 'error');
      setSaving(false);
    }
  };

  return (
    <>
      <div className="tw-page-header">
        <div>
          <button className="tw-btn tw-btn--ghost tw-btn--sm" onClick={onBack}>← Back to customers</button>
          <h1 style={{ marginTop: '0.5rem' }}>{customer.name || 'Customer'}</h1>
          <p className="tw-page-header__sub">
            {customer.ordersCount} order{customer.ordersCount === 1 ? '' : 's'} · {formatPrice(customer.totalSpent)} lifetime · joined {formatRelative(customer.createdAt)}
          </p>
        </div>
        <div className="tw-page-header__actions">
          <button className="tw-btn tw-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? <><Spinner size={14} /> Saving…</> : 'Save changes'}
          </button>
        </div>
      </div>

      <div className="tw-grid-2">
        <div className="tw-card tw-form">
          <h2 className="tw-card__title">Contact</h2>
          <div className="tw-form__group">
            <label>Name</label>
            <input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="tw-form__group">
            <label>Email</label>
            <input value={form.email || ''} disabled />
          </div>
          <div className="tw-form__group">
            <label>Phone</label>
            <input value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>

        <div className="tw-card tw-form">
          <h2 className="tw-card__title">Tracking</h2>
          <div className="tw-form__group">
            <label>Acquisition source</label>
            <select value={form.source || ''} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              <option value="">Unknown</option>
              <option value="organic">Organic / Direct</option>
              <option value="instagram">Instagram</option>
              <option value="google">Google</option>
              <option value="referral">Referral</option>
              <option value="repeat">Repeat customer</option>
            </select>
          </div>
          <div className="tw-form__group">
            <label>Tags</label>
            <input
              value={(form.tags || []).join(', ')}
              onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) })}
              placeholder="vip, wedding, bulk-order"
            />
            <p className="tw-form__hint">Comma-separated. Use to mark VIPs, gift buyers, etc.</p>
          </div>
          <div className="tw-form__group">
            <label>Internal notes</label>
            <textarea
              rows={5}
              value={form.notes || ''}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Follow-up notes, preferences, special requests…"
            />
          </div>
        </div>
      </div>
    </>
  );
}
