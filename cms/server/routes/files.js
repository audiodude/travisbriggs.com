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

function formatDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val).split('T')[0];
}

const DATE_KEYS = ['date', 'updated'];
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeFrontmatter(fm) {
  const out = { ...fm };
  for (const key of DATE_KEYS) {
    const val = out[key];
    if (typeof val !== 'string') continue;
    // Bare YYYY-MM-DD: pin to UTC midnight. Full ISO timestamps (what the
    // frontend sends back after a JSON round-trip of a parsed Date) parse
    // directly. Either way we store a Date so js-yaml emits an unquoted
    // timestamp that Eleventy parses as a Date, not a String.
    const parsed = new Date(ISO_DATE_RE.test(val) ? val + 'T00:00:00Z' : val);
    if (!Number.isNaN(parsed.getTime())) {
      out[key] = parsed;
    }
  }
  return out;
}

function fileSummary(filePath, rel) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data } = matter(raw);
  const slug = rel.replace(/\.md$/, '');
  return {
    path: slug,
    title: data.title || slug,
    date: formatDate(data.date),
    updated: formatDate(data.updated),
    quality: data.quality || null,
    importance: data.importance || null,
  };
}

const wikilinkRegExp = /\[\[\s?([^\[\]\|\n\r]+)(\|[^\[\]\|\n\r]+)?\s?\]\]/g;

function createStubsForWikilinks(body) {
  const root = gardenPath();
  const created = [];
  for (const match of body.matchAll(wikilinkRegExp)) {
    const slug = match[1].replace(/\.(md|markdown)\s?$/i, '').trim();
    const filePath = path.join(root, slug + '.md');
    if (fs.existsSync(filePath)) continue;
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const today = new Date().toISOString().split('T')[0];
    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const stub = matter.stringify('', { title, date: today, quality: 'Stub', importance: 'Mid' });
    fs.writeFileSync(filePath, stub);
    created.push(slug);
  }
  return created;
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

  router.put('/files/*', (req, res) => {
    const slug = req.params[0];
    const filePath = path.join(gardenPath(), slug + '.md');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }
    const { frontmatter, body } = req.body;
    const output = matter.stringify(body || '', normalizeFrontmatter(frontmatter));
    fs.writeFileSync(filePath, output);
    const stubs = createStubsForWikilinks(body || '');
    res.json({ ok: true, stubs });
  });

  router.post('/files', (req, res) => {
    const { slug, frontmatter, body } = req.body;
    const filePath = path.join(gardenPath(), slug + '.md');
    if (fs.existsSync(filePath)) {
      return res.status(409).json({ error: 'File already exists' });
    }
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const output = matter.stringify(body || '', normalizeFrontmatter(frontmatter));
    fs.writeFileSync(filePath, output);
    const stubs = createStubsForWikilinks(body || '');
    res.status(201).json({ path: slug, stubs });
  });

  router.get('/backlinks/*', (req, res) => {
    const targetSlug = req.params[0];
    const root = gardenPath();
    const files = findMarkdownFiles(root);
    const linkers = [];
    for (const rel of files) {
      const slug = rel.replace(/\.md$/, '');
      if (slug === targetSlug) continue;
      const raw = fs.readFileSync(path.join(root, rel), 'utf-8');
      for (const match of raw.matchAll(wikilinkRegExp)) {
        const linked = match[1].replace(/\.(md|markdown)\s?$/i, '').trim();
        if (linked === targetSlug) {
          linkers.push(slug);
          break;
        }
      }
    }
    res.json(linkers);
  });

  router.delete('/files/*', (req, res) => {
    const slug = req.params[0];
    const filePath = path.join(gardenPath(), slug + '.md');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }
    fs.unlinkSync(filePath);
    res.json({ ok: true });
  });

  router.get('/slugs', (req, res) => {
    const root = gardenPath();
    const files = findMarkdownFiles(root);
    const slugs = files.map((rel) => {
      const raw = fs.readFileSync(path.join(root, rel), 'utf-8');
      const { data } = matter(raw);
      const slug = rel.replace(/\.md$/, '');
      return { slug, title: data.title || slug };
    });
    res.json(slugs);
  });

  return router;
}
