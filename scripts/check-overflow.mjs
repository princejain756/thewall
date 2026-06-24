import { chromium, devices } from 'playwright';
import { createServer } from 'http';
import { readFileSync, statSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const dist = join(__dirname, '..', 'dist');

const mime = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function serve(req, res) {
  const path = req.url === '/' ? '/index.html' : req.url.split('?')[0];
  const file = join(dist, path);
  try {
    const data = readFileSync(file);
    res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404).end('Not found');
  }
}

const server = createServer(serve);
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;
const url = `http://127.0.0.1:${port}/`;

const browser = await chromium.launch();
const context = await browser.newContext({
  ...devices['iPhone XR'],
});
const page = await context.newPage();
await page.goto(url, { waitUntil: 'networkidle' });

const report = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth;
  const sw = document.documentElement.scrollWidth;
  const offenders = [];

  for (const el of document.querySelectorAll('body *')) {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    const right = rect.right;
    const left = rect.left;
    if (right > vw + 1 || left < -1) {
      const cs = getComputedStyle(el);
      offenders.push({
        tag: el.tagName.toLowerCase(),
        class: el.className?.toString?.().slice(0, 80) || '',
        right: Math.round(right),
        left: Math.round(left),
        width: Math.round(rect.width),
        overflowX: cs.overflowX,
        position: cs.position,
        display: cs.display,
        minWidth: cs.minWidth,
        widthCss: cs.width,
      });
    }
  }

  offenders.sort((a, b) => b.right - a.right);

  return {
    viewport: vw,
    scrollWidth: sw,
    overflow: sw > vw,
    overflowPx: sw - vw,
    topOffenders: offenders.slice(0, 15),
  };
});

console.log(JSON.stringify(report, null, 2));
await browser.close();
server.close();
