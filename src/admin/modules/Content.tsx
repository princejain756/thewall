const PAGES = [
  {
    title: 'About Us',
    path: '/policies/about',
    description: 'Tell customers the story behind The Wall.',
    icon: '✨',
  },
  {
    title: 'Shipping Policy',
    path: '/policies/shipping',
    description: 'Delivery windows, packaging, and tracking.',
    icon: '🚚',
  },
  {
    title: 'Refund Policy',
    path: '/policies/refund',
    description: 'When and how customers can request a refund.',
    icon: '↩️',
  },
  {
    title: 'FAQ',
    path: '/policies/faq',
    description: 'Common questions about products, prints, and orders.',
    icon: '❓',
  },
  {
    title: 'Terms of Service',
    path: '/policies/terms',
    description: 'Legal terms customers agree to at checkout.',
    icon: '📜',
  },
  {
    title: 'Privacy Policy',
    path: '/policies/privacy',
    description: 'How customer data is collected and used.',
    icon: '🔒',
  },
];

export function Content() {
  return (
    <>
      <div className="tw-page-header">
        <div>
          <h1>Content</h1>
          <p className="tw-page-header__sub">Manage your store's public pages and policies</p>
        </div>
      </div>

      <div className="tw-page-grid">
        {PAGES.map((p) => (
          <a key={p.path} href={p.path} target="_blank" rel="noopener noreferrer" className="tw-content-card">
            <div className="tw-content-card__icon" aria-hidden="true">{p.icon}</div>
            <div className="tw-content-card__body">
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <code className="tw-code">{p.path}</code>
            </div>
            <span className="tw-content-card__arrow" aria-hidden="true">→</span>
          </a>
        ))}
      </div>

      <div className="tw-card" style={{ marginTop: 'var(--space-6)' }}>
        <div className="tw-card__head">
          <h2 className="tw-card__title">Need to edit these?</h2>
        </div>
        <p className="tw-text-muted">
          Page content is defined in <code className="tw-code">src/lib/content/policies.ts</code>.
          Update the text there, run <code className="tw-code">bash scripts/deploy.sh</code>, and the new content is live at the URL above.
        </p>
      </div>
    </>
  );
}
