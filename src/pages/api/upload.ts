import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { nanoid } from 'nanoid';

const UPLOAD_DIR = path.join(process.cwd(), 'public/images/custom-uploads');
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']);
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB max upload for high-res photos

const EXT_BY_TYPE: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/heic': '.heic',
  'image/heif': '.heif',
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') || formData.get('image');

    if (!file || typeof file === 'string') {
      return new Response(JSON.stringify({ error: 'No photo provided for upload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
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
              : inferredExt === '.heic'
                ? 'image/heic'
                : '';
    const type = ALLOWED_TYPES.has(mime) ? mime : typeFromName;

    if (!type || !ALLOWED_TYPES.has(type)) {
      return new Response(
        JSON.stringify({ error: 'Please upload a JPEG, PNG, WebP or HEIC image file' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (blob.size > MAX_BYTES) {
      return new Response(
        JSON.stringify({ error: 'Photo must be under 25 MB for high-resolution printing' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const ext = EXT_BY_TYPE[type] || inferredExt || '.jpg';
    const filename = `custom-${nanoid()}${ext}`;

    await fs.mkdir(UPLOAD_DIR, { recursive: true, mode: 0o755 });
    await fs.writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await blob.arrayBuffer()), { mode: 0o644 });

    const url = `/images/custom-uploads/${filename}`;
    return new Response(
      JSON.stringify({
        url,
        filename,
        size: blob.size,
        mime: type,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (err) {
    console.error('[upload]', err);
    return new Response(JSON.stringify({ error: 'Photo upload failed. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
