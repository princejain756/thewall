import { formatPrice } from './db';

type InvoiceOrder = {
  orderNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  subtotal: number;
  discount: number | null;
  shipping: number | null;
  total: number;
  shippingAddress: string | null;
  createdAt: string;
  items: {
    title: string;
    size: string | null;
    quantity: number;
    price: number;
  }[];
};

function parseAddress(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
  } catch {
    return null;
  }
}

export function renderInvoiceHtml(order: InvoiceOrder): string {
  const addr = parseAddress(order.shippingAddress);
  const date = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const addressBlock = addr
    ? `
      <p>${addr.line1 ?? ''}</p>
      ${addr.line2 ? `<p>${addr.line2}</p>` : ''}
      <p>${[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</p>
    `
    : '<p>—</p>';

  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.title)}${item.size ? `<br><span class="muted">${escapeHtml(item.size)}</span>` : ''}</td>
        <td class="num">${item.quantity}</td>
        <td class="num">${formatPrice(item.price)}</td>
        <td class="num">${formatPrice(item.price * item.quantity)}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${escapeHtml(order.orderNumber)} — The Wall Records</title>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&family=Playfair+Display:wght@500;600&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Montserrat', system-ui, sans-serif;
      background: #f5f1e6;
      color: #8b1a10;
      padding: 2rem;
      line-height: 1.5;
    }
    .invoice {
      max-width: 720px;
      margin: 0 auto;
      background: #fff;
      border: 1px solid #ebe5d9;
      padding: 2.5rem;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #8b1a10;
      margin-bottom: 2rem;
    }
    .brand {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.75rem;
      font-weight: 600;
    }
    .brand span { display: block; font-family: 'Montserrat', sans-serif; font-size: 0.65rem; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 600; margin-top: 0.25rem; opacity: 0.7; }
    .meta { text-align: right; font-size: 0.85rem; }
    .meta strong { display: block; font-size: 1.1rem; margin-bottom: 0.25rem; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
    .block h3 { font-size: 0.65rem; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 0.5rem; opacity: 0.65; }
    .block p { font-size: 0.9rem; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
    th, td { padding: 0.75rem 0.5rem; text-align: left; border-bottom: 1px solid #ebe5d9; font-size: 0.85rem; }
    th { font-size: 0.65rem; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; }
    .num { text-align: right; white-space: nowrap; }
    .muted { font-size: 0.75rem; opacity: 0.65; }
    .totals { margin-left: auto; width: min(280px, 100%); }
    .totals div { display: flex; justify-content: space-between; padding: 0.35rem 0; font-size: 0.85rem; }
    .totals .grand { font-weight: 700; font-size: 1rem; border-top: 2px solid #8b1a10; margin-top: 0.5rem; padding-top: 0.75rem; }
    .footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #ebe5d9; font-size: 0.75rem; opacity: 0.7; text-align: center; }
    .actions { text-align: center; margin-bottom: 1.5rem; }
    .btn {
      display: inline-block;
      background: #8b1a10;
      color: #f5f1e6;
      border: none;
      padding: 0.75rem 1.5rem;
      font-family: inherit;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      cursor: pointer;
    }
    @media print {
      body { background: #fff; padding: 0; }
      .actions { display: none; }
      .invoice { border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="actions">
    <button class="btn" onclick="window.print()">Download / Print Invoice</button>
  </div>
  <div class="invoice">
    <div class="header">
      <div class="brand">the.Wall<span>The Wall Records</span></div>
      <div class="meta">
        <strong>INVOICE</strong>
        <div>${escapeHtml(order.orderNumber)}</div>
        <div>${date}</div>
      </div>
    </div>

    <div class="grid">
      <div class="block">
        <h3>Bill To</h3>
        <p><strong>${escapeHtml(order.customerName ?? '')}</strong></p>
        <p>${escapeHtml(order.customerEmail ?? '')}</p>
        ${order.customerPhone ? `<p>${escapeHtml(order.customerPhone)}</p>` : ''}
      </div>
      <div class="block">
        <h3>Ship To</h3>
        ${addressBlock}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="num">Qty</th>
          <th class="num">Unit</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <div class="totals">
      <div><span>Subtotal</span><span>${formatPrice(order.subtotal)}</span></div>
      ${order.discount ? `<div><span>Discount</span><span>−${formatPrice(order.discount)}</span></div>` : ''}
      <div><span>Shipping</span><span>${order.shipping ? formatPrice(order.shipping) : 'Free'}</span></div>
      <div class="grand"><span>Total</span><span>${formatPrice(order.total)}</span></div>
    </div>

    <div class="footer">
      Payment: ${escapeHtml(order.paymentStatus)} · Status: ${escapeHtml(order.status)} · Fulfillment: ${escapeHtml(order.fulfillmentStatus)}<br>
      Thank you for shopping with The Wall Records · 2thewall.in
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
