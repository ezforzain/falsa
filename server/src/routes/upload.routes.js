import fs from 'node:fs/promises';
import { Router } from 'express';
import { upload, ALLOWED_TYPES } from '../middleware/upload.js';
import { convertHeicIfNeeded } from '../utils/imageConversion.js';

const router = Router();

// POST /api/uploads/:type  (multipart, field name "file") -> { url }
// :type is one of "business-docs" | "products" | "store-banners" | "avatars". Public — corporate
// signup needs to upload its business document before an account (and therefore a session) exists.
router.post('/:type', (req, res, next) => {
  if (!ALLOWED_TYPES.has(req.params.type)) {
    return res.status(400).json({ message: 'Invalid upload type.' });
  }
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    try {
      const finalFile = await convertHeicIfNeeded(req.file);
      res.status(201).json({ url: `/uploads/${req.params.type}/${finalFile.filename}` });
    } catch (conversionErr) {
      console.error('HEIC conversion failed:', conversionErr);
      await fs.unlink(req.file.path).catch(() => {});
      res.status(422).json({ message: 'Could not process this photo. Please try again or use a JPG/PNG.' });
    }
  });
});

export default router;
