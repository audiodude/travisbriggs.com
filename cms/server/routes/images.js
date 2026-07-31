import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

function imagesPath() {
  return path.resolve(process.env.IMAGES_PATH || '../assets/img/garden');
}

function slugifyBase(name) {
  const base = path.basename(name, path.extname(name));
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'image';
}

export function imageRoutes() {
  const router = Router();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 },
  });

  router.post('/images', upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const ext = EXT_BY_MIME[req.file.mimetype];
    if (!ext) {
      return res
        .status(415)
        .json({ error: `Unsupported type: ${req.file.mimetype}` });
    }
    const dir = imagesPath();
    fs.mkdirSync(dir, { recursive: true });
    const base = slugifyBase(req.file.originalname || 'image');
    let name = base + ext;
    for (let i = 2; fs.existsSync(path.join(dir, name)); i++) {
      name = `${base}-${i}${ext}`;
    }
    fs.writeFileSync(path.join(dir, name), req.file.buffer);
    res.status(201).json({ path: `/assets/img/garden/${name}` });
  });

  return router;
}
