/**
 * scripts/generate-specs-pdf.mjs
 *
 * Generates /public/downloads/poster-specs.pdf — a printable one-page
 * reference customers can download from the Memory Poster PDP.
 *
 * Uses wkhtmltopdf (system binary, no npm deps required in production).
 * Run: `node scripts/generate-specs-pdf.mjs`
 */
import { writeFile, mkdir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUT_DIR = resolve(ROOT, 'public/downloads');
const OUT_FILE = resolve(OUT_DIR, 'poster-specs.pdf');
const TMP_HTML = resolve(OUT_DIR, '.poster-specs.tmp.html');

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Custom Memory Poster — Size & Upload Specs</title>
<style>
  @page { size: A4; margin: 14mm 14mm 16mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    color: #1a1a1a;
    margin: 0;
    font-size: 11pt;
    line-height: 1.45;
  }
  header {
    border-bottom: 2px solid #8b1a10;
    padding-bottom: 8mm;
    margin-bottom: 6mm;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }
  .brand h1 { font-size: 18pt; margin: 0; color: #8b1a10; font-weight: 800; letter-spacing: -0.01em; }
  .brand p { margin: 0; font-size: 8.5pt; color: #6b6b6b; }
  .pill {
    background: #8b1a10; color: #fff; padding: 2mm 5mm;
    border-radius: 99px; font-size: 9pt; font-weight: 700; letter-spacing: 0.05em;
  }
  h2 {
    font-size: 12pt; color: #8b1a10; margin: 6mm 0 3mm;
    text-transform: uppercase; letter-spacing: 0.06em;
    border-bottom: 1px solid #ebe5d9; padding-bottom: 1.5mm;
  }
  p { margin: 0 0 3mm; }
  .intro { font-size: 10.5pt; color: #3a3a3a; }
  .quick {
    display: block; margin: 4mm 0 0;
  }
  .quick::after { content: ''; display: table; clear: both; }
  .quick div {
    float: left; width: 32%; margin-right: 2%;
    border: 1px solid #ebe5d9; border-radius: 3mm; padding: 3mm;
    background: #fdf6f3; box-sizing: border-box;
  }
  .quick div:last-child { margin-right: 0; }
  .quick div b { display: block; color: #8b1a10; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 1mm; }
  .quick div span { font-size: 10.5pt; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; margin: 3mm 0; font-size: 9.5pt; }
  th, td { text-align: left; padding: 2mm 2.5mm; border-bottom: 1px solid #ebe5d9; }
  th {
    background: rgba(139,26,16,0.06); color: #8b1a10;
    font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.05em;
  }
  td { color: #1a1a1a; }
  tr:last-child td { border-bottom: none; }
  .sizes {
    display: flex; align-items: flex-end; justify-content: center;
    gap: 4mm; padding: 6mm 0 2mm;
  }
  .size {
    background: linear-gradient(180deg, #f6e8e5 0%, #e8c9c0 100%);
    border: 1.2pt solid #8b1a10; border-radius: 2mm;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding: 2mm 1.5mm; color: #1a1a1a;
  }
  .size b { font-size: 9pt; }
  .size span { font-size: 7.5pt; opacity: 0.75; margin-top: 0.5mm; }
  .s-a5 { height: 32mm; min-width: 18mm; }
  .s-a4 { height: 46mm; min-width: 22mm; }
  .s-sq { height: 38mm; width: 38mm; }
  .s-a3 { height: 58mm; min-width: 28mm; }
  ol { padding-left: 5mm; margin: 2mm 0 0; }
  ol li { margin-bottom: 1.5mm; font-size: 10pt; }
  footer {
    margin-top: 8mm; padding-top: 4mm; border-top: 1px solid #ebe5d9;
    font-size: 8pt; color: #6b6b6b; text-align: center;
  }
</style>
</head>
<body>
  <header>
    <div class="brand">
      <h1>the.Wall</h1>
      <p>Custom Memory Poster — Size & Upload Specifications</p>
    </div>
    <span class="pill">300 DPI · 300 GSM</span>
  </header>

  <p class="intro">
    Every Custom Memory Poster is printed on ultra-thick <strong>300 GSM archival matte paper</strong>
    with anti-glare coating, dispatched in 24–48 hours. Use this reference to prep your photo
    or designer template at print-ready quality.
  </p>

  <div class="quick">
    <div><b>File formats</b><span>JPG · PNG · WebP · HEIC</span></div>
    <div><b>Max file size</b><span>25 MB</span></div>
    <div><b>Color profile</b><span>sRGB recommended</span></div>
  </div>

  <h2>Size Reference</h2>
  <div class="sizes">
    <div class="size s-a5"><b>A5</b><span>5.8 × 8.3"</span></div>
    <div class="size s-a4"><b>A4</b><span>8.3 × 11.7"</span></div>
    <div class="size s-sq"><b>Square</b><span>8.5 × 8.5"</span></div>
    <div class="size s-a3"><b>A3</b><span>11.7 × 16.5"</span></div>
  </div>

  <table>
    <thead>
      <tr><th>Size</th><th>Inches</th><th>Pixels @ 300 DPI</th><th>Best for</th></tr>
    </thead>
    <tbody>
      <tr><td><b>A5</b></td><td>5.8 × 8.3"</td><td>1748 × 2480 px</td><td>Desk, shelf, small gift</td></tr>
      <tr><td><b>A4</b></td><td>8.3 × 11.7"</td><td>2480 × 3508 px</td><td>Standard wall poster</td></tr>
      <tr><td><b>Square</b></td><td>8.5 × 8.5"</td><td>2550 × 2550 px</td><td>Instagram prints, frames</td></tr>
      <tr><td><b>A3</b></td><td>11.7 × 16.5"</td><td>3510 × 4950 px</td><td>Statement wall piece</td></tr>
    </tbody>
  </table>

  <h2>How to prep your file</h2>
  <ol>
    <li><b>Format:</b> JPG, PNG, WebP, or HEIC. PNG-24 for templates with a transparent cutout window.</li>
    <li><b>Resolution:</b> Match the pixel dimensions in the table above. Higher = sharper print.</li>
    <li><b>Color profile:</b> sRGB recommended. CMYK files are auto-converted.</li>
    <li><b>File size:</b> Up to 25 MB. For very large files, export at 90–95% JPG quality.</li>
    <li><b>Cropping:</b> Upload the exact final crop — we don't crop for you. Leave a small bleed if your image extends edge-to-edge.</li>
  </ol>

  <footer>
    the.Wall Records · 2thewall.in · Printed to order with care
  </footer>
</body>
</html>`;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(TMP_HTML, html, 'utf8');

  await new Promise((resolve, reject) => {
    const args = [
      '--enable-local-file-access',
      '--quiet',
      '--print-media-type',
      '--no-outline',
      TMP_HTML,
      OUT_FILE,
    ];
    const proc = spawn('wkhtmltopdf', args, { stdio: 'inherit' });
    proc.on('error', reject);
    proc.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`wkhtmltopdf exited with code ${code}`));
    });
  });

  const s = await stat(OUT_FILE);
  await import('node:fs/promises').then(fs => fs.unlink(TMP_HTML).catch(() => {}));
  console.log(`✅ Wrote ${OUT_FILE} (${(s.size / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error('[generate-specs-pdf]', err.message);
  process.exit(1);
});
