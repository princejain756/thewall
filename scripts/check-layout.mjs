import { chromium, devices } from 'playwright';
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const dist = join(__dirname, '..', 'dist');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.svg': 'image/svg+xml' };

const server = createServer((req, res) => {
  const path = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  try {
    const file = join(dist, path);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  } catch {
    res.writeHead(404).end();
  }
});

await new Promise((r) => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/`;

const browser = await chromium.launch();
const page = await browser.newPage({ ...devices['iPhone XR'] });
await page.goto(url, { waitUntil: 'networkidle' });

const report = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const selectors = [
    'html', 'body', '.site-shell', 'main', '.nav', '.nav__bar', '.nav__inner',
    '.art-posters', '.art-posters__layout', '.art-posters__carousel-col',
    '.art-posters__carousel-wrap', '.art-posters__carousel',
    '.memories-section', '.section--maroon',
  ];
  return selectors.map((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { sel, missing: true };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      sel,
      left: Math.round(r.left),
      right: Math.round(r.right),
      width: Math.round(r.width),
      vw,
      fillsViewport: Math.abs(r.width - vw) < 2,
      overflowX: cs.overflowX,
      contain: cs.contain,
      maxWidth: cs.maxWidth,
      widthCss: cs.width,
    };
  });
});

console.log(JSON.stringify(report, null, 2));

// Can user scroll horizontally?
const scroll = await page.evaluate(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  bodyScrollWidth: document.body.scrollWidth,
  canScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
}));

console.log('\nSCROLL:', JSON.stringify(scroll, null, 2));

await browser.close();
server.close();
