import { webkit, chromium, devices } from 'playwright';

const url = process.argv[2] || 'https://the-wall-one.vercel.app';

for (const [name, launcher] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await launcher.launch();
  const page = await browser.newPage({ ...devices['iPhone XR'] });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  const r = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    navBar: Math.round(document.querySelector('.nav__bar')?.getBoundingClientRect().width ?? 0),
    memories: Math.round(document.querySelector('.memories-section')?.getBoundingClientRect().width ?? 0),
    carouselRight: Math.round(document.querySelector('.art-posters__carousel')?.getBoundingClientRect().right ?? 0),
    wrapRight: Math.round(document.querySelector('.art-posters__carousel-wrap')?.getBoundingClientRect().right ?? 0),
  }));
  await page.screenshot({ path: `scripts/screenshot-${name}.png`, fullPage: false });
  console.log(name, JSON.stringify(r));
  await browser.close();
}
