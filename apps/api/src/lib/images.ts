import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { env } from '../env.ts';
import { BadRequest } from '../errors.ts';

const MAX_BYTES = 12 * 1024 * 1024;

const COVER_VARIANTS = [
  { suffix: 'lg', width: 1600 },
  { suffix: 'sm', width: 800 },
] as const;

type VariantSuffix = (typeof COVER_VARIANTS)[number]['suffix'];

const ensureDir = async () => {
  await mkdir(env.IMAGE_STORAGE_DIR, { recursive: true });
};

const filePathFor = (key: string, suffix: VariantSuffix) =>
  path.join(env.IMAGE_STORAGE_DIR, `${key}_${suffix}.webp`);

const KEY_RE = /^[a-f0-9]{32,64}$/;

export const isValidImageKey = (key: string) => KEY_RE.test(key);

export async function storeCoverImage(buffer: Buffer): Promise<{ key: string }> {
  if (buffer.byteLength > MAX_BYTES) throw BadRequest('Image too large (max 12MB)');

  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 40);
  await ensureDir();

  await Promise.all(
    COVER_VARIANTS.map(async ({ suffix, width }) => {
      const out = filePathFor(hash, suffix);
      try {
        await stat(out);
        return;
      } catch {}
      const data = await sharp(buffer)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: suffix === 'lg' ? 82 : 78 })
        .toBuffer();
      await writeFile(out, data);
    })
  );

  return { key: hash };
}

export async function readImageVariant(key: string, suffix: VariantSuffix): Promise<Buffer | null> {
  if (!isValidImageKey(key)) return null;
  try {
    return await readFile(filePathFor(key, suffix));
  } catch {
    return null;
  }
}

export const coverVariantSuffixes = COVER_VARIANTS.map((v) => v.suffix);
