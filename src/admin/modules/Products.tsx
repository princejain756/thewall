import { useCallback, useEffect, useRef, useState } from 'react';
import type { Collection, Product, ProductStatus, ProductType } from './types';
import {
  deleteProduct,
  fetchCollections,
  fetchProduct,
  fetchProducts,
  formatPrice,
  normalizeImages,
  productToForm,
  saveProduct,
  uploadFiles,
} from './api';
import { StatusBadge, Empty, Toast, Spinner } from './StatusBadge';

const SIZE_OPTIONS = ['A4', 'A5', 'A3', 'Square', '13x19"'];

function newProductForm() {
  return {
    title: '',
    slug: '',
    description: '',
    status: 'draft' as ProductStatus,
    images: [] as string[],
    collectionId: null as string | null,
    collectionName: null as string | null,
    productType: 'single' as ProductType,
    tags: [] as string[],
    featured: false,
    onSale: false,
    variants: [{ size: 'A4', price: 79, compareAtPrice: 149, inventory: 999 }],
  };
}

export function ProductsList({ initialSearch = '', focusProductId }: { initialSearch?: string; focusProductId?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; tone: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    fetchCollections().then(setCollections).catch(() => {});
  }, []);

  useEffect(() => {
    setSearch(initialSearch);
  }, [initialSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchProducts({ status: statusFilter, search: search.trim() || undefined });
      setProducts(rows);
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
    if (!focusProductId) return;
    fetchProduct(focusProductId)
      .then((p) => p?.id && setEditing(p))
      .catch(() => {});
  }, [focusProductId]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;
    try {
      await deleteProduct(id);
      setToast({ message: 'Product deleted', tone: 'success' });
      load();
    } catch (e) {
      setToast({ message: (e as Error).message, tone: 'error' });
    }
  };

  if (editing) {
    return (
      <ProductEditor
        product={editing}
        collections={collections}
        onSave={async () => {
          setEditing(null);
          await load();
          setToast({ message: 'Product saved', tone: 'success' });
        }}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
      <div className="tw-page-header">
        <div>
          <h1>Products</h1>
          <p className="tw-page-header__sub">{products.length} product{products.length === 1 ? '' : 's'}</p>
        </div>
        <div className="tw-page-header__actions">
          <button
            className="tw-btn tw-btn--primary"
            onClick={() => setEditing(newProductForm())}
          >
            <span aria-hidden="true">＋</span> Add product
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
              placeholder="Search by title or slug…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="tw-segments" role="tablist" aria-label="Filter by status">
            {['all', 'active', 'draft', 'archived'].map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={statusFilter === s}
                className={`tw-segments__btn ${statusFilter === s ? 'tw-segments__btn--active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="tw-table-loading">
            <Spinner size={20} /> <span>Loading products…</span>
          </div>
        ) : products.length === 0 ? (
          <Empty title="No products found" hint="Try a different search or status filter." />
        ) : (
          <div className="tw-table-wrap">
            <table className="tw-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Status</th>
                  <th>Collection</th>
                  <th>Price</th>
                  <th className="tw-table__actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const imgs = normalizeImages(p.images);
                  return (
                    <tr key={p.id} className="tw-table__row--clickable" onClick={() => setEditing(p)}>
                      <td>
                        <div className="tw-table__product">
                          <div className="tw-table__thumb">
                            {imgs[0] ? <img src={imgs[0]} alt="" /> : <div className="tw-table__thumb-empty">?</div>}
                          </div>
                          <div className="tw-table__product-meta">
                            <strong>{p.title || 'Untitled'}</strong>
                            <span className="tw-text-muted">{p.slug || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td><StatusBadge status={p.status} /></td>
                      <td>{p.collectionName || <span className="tw-text-muted">Uncategorised</span>}</td>
                      <td>{p.minPrice != null ? formatPrice(p.minPrice) : '—'}</td>
                      <td className="tw-table__actions-col" onClick={(e) => e.stopPropagation()}>
                        <button className="tw-btn tw-btn--ghost tw-btn--sm" onClick={() => setEditing(p)}>
                          Edit
                        </button>
                        <button
                          className="tw-btn tw-btn--danger-ghost tw-btn--sm"
                          onClick={() => handleDelete(p.id, p.title)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

function ProductEditor({
  product,
  collections,
  onSave,
  onCancel,
}: {
  product: any;
  collections: Collection[];
  onSave: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(() => productToForm(product));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'media' | 'variants'>('details');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const images: string[] = form.images || [];

  // Auto-generate slug from title for new products.
  useEffect(() => {
    if (form.id) return;
    if (!form.slug) {
      setForm((f: any) => ({ ...f, slug: slugify(f.title || '') }));
    }
  }, [form.title, form.id, form.slug]);

  const handleCollectionChange = (id: string) => {
    const col = collections.find((c) => c.id === id);
    setForm({ ...form, collectionId: id || null, collectionName: col?.name || null });
  };

  const handleSave = async () => {
    if (!form.title?.trim()) {
      alert('Please add a title before saving.');
      return;
    }
    setSaving(true);
    try {
      await saveProduct(form);
      await onSave();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setUploading(true);
    setUploadError('');
    try {
      const urls = await uploadFiles(files);
      setForm({ ...form, images: [...images, ...urls] });
    } catch (e) {
      setUploadError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const moveImage = (index: number, dir: -1 | 1) => {
    const next = [...images];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setForm({ ...form, images: next });
  };

  const removeImage = (index: number) => {
    setForm({ ...form, images: images.filter((_, i) => i !== index) });
  };

  const addImageUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    setForm({ ...form, images: [...images, url] });
    setUrlInput('');
  };

  return (
    <>
      <div className="tw-page-header">
        <div>
          <button className="tw-btn tw-btn--ghost tw-btn--sm" onClick={onCancel}>← Back to products</button>
          <h1 style={{ marginTop: '0.5rem' }}>{form.id ? 'Edit product' : 'New product'}</h1>
          <p className="tw-page-header__sub">{form.title || 'Untitled'} · {form.slug || '—'}</p>
        </div>
        <div className="tw-page-header__actions">
          <button className="tw-btn tw-btn--ghost" onClick={onCancel}>Cancel</button>
          <button className="tw-btn tw-btn--primary" onClick={handleSave} disabled={saving || uploading}>
            {saving ? <><Spinner size={14} /> Saving…</> : 'Save product'}
          </button>
        </div>
      </div>

      <div className="tw-tabs">
        {(['details', 'media', 'variants'] as const).map((t) => (
          <button
            key={t}
            className={`tw-tabs__btn ${activeTab === t ? 'tw-tabs__btn--active' : ''}`}
            onClick={() => setActiveTab(t)}
            type="button"
          >
            {t === 'details' ? 'Details' : t === 'media' ? `Media (${images.length})` : `Variants (${(form.variants || []).length})`}
          </button>
        ))}
      </div>

      {activeTab === 'details' && (
        <div className="tw-card tw-form">
          <div className="tw-form__row">
            <div className="tw-form__group">
              <label htmlFor="p-title">Title <span className="tw-req">*</span></label>
              <input
                id="p-title"
                value={form.title || ''}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Aesthetic sunset poster"
              />
            </div>
            <div className="tw-form__group">
              <label htmlFor="p-slug">URL slug</label>
              <input
                id="p-slug"
                value={form.slug || ''}
                onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                placeholder="aesthetic-sunset-poster"
              />
            </div>
          </div>

          <div className="tw-form__group">
            <label htmlFor="p-desc">Description</label>
            <textarea
              id="p-desc"
              rows={6}
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What makes this poster special? Print details, paper, sizes…"
            />
          </div>

          <div className="tw-form__row tw-form__row--3">
            <div className="tw-form__group">
              <label htmlFor="p-status">Status</label>
              <select id="p-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProductStatus })}>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="tw-form__group">
              <label htmlFor="p-collection">Collection</label>
              <select id="p-collection" value={form.collectionId || ''} onChange={(e) => handleCollectionChange(e.target.value)}>
                <option value="">Uncategorised</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="tw-form__group">
              <label htmlFor="p-type">Product type</label>
              <select
                id="p-type"
                value={form.productType || 'single'}
                onChange={(e) => setForm({ ...form, productType: e.target.value as ProductType })}
              >
                <option value="single">Single poster</option>
                <option value="bundle">Bundle / set</option>
                <option value="custom">Custom / memory</option>
              </select>
            </div>
          </div>

          <div className="tw-form__group">
            <label htmlFor="p-tags">Tags</label>
            <input
              id="p-tags"
              value={(form.tags || []).join(', ')}
              onChange={(e) =>
                setForm({ ...form, tags: e.target.value.split(',').map((t: string) => t.trim()).filter(Boolean) })
              }
              placeholder="wedding, anniversary, gift"
            />
            <p className="tw-form__hint">Comma-separated. Used for filters and recommendations.</p>
          </div>

          <div className="tw-form__row tw-form__row--2">
            <label className="tw-toggle">
              <input
                type="checkbox"
                checked={!!form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
              <span className="tw-toggle__switch" />
              <span className="tw-toggle__label">
                <strong>Featured</strong>
                <small>Show on the homepage and in featured slots</small>
              </span>
            </label>
            <label className="tw-toggle">
              <input
                type="checkbox"
                checked={!!form.onSale}
                onChange={(e) => setForm({ ...form, onSale: e.target.checked })}
              />
              <span className="tw-toggle__switch" />
              <span className="tw-toggle__label">
                <strong>On sale</strong>
                <small>Show the compare-at price and Sale badge</small>
              </span>
            </label>
          </div>
        </div>
      )}

      {activeTab === 'media' && (
        <div className="tw-card">
          <div className="tw-card__head">
            <div>
              <h2 className="tw-card__title">Product images</h2>
              <p className="tw-card__sub">First image is the main PDP photo. Drag to reorder.</p>
            </div>
          </div>

          {images.length === 0 ? (
            <div
              className={`tw-dropzone ${dragOver ? 'tw-dropzone--over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(Array.from(e.dataTransfer.files));
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="tw-dropzone__icon" aria-hidden="true">📁</div>
              <h3>Drop images here</h3>
              <p>or click to browse — JPG, PNG, WebP up to 25 MB each</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                hidden
                onChange={(e) => handleFiles(Array.from(e.target.files || []))}
              />
            </div>
          ) : (
            <>
              <div className="tw-media-grid">
                {images.map((src, i) => (
                  <div key={`${src}-${i}`} className="tw-media-tile">
                    <img src={src} alt="" />
                    {i === 0 && <span className="tw-media-tile__main">Main</span>}
                    <div className="tw-media-tile__actions">
                      <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
                      <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} aria-label="Move down">↓</button>
                      <button type="button" onClick={() => removeImage(i)} aria-label="Remove" className="tw-media-tile__remove">×</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="tw-media-add">
                <button
                  className="tw-btn tw-btn--secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  type="button"
                >
                  {uploading ? <><Spinner size={14} /> Uploading…</> : '＋ Add more images'}
                </button>
                <div className="tw-media-add__url">
                  <input
                    type="text"
                    placeholder="Or paste image URL…"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImageUrl(); } }}
                  />
                  <button className="tw-btn tw-btn--secondary" type="button" onClick={addImageUrl}>Add URL</button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  hidden
                  onChange={(e) => handleFiles(Array.from(e.target.files || []))}
                />
              </div>
            </>
          )}

          {uploadError && <p className="tw-error">{uploadError}</p>}
        </div>
      )}

      {activeTab === 'variants' && (
        <div className="tw-card">
          <div className="tw-card__head">
            <div>
              <h2 className="tw-card__title">Size variants & pricing</h2>
              <p className="tw-card__sub">Each variant can have its own price, compare-at price, and inventory.</p>
            </div>
            <button
              className="tw-btn tw-btn--secondary tw-btn--sm"
              type="button"
              onClick={() =>
                setForm({
                  ...form,
                  variants: [...(form.variants || []), { size: 'A4', price: 79, compareAtPrice: 149, inventory: 999 }],
                })
              }
            >
              ＋ Add variant
            </button>
          </div>

          {(form.variants || []).length === 0 ? (
            <Empty title="No variants" hint="Add a size variant to start selling this product." />
          ) : (
            <div className="tw-variants">
              {(form.variants || []).map((v: any, i: number) => (
                <div key={i} className="tw-variant-row">
                  <div className="tw-variant-row__size">
                    <label>Size</label>
                    <select
                      value={v.size}
                      onChange={(e) => {
                        const variants = [...form.variants];
                        variants[i] = { ...v, size: e.target.value };
                        setForm({ ...form, variants });
                      }}
                    >
                      {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="tw-variant-row__field">
                    <label>Sale price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={v.price}
                      onChange={(e) => {
                        const variants = [...form.variants];
                        variants[i] = { ...v, price: parseFloat(e.target.value) || 0 };
                        setForm({ ...form, variants });
                      }}
                    />
                  </div>
                  <div className="tw-variant-row__field">
                    <label>Compare-at (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={v.compareAtPrice ?? ''}
                      placeholder="Original price"
                      onChange={(e) => {
                        const variants = [...form.variants];
                        variants[i] = { ...v, compareAtPrice: e.target.value ? parseFloat(e.target.value) : null };
                        setForm({ ...form, variants });
                      }}
                    />
                  </div>
                  <div className="tw-variant-row__field">
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
                  <button
                    className="tw-btn tw-btn--danger-ghost tw-btn--sm"
                    type="button"
                    onClick={() => {
                      const variants = (form.variants || []).filter((_: any, idx: number) => idx !== i);
                      setForm({ ...form, variants });
                    }}
                    aria-label="Remove variant"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="tw-page-footer">
        <button className="tw-btn tw-btn--ghost" onClick={onCancel}>Cancel</button>
        <button className="tw-btn tw-btn--primary" onClick={handleSave} disabled={saving || uploading}>
          {saving ? <><Spinner size={14} /> Saving…</> : 'Save product'}
        </button>
      </div>
    </>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}
