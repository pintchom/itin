import { Hono } from 'hono';
import type { Env } from '../context.ts';
import { BadRequest, NotFound } from '../errors.ts';
import {
  coverVariantSuffixes,
  isValidImageKey,
  readImageVariant,
  storeCoverImage,
} from '../lib/images.ts';
import { requireAuth } from '../middleware/session.ts';

const SUFFIX_SET = new Set(coverVariantSuffixes);
type Suffix = (typeof coverVariantSuffixes)[number];

const isSuffix = (v: string): v is Suffix => SUFFIX_SET.has(v as Suffix);

export const imageRoutes = new Hono<Env>()
  .post('/', requireAuth(), async (c) => {
    const form = await c.req.parseBody();
    const file = form.file;
    if (!(file instanceof File)) throw BadRequest('Missing "file" field');
    if (!file.type.startsWith('image/')) throw BadRequest('File must be an image');
    const buf = Buffer.from(await file.arrayBuffer());
    const { key } = await storeCoverImage(buf);
    return c.json({ key });
  })
  .get('/:key/:suffix', async (c) => {
    const { key, suffix } = c.req.param();
    if (!isValidImageKey(key) || !isSuffix(suffix)) throw NotFound();
    const buf = await readImageVariant(key, suffix);
    if (!buf) throw NotFound();
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        'content-type': 'image/webp',
        'cache-control': 'public, max-age=31536000, immutable',
      },
    });
  });
