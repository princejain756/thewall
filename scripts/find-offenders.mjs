import { chromium, devices } from 'playwright';

const url = process.argv[2] || 'https://thewall.adelev8.com';

const browser = await chromium.launch();
const page = await browser.newPage({ ...devices['iPhone XR'] });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });

const vw = await page.evaluate(() => document.documentElement.clientWidth);
const report = await page.evaluate((viewport) => {
  const offenders = [];
  for (const el of document.querySelectorAll('body *')) {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) continue;
    if (rect.right > viewport + 1) {
      offenders.push({
        sel: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
      });
    }
  }
  offenders.sort((a, b) => b.right - a.right);
  return {
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    top: offenders.slice(0, 12),
  };
}, vw);

console.log(JSON.stringify(report, null, 2));
await browser.close();
