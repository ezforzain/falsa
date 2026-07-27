import path from 'node:path';
import fs from 'node:fs/promises';
import convert from 'heic-convert';

const HEIC_EXT_RE = /\.hei[cf]$/i;

export function isHeicFile(file) {
  if (!file) return false;
  if (file.mimetype === 'image/heic' || file.mimetype === 'image/heif') return true;
  return HEIC_EXT_RE.test(file.originalname || '');
}

// multer already saved the upload to disk as-is (fast, no buffering large files in memory) —
// this runs after that, swapping a HEIC/HEIF file for a JPEG, since no browser other than Safari
// can render HEIC in an <img> tag. The client already converts HEIC before it ever uploads (see
// src/lib/heic.js), so this is mainly a safety net for any other caller of this API that skips
// that step — but it means a HEIC photo is always displayable everywhere no matter who sent it.
export async function convertHeicIfNeeded(file) {
  if (!isHeicFile(file)) return file;

  const inputBuffer = await fs.readFile(file.path);
  const outputBuffer = await convert({ buffer: inputBuffer, format: 'JPEG', quality: 0.92 });
  const jpegPath = file.path.replace(/\.[^./\\]+$/, '') + '.jpg';
  await fs.writeFile(jpegPath, outputBuffer);
  await fs.unlink(file.path);

  return {
    ...file,
    path: jpegPath,
    filename: path.basename(jpegPath),
    mimetype: 'image/jpeg',
  };
}
