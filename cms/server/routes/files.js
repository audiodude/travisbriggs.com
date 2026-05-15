import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

function gardenPath() {
  return path.resolve(process.env.GARDEN_PATH || '../garden');
}

function findMarkdownFiles(dir, base = '') {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(path.join(dir, entry.name), rel));
    } else if (entry.name.endsWith('.md')) {
      results.push(rel);
    }
  }
  return results;
}

function fileSummary(filePath, rel) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data } = matter(raw);
  const slug = rel.replace(/\.md$/, '');
  return {
    path: slug,
    title: data.title || slug,
    date: data.date ? data.date.toISOString().split('T')[0] : null,
    updated: data.updated ? data.updated.toISOString().split('T')[0] : null,
    quality: data.quality || null,
    importance: data.importance || null,
  };
}

export function fileRoutes() {
  const router = Router();

  router.get('/files', (req, res) => {
    const root = gardenPath();
    const files = findMarkdownFiles(root);
    const results = files.map((rel) => fileSummary(path.join(root, rel), rel));
    res.json(results);
  });

  router.get('/files/*', (req, res) => {
    const slug = req.params[0];
    const filePath = path.join(gardenPath(), slug + '.md');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(raw);
    res.json({ frontmatter: data, body: content });
  });

  return router;
}
