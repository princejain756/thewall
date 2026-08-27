import { useEffect, useState } from 'react';
import type { Discount, DiscountType } from './types';
import { fetchDiscounts, formatPrice, saveDiscount } from './api';
import { StatusBadge, Empty, Spinner, Toast } from './StatusBadge';

const TYPE_LABELS: Record<DiscountType, string> = {
  percentage: 'Percentage off',
  fixed: 'Fixed amount off',
  bogo: 'Buy X Get Y',
  shipping: 'Free shipping',
};

function newDiscount(): Discount {
  return {
    id: '',
    title: '',
    code: '',
    type: 'percentage',
    value: 10,
    minOrder: 0,
    usageLimit: null,
    active: true,
    automatic: false,
  };
}

function formatValue(d: Discount): string {
  if (d.type === 'percentage') return `${d.value}% off`;
  if (d.type === 'fixed') return `${formatPrice(d.value)} off`;
  if (d.type === 'bogo') return `Buy X Get Y · ${d.value}%`;
  if (d.type === 'shipping') return 'Free shipping';
  return '—';
}

export function Discounts({ initialSearch = '' }: { initialSearch?: string }) {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchDiscounts()
      .then(setDiscounts)
      .catch((e) => setToast({ message: (e as Error).message, tone: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  if (editing) {
    return (
      <DiscountEditor
        discount={editing}
        onSave={async () => {
          setEditing(null);
          setLoading(true);
          try {
            const rows = await fetchDiscounts();
            setDiscounts(rows);
            setToast({ message: 'Discount saved', tone: 'success' });
          } finally {
            setLoading(false);
          }
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  const filtered = search.trim()
    ? discounts.filter(
        (d) =>
          d.title?.toLowerCase().includes(search.toLowerCase()) ||
          d.code?.toLowerCase().includes(search.toLowerCase()),
      )
    : discounts;

  return (
    <>
      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
      <div className="tw-page-header">
        <div>
          <h1>Discounts</h1>
          <p className="tw-page-header__sub">{filtered.length} discount{filtered.length === 1 ? '' : 's'}</p>
        </div>
        <div className="tw-page-header__actions">
          <button className="tw-btn tw-btn--primary" onClick={() => setEditing(newDiscount())}>
            <span aria-hidden="true">＋</span> Create discount
          </button>
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
              placeholder="Search by title or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="tw-table-loading">
            <Spinner size={20} /> <span>Loading discounts…</span>
          </div>
        ) : filtered.length === 0 ? (
          <Empty title="No discounts" hint="Create a code or auto-apply offer to boost sales." />
        ) : (
          <div className="tw-table-wrap">
            <table className="tw-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Min. order</th>
                  <th>Auto-apply</th>
                  <th>Status</th>
                  <th className="tw-table__actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.id} className="tw-table__row--clickable" onClick={() => setEditing(d)}>
                    <td><strong>{d.title}</strong></td>
                    <td>{d.code ? <code className="tw-code">{d.code}</code> : <span className="tw-text-muted">—</span>}</td>
                    <td>{TYPE_LABELS[d.type]}</td>
                    <td>{formatValue(d)}</td>
                    <td>{d.minOrder ? formatPrice(d.minOrder) : <span className="tw-text-muted">—</span>}</td>
                    <td>{d.automatic ? <StatusBadge status="active">Auto</StatusBadge> : <span className="tw-text-muted">—</span>}</td>
                    <td><StatusBadge status={d.active ? 'active' : 'draft'}>{d.active ? 'Active' : 'Inactive'}</StatusBadge></td>
                    <td className="tw-table__actions-col" onClick={(e) => e.stopPropagation()}>
                      <button className="tw-btn tw-btn--ghost tw-btn--sm" onClick={() => setEditing(d)}>Edit</button>
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

function DiscountEditor({
  discount,
  onSave,
  onCancel,
}: {
  discount: Discount;
  onSave: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(discount);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title?.trim()) {
      alert('Please add a title.');
      return;
    }
    setSaving(true);
    try {
      await saveDiscount(form);
      await onSave();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="tw-page-header">
        <div>
          <button className="tw-btn tw-btn--ghost tw-btn--sm" onClick={onCancel}>← Back to discounts</button>
          <h1 style={{ marginTop: '0.5rem' }}>{form.id ? 'Edit discount' : 'New discount'}</h1>
          <p className="tw-page-header__sub">{TYPE_LABELS[form.type]} · {form.code || 'no code'}</p>
        </div>
        <div className="tw-page-header__actions">
          <button className="tw-btn tw-btn--ghost" onClick={onCancel}>Cancel</button>
          <button className="tw-btn tw-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? <><Spinner size={14} /> Saving…</> : 'Save discount'}
          </button>
        </div>
      </div>

      <div className="tw-grid-2">
        <div className="tw-card tw-form">
          <h2 className="tw-card__title">Discount details</h2>
          <div className="tw-form__group">
            <label>Title <span className="tw-req">*</span></label>
            <input
              value={form.title || ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Summer sale"
            />
          </div>
          <div className="tw-form__group">
            <label>Discount code (optional)</label>
            <input
              value={form.code || ''}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="SUMMER20"
            />
            <p className="tw-form__hint">Leave blank to auto-apply this discount at checkout.</p>
          </div>
          <div className="tw-form__row tw-form__row--2">
            <div className="tw-form__group">
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as DiscountType })}>
                <option value="percentage">Percentage off</option>
                <option value="fixed">Fixed amount off</option>
                <option value="bogo">Buy X Get Y</option>
                <option value="shipping">Free shipping</option>
              </select>
            </div>
            <div className="tw-form__group">
              <label>{form.type === 'fixed' ? 'Amount (paise)' : 'Value'}</label>
              <input
                type="number"
                min="0"
                value={form.value ?? 0}
                onChange={(e) => setForm({ ...form, value: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
          </div>
        </div>

        <div className="tw-card tw-form">
          <h2 className="tw-card__title">Rules</h2>
          <div className="tw-form__row tw-form__row--2">
            <div className="tw-form__group">
              <label>Minimum order (₹)</label>
              <input
                type="number"
                min="0"
                value={form.minOrder ?? 0}
                onChange={(e) => setForm({ ...form, minOrder: parseInt(e.target.value, 10) || 0 })}
              />
            </div>
            <div className="tw-form__group">
              <label>Usage limit</label>
              <input
                type="number"
                min="0"
                value={form.usageLimit ?? ''}
                placeholder="Unlimited"
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value ? parseInt(e.target.value, 10) : null })}
              />
            </div>
          </div>
          <label className="tw-toggle">
            <input
              type="checkbox"
              checked={!!form.automatic}
              onChange={(e) => setForm({ ...form, automatic: e.target.checked })}
            />
            <span className="tw-toggle__switch" />
            <span className="tw-toggle__label">
              <strong>Auto-apply at checkout</strong>
              <small>Apply this discount automatically when conditions match</small>
            </span>
          </label>
          <label className="tw-toggle">
            <input
              type="checkbox"
              checked={form.active !== false}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            <span className="tw-toggle__switch" />
            <span className="tw-toggle__label">
              <strong>Active</strong>
              <small>Make this discount available to customers</small>
            </span>
          </label>
        </div>
      </div>
    </>
  );
}
