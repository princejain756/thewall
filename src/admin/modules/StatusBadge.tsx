import type { ReactNode } from 'react';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';

const TONE_MAP: Record<string, Tone> = {
  paid: 'success',
  delivered: 'success',
  fulfilled: 'success',
  active: 'success',
  processing: 'info',
  shipped: 'info',
  pending: 'warning',
  unfulfilled: 'warning',
  draft: 'neutral',
  archived: 'neutral',
  cancelled: 'danger',
  refunded: 'danger',
  failed: 'danger',
};

export function StatusBadge({ status, tone, children }: { status: string; tone?: Tone; children?: ReactNode }) {
  const resolved = tone ?? TONE_MAP[status] ?? 'neutral';
  const label = children ?? status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`tw-badge tw-badge--${resolved}`}>{label}</span>;
}

export function Dot({ tone = 'neutral' }: { tone?: Tone }) {
  return <span className={`tw-dot tw-dot--${tone}`} aria-hidden="true" />;
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="tw-empty">
      <div className="tw-empty__icon" aria-hidden="true">∅</div>
      <h3 className="tw-empty__title">{title}</h3>
      {hint && <p className="tw-empty__hint">{hint}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="tw-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="tw-skeleton__row">
          <div className="tw-skeleton__bar" style={{ width: `${30 + Math.random() * 50}%` }} />
          <div className="tw-skeleton__bar" style={{ width: `${20 + Math.random() * 40}%` }} />
        </div>
      ))}
    </div>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className="tw-spinner"
      style={{ width: size, height: size, borderWidth: Math.max(2, Math.round(size / 8)) }}
      aria-hidden="true"
    />
  );
}

export function Toast({
  message,
  tone = 'info',
  onClose,
}: {
  message: string;
  tone?: 'success' | 'error' | 'info';
  onClose?: () => void;
}) {
  return (
    <div className={`tw-toast tw-toast--${tone}`} role="status">
      <span>{message}</span>
      {onClose && (
        <button type="button" className="tw-toast__close" onClick={onClose} aria-label="Dismiss">
          ×
        </button>
      )}
    </div>
  );
}
