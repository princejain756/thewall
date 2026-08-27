import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { nanoid } from 'nanoid';
import { requireAdmin } from '../../../lib/auth';

const UPLOAD_DIR = path.join(process.cwd(), 'public/images/products');
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 10 * 1024 * 1024;

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

export const POST: APIRoute = async ({ request }) => {
  const { authorized } = await requireAdmin(request);
  if (!authorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return new Response(JSON.stringify({ error: 'No file provided' }), { status: 400 });
    }

    const blob = file as Blob;
    const mime = blob.type || 'application/octet-stream';
    const name = 'name' in file && typeof (file as File).name === 'string' ? (file as File).name : '';
    const inferredExt = path.extname(name).toLowerCase();
    const typeFromName =
      inferredExt === '.jpg' || inferredExt === '.jpeg'
        ? 'image/jpeg'
        : inferredExt === '.png'
          ? 'image/png'
          : inferredExt === '.webp'
            ? 'image/webp'
            : inferredExt === '.gif'
              ? 'image/gif'
              : '';
    const type = ALLOWED_TYPES.has(mime) ? mime : typeFromName;

    if (!type || !ALLOWED_TYPES.has(type)) {
      return new Response(JSON.stringify({ error: 'Only JPEG, PNG, WebP, and GIF images are allowed' }), { status: 400 });
    }

    if (blob.size > MAX_BYTES) {
      return new Response(JSON.stringify({ error: 'Image must be under 10 MB' }), { status: 400 });
    }

    const ext = EXT_BY_TYPE[type] || '.jpg';
    const filename = `${nanoid()}${ext}`;

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await blob.arrayBuffer()));

    const url = `/images/products/${filename}`;
    return new Response(JSON.stringify({ url }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[admin/upload]', err);
    return new Response(JSON.stringify({ error: 'Upload failed' }), { status: 500 });
  }
};
