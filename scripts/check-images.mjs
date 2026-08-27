import fs from 'node:fs';
import path from 'node:path';

const root = '/root/websites/thewall';
const srcDir = path.join(root, 'src');
const pubDir = path.join(root, 'public');

function scan(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      scan(full);
    } else if (/\.(astro|ts|tsx|js|mjs)$/.test(ent.name)) {
      const txt = fs.readFileSync(full, 'utf8');
      const regex = /(["'`])(\/(?:images|logo|qr|hero)[^"'`\s?#]+|\/[A-Za-z0-9_-]+\.(?:png|jpg|jpeg|webp|svg))\1/g;
      let m;
      while ((m = regex.exec(txt)) !== null) {
        const ref = m[2];
        const local = path.join(pubDir, ref.slice(1));
        if (!fs.existsSync(local) && !ref.startsWith('/api/')) {
          console.log('BROKEN:', path.relative(root, full), '->', ref);
        }
      }
    }
  }
}

scan(srcDir);
console.log('Done scanning.');
