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

function fileFilter(_req, file, cb) {
  const ok = /^image\/(png|jpe?g|webp)$|^application\/pdf$/.test(file.mimetype);
  cb(ok ? null : new Error('Only PNG, JPEG, WEBP, or PDF files are allowed.'), ok);
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_FILE_SIZE } });
export { ALLOWED_TYPES };
