import path from 'node:path';
import fs from 'node:fs';
import multer from 'multer';
import { nanoid } from 'nanoid';

const UPLOAD_ROOT = path.resolve('uploads');
const ALLOWED_TYPES = new Set(['cnic', 'business-docs', 'products']);
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const type = req.params.type;
    if (!ALLOWED_TYPES.has(type)) return cb(new Error('Invalid upload type.'));
    const dir = path.join(UPLOAD_ROOT, type);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${nanoid(16)}${ext}`);
  },
});

const HEIC_EXT_RE = /\.hei[cf]$/i;

function fileFilter(_req, file, cb) {
  const mimeOk = /^image\/(png|jpe?g|webp|heic|heif)$|^application\/pdf$/.test(file.mimetype);
  // Some browsers/OSes report HEIC files with a generic mimetype (e.g. application/octet-stream)
  // instead of image/heic — fall back to the file extension so a real HEIC photo isn't rejected
  // just because it was mislabeled.
  const heicByExtension = HEIC_EXT_RE.test(file.originalname || '');
  const ok = mimeOk || heicByExtension;
  cb(ok ? null : new Error('Only PNG, JPEG, WEBP, HEIC/HEIF, or PDF files are allowed.'), ok);
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });
export { ALLOWED_TYPES };
