# Garden CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Vue 3 SPA + Express API in `cms/` for editing the garden's markdown content files, with CodeMirror 6 and wikilink autocomplete.

**Architecture:** Express server reads/writes markdown files in `../garden/` via 5 REST endpoints. Vue 3 SPA (Vite) provides file list, editor with frontmatter form, and new-page creation. CodeMirror 6 powers the markdown editor with a custom wikilink completion source. Two separate processes (Vite dev server + Express API) with Vite proxying `/api/*` to Express.

**Tech Stack:** Node 20, Express, Vue 3 (Composition API), Vite, Vue Router, CodeMirror 6, gray-matter (frontmatter parsing/serialization)

---

## File Structure

```
cms/
├── package.json
├── vite.config.js
├── .env                          ← GARDEN_PATH, ELEVENTY_DEV_URL, API_PORT
├── server/
│   ├── index.js                  ← Express app entry point
│   └── routes/
│       └── files.js              ← All /api/* route handlers
├── src/
│   ├── main.js                   ← Vue app bootstrap
│   ├── router.js                 ← Vue Router config (3 routes)
│   ├── App.vue                   ← Shell layout (header + router-view)
│   ├── api.js                    ← Fetch wrappers for all API calls
│   ├── views/
│   │   ├── FileList.vue          ← Sortable/filterable table
│   │   ├── Editor.vue            ← Edit existing page
│   │   └── NewPage.vue           ← Create new page
│   ├── components/
│   │   ├── FrontmatterForm.vue   ← Shared frontmatter field editor
│   │   └── MarkdownEditor.vue    ← CodeMirror 6 wrapper
│   └── codemirror/
│       └── wikilink.js           ← Custom CM6 completion source
├── test/
│   └── server/
│       └── files.test.js         ← API endpoint tests
└── index.html                    ← Vite entry HTML
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `cms/package.json`
- Create: `cms/vite.config.js`
- Create: `cms/.env`
- Create: `cms/index.html`
- Create: `cms/src/main.js`
- Create: `cms/src/App.vue`
- Create: `cms/src/router.js`
- Modify: `travisbriggs.com/.gitignore`

- [ ] **Step 1: Create `cms/package.json`**

```json
{
  "name": "garden-cms",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "dev:server": "node --watch server/index.js",
    "dev:all": "npm run dev:server & npm run dev",
    "build": "vite build",
    "test": "node --test test/**/*.test.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "gray-matter": "^4.0.3"
  },
  "devDependencies": {
    "@codemirror/autocomplete": "^6.18.6",
    "@codemirror/lang-markdown": "^6.3.2",
    "@codemirror/language": "^6.10.8",
    "@codemirror/state": "^6.5.2",
    "@codemirror/view": "^6.36.5",
    "@vitejs/plugin-vue": "^5.2.3",
    "codemirror": "^6.0.1",
    "vue": "^3.5.13",
    "vue-router": "^4.5.1",
    "vite": "^6.3.5"
  }
}
```

- [ ] **Step 2: Create `cms/vite.config.js`**

```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
```

- [ ] **Step 3: Create `cms/.env`**

```
GARDEN_PATH=../garden
ELEVENTY_DEV_URL=http://localhost:8080
API_PORT=3001
```

- [ ] **Step 4: Create `cms/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Garden CMS</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `cms/src/router.js`**

```js
import { createRouter, createWebHistory } from 'vue-router';
import FileList from './views/FileList.vue';
import Editor from './views/Editor.vue';
import NewPage from './views/NewPage.vue';

const routes = [
  { path: '/', component: FileList },
  { path: '/edit/:path(.*)', component: Editor },
  { path: '/new', component: NewPage },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
```

- [ ] **Step 6: Create `cms/src/App.vue`**

```vue
<script setup>
</script>

<template>
  <header class="app-header">
    <router-link to="/" class="logo">Garden CMS</router-link>
    <nav>
      <router-link to="/new">+ New Page</router-link>
    </nav>
  </header>
  <main>
    <router-view />
  </main>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: #1a1a1a;
  background: #f5f5f5;
  line-height: 1.5;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: #1a1a1a;
  color: #fff;
}

.app-header a {
  color: #fff;
  text-decoration: none;
}

.app-header .logo {
  font-weight: 600;
  font-size: 1.1rem;
}

.app-header nav a {
  padding: 0.4rem 0.8rem;
  border: 1px solid #555;
  border-radius: 4px;
  font-size: 0.85rem;
}

.app-header nav a:hover {
  background: #333;
}

main {
  max-width: 1100px;
  margin: 1.5rem auto;
  padding: 0 1.5rem;
}
</style>
```

- [ ] **Step 7: Create `cms/src/main.js`**

```js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router.js';

createApp(App).use(router).mount('#app');
```

- [ ] **Step 8: Create placeholder view files**

Create three minimal placeholder files so the router doesn't break:

`cms/src/views/FileList.vue`:
```vue
<template>
  <div>
    <h1>Garden Pages</h1>
    <p>Loading...</p>
  </div>
</template>
```

`cms/src/views/Editor.vue`:
```vue
<template>
  <div>
    <h1>Editor</h1>
    <p>Loading...</p>
  </div>
</template>
```

`cms/src/views/NewPage.vue`:
```vue
<template>
  <div>
    <h1>New Page</h1>
    <p>Loading...</p>
  </div>
</template>
```

- [ ] **Step 9: Add `cms/node_modules` to `.gitignore`**

Append to the root `.gitignore`:
```
cms/node_modules
```

- [ ] **Step 10: Install dependencies and verify**

```bash
cd cms && npm install
```

Run: `cd cms && npx vite --host 127.0.0.1 &` then `curl -s http://127.0.0.1:5173/ | head -5`

Expected: HTML containing `<div id="app"></div>`

Kill the vite process after verifying.

- [ ] **Step 11: Commit**

```bash
git add cms/ .gitignore
git commit -m "feat(cms): scaffold Vue 3 + Vite project with router"
```

---

### Task 2: Express API — File Listing and Reading

**Files:**
- Create: `cms/server/index.js`
- Create: `cms/server/routes/files.js`
- Create: `cms/test/server/files.test.js`

- [ ] **Step 1: Write failing tests for GET /api/files and GET /api/files/:path**

Create `cms/test/server/files.test.js`:

```js
import { describe, it, before, after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(__dirname, '..', 'fixtures', 'garden');

function setupFixtures() {
  fs.mkdirSync(path.join(FIXTURE_DIR, 'writings'), { recursive: true });

  fs.writeFileSync(
    path.join(FIXTURE_DIR, 'compost.md'),
    `---
title: Compost pile
date: 2023-11-14
updated: 2024-09-14
quality: B
importance: Mid
---
Some content about [[dg-reverse|Reverse Chronological Order]].
`
  );

  fs.writeFileSync(
    path.join(FIXTURE_DIR, 'now.md'),
    `---
title: Now
date: 2024-05-21
updated: 2026-04-13
quality: GA
importance: Top
permalink: now/
---
What I'm doing now.
`
  );

  fs.writeFileSync(
    path.join(FIXTURE_DIR, 'writings', 'intro.md'),
    `---
title: Introduction
date: 2014-09-08
---
First blog post.
`
  );
}

function cleanFixtures() {
  fs.rmSync(path.join(__dirname, '..', 'fixtures'), { recursive: true, force: true });
}

async function startApp(gardenPath) {
  process.env.GARDEN_PATH = gardenPath;
  process.env.API_PORT = '0';
  const { createApp } = await import('../../server/index.js');
  const app = createApp();
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      resolve({ server, base: `http://127.0.0.1:${port}` });
    });
  });
}

describe('GET /api/files', () => {
  let server, base;

  before(() => {
    setupFixtures();
  });

  after(() => {
    cleanFixtures();
  });

  beforeEach(async () => {
    ({ server, base } = await startApp(FIXTURE_DIR));
  });

  afterEach(() => {
    server.close();
  });

  it('lists all markdown files with parsed frontmatter', async () => {
    const res = await fetch(`${base}/api/files`);
    assert.equal(res.status, 200);
    const files = await res.json();
    assert.equal(files.length, 3);

    const compost = files.find((f) => f.path === 'compost');
    assert.ok(compost);
    assert.equal(compost.title, 'Compost pile');
    assert.equal(compost.quality, 'B');
    assert.equal(compost.importance, 'Mid');

    const writing = files.find((f) => f.path === 'writings/intro');
    assert.ok(writing);
    assert.equal(writing.title, 'Introduction');
    assert.equal(writing.quality, null);
  });
});

describe('GET /api/files/:path', () => {
  let server, base;

  before(() => {
    setupFixtures();
  });

  after(() => {
    cleanFixtures();
  });

  beforeEach(async () => {
    ({ server, base } = await startApp(FIXTURE_DIR));
  });

  afterEach(() => {
    server.close();
  });

  it('returns frontmatter and body for a file', async () => {
    const res = await fetch(`${base}/api/files/compost`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.frontmatter.title, 'Compost pile');
    assert.equal(data.frontmatter.quality, 'B');
    assert.ok(data.body.includes('[[dg-reverse|Reverse Chronological Order]]'));
  });

  it('handles nested paths (writings/intro)', async () => {
    const res = await fetch(`${base}/api/files/writings/intro`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.frontmatter.title, 'Introduction');
  });

  it('returns 404 for missing files', async () => {
    const res = await fetch(`${base}/api/files/nonexistent`);
    assert.equal(res.status, 404);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd cms && node --test test/server/files.test.js`

Expected: FAIL — cannot import `../../server/index.js`

- [ ] **Step 3: Implement Express server**

Create `cms/server/index.js`:

```js
import 'dotenv/config';
import express from 'express';
import { fileRoutes } from './routes/files.js';

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', fileRoutes());
  return app;
}

const port = process.env.API_PORT || 3001;
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = createApp();
  app.listen(port, () => {
    console.log(`Garden CMS API listening on port ${port}`);
  });
}
```

Create `cms/server/routes/files.js`:

```js
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

const KNOWN_FIELDS = ['title', 'date', 'updated', 'quality', 'importance'];

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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd cms && node --test test/server/files.test.js`

Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add cms/server/ cms/test/
git commit -m "feat(cms): Express API for listing and reading garden files"
```

---

### Task 3: Express API — Writing and Creating Files

**Files:**
- Modify: `cms/server/routes/files.js`
- Modify: `cms/test/server/files.test.js`

- [ ] **Step 1: Add failing tests for PUT and POST**

Append to `cms/test/server/files.test.js`:

```js
describe('PUT /api/files/:path', () => {
  let server, base;

  before(() => {
    setupFixtures();
  });

  after(() => {
    cleanFixtures();
  });

  beforeEach(async () => {
    ({ server, base } = await startApp(FIXTURE_DIR));
  });

  afterEach(() => {
    server.close();
  });

  it('overwrites file with new frontmatter and body', async () => {
    const res = await fetch(`${base}/api/files/compost`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frontmatter: {
          title: 'Compost pile',
          date: '2023-11-14',
          updated: '2026-05-15',
          quality: 'GA',
          importance: 'High',
        },
        body: 'Updated content.\n',
      }),
    });
    assert.equal(res.status, 200);

    const raw = fs.readFileSync(path.join(FIXTURE_DIR, 'compost.md'), 'utf-8');
    assert.ok(raw.includes('quality: GA'));
    assert.ok(raw.includes('Updated content.'));
  });

  it('returns 404 for missing files', async () => {
    const res = await fetch(`${base}/api/files/nonexistent`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frontmatter: { title: 'X' }, body: '' }),
    });
    assert.equal(res.status, 404);
  });
});

describe('POST /api/files', () => {
  let server, base;

  before(() => {
    setupFixtures();
  });

  after(() => {
    cleanFixtures();
  });

  beforeEach(async () => {
    ({ server, base } = await startApp(FIXTURE_DIR));
  });

  afterEach(() => {
    server.close();
  });

  it('creates a new markdown file', async () => {
    const res = await fetch(`${base}/api/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'new-topic',
        frontmatter: {
          title: 'New Topic',
          date: '2026-05-15',
          quality: 'Stub',
          importance: 'Mid',
        },
        body: '',
      }),
    });
    assert.equal(res.status, 201);
    const data = await res.json();
    assert.equal(data.path, 'new-topic');

    assert.ok(fs.existsSync(path.join(FIXTURE_DIR, 'new-topic.md')));
  });

  it('returns 409 if file already exists', async () => {
    const res = await fetch(`${base}/api/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'compost',
        frontmatter: { title: 'Dup' },
        body: '',
      }),
    });
    assert.equal(res.status, 409);
  });
});
```

- [ ] **Step 2: Run tests to verify new tests fail**

Run: `cd cms && node --test test/server/files.test.js`

Expected: PUT and POST tests FAIL. Existing tests still pass.

- [ ] **Step 3: Add slugs endpoint test**

Append to `cms/test/server/files.test.js`:

```js
describe('GET /api/slugs', () => {
  let server, base;

  before(() => {
    setupFixtures();
  });

  after(() => {
    cleanFixtures();
  });

  beforeEach(async () => {
    ({ server, base } = await startApp(FIXTURE_DIR));
  });

  afterEach(() => {
    server.close();
  });

  it('returns slug and title pairs', async () => {
    const res = await fetch(`${base}/api/slugs`);
    assert.equal(res.status, 200);
    const slugs = await res.json();
    assert.ok(slugs.length >= 3);

    const compost = slugs.find((s) => s.slug === 'compost');
    assert.ok(compost);
    assert.equal(compost.title, 'Compost pile');
  });
});
```

- [ ] **Step 4: Implement PUT, POST, and slugs routes**

Add to `cms/server/routes/files.js`, inside the `fileRoutes()` function before the `return router;` line:

```js
  router.put('/files/*', (req, res) => {
    const slug = req.params[0];
    const filePath = path.join(gardenPath(), slug + '.md');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }
    const { frontmatter, body } = req.body;
    const output = matter.stringify(body || '', frontmatter);
    fs.writeFileSync(filePath, output);
    res.json({ ok: true });
  });

  router.post('/files', (req, res) => {
    const { slug, frontmatter, body } = req.body;
    const filePath = path.join(gardenPath(), slug + '.md');
    if (fs.existsSync(filePath)) {
      return res.status(409).json({ error: 'File already exists' });
    }
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const output = matter.stringify(body || '', frontmatter);
    fs.writeFileSync(filePath, output);
    res.status(201).json({ path: slug });
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
```

- [ ] **Step 5: Run all tests**

Run: `cd cms && node --test test/server/files.test.js`

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add cms/server/routes/files.js cms/test/server/files.test.js
git commit -m "feat(cms): PUT, POST, and slugs API endpoints"
```

---

### Task 4: API Client Module

**Files:**
- Create: `cms/src/api.js`

- [ ] **Step 1: Create the fetch wrapper module**

Create `cms/src/api.js`:

```js
const BASE = '/api';

export async function listFiles() {
  const res = await fetch(`${BASE}/files`);
  if (!res.ok) throw new Error(`Failed to list files: ${res.status}`);
  return res.json();
}

export async function getFile(path) {
  const res = await fetch(`${BASE}/files/${path}`);
  if (!res.ok) throw new Error(`Failed to get file: ${res.status}`);
  return res.json();
}

export async function saveFile(path, frontmatter, body) {
  const res = await fetch(`${BASE}/files/${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ frontmatter, body }),
  });
  if (!res.ok) throw new Error(`Failed to save file: ${res.status}`);
  return res.json();
}

export async function createFile(slug, frontmatter, body) {
  const res = await fetch(`${BASE}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, frontmatter, body }),
  });
  if (res.status === 409) throw new Error('File already exists');
  if (!res.ok) throw new Error(`Failed to create file: ${res.status}`);
  return res.json();
}

export async function listSlugs() {
  const res = await fetch(`${BASE}/slugs`);
  if (!res.ok) throw new Error(`Failed to list slugs: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 2: Commit**

```bash
git add cms/src/api.js
git commit -m "feat(cms): API client module for fetch wrappers"
```

---

### Task 5: FrontmatterForm Component

**Files:**
- Create: `cms/src/components/FrontmatterForm.vue`

- [ ] **Step 1: Create the component**

Create `cms/src/components/FrontmatterForm.vue`:

```vue
<script setup>
import { computed } from 'vue';

const QUALITY_OPTIONS = ['', 'FA', 'GA', 'B', 'Start', 'Stub'];
const IMPORTANCE_OPTIONS = ['', 'Top', 'High', 'Mid', 'Low'];
const KNOWN_KEYS = ['title', 'date', 'updated', 'quality', 'importance', 'tags'];

const props = defineProps({
  modelValue: { type: Object, required: true },
});

const emit = defineEmits(['update:modelValue']);

function update(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

const extraFields = computed(() => {
  return Object.entries(props.modelValue).filter(
    ([key]) => !KNOWN_KEYS.includes(key)
  );
});

function updateExtra(key, value) {
  update(key, value);
}

function formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val).split('T')[0];
}
</script>

<template>
  <div class="frontmatter-form">
    <div class="form-row">
      <label>
        Title
        <input
          type="text"
          :value="modelValue.title || ''"
          @input="update('title', $event.target.value)"
        />
      </label>
    </div>

    <div class="form-row form-row--inline">
      <label>
        Date
        <input
          type="date"
          :value="formatDate(modelValue.date)"
          @input="update('date', $event.target.value)"
        />
      </label>

      <label>
        Updated
        <input
          type="date"
          :value="formatDate(modelValue.updated)"
          @input="update('updated', $event.target.value)"
        />
      </label>

      <label>
        Quality
        <select
          :value="modelValue.quality || ''"
          @change="update('quality', $event.target.value || undefined)"
        >
          <option v-for="q in QUALITY_OPTIONS" :key="q" :value="q">
            {{ q || '—' }}
          </option>
        </select>
      </label>

      <label>
        Importance
        <select
          :value="modelValue.importance || ''"
          @change="update('importance', $event.target.value || undefined)"
        >
          <option v-for="i in IMPORTANCE_OPTIONS" :key="i" :value="i">
            {{ i || '—' }}
          </option>
        </select>
      </label>
    </div>

    <div class="form-row">
      <label>
        Tags
        <input
          type="text"
          :value="(modelValue.tags || []).join(', ')"
          @input="
            update(
              'tags',
              $event.target.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            )
          "
          placeholder="tag1, tag2"
        />
      </label>
    </div>

    <div v-for="[key, val] in extraFields" :key="key" class="form-row">
      <label>
        {{ key }}
        <input type="text" :value="val" @input="updateExtra(key, $event.target.value)" />
      </label>
    </div>
  </div>
</template>

<style scoped>
.frontmatter-form {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.form-row {
  margin-bottom: 0.75rem;
}

.form-row--inline {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-row--inline label {
  flex: 1;
  min-width: 140px;
}

label {
  display: flex;
  flex-direction: column;
  font-size: 0.8rem;
  font-weight: 600;
  color: #555;
  gap: 0.25rem;
}

input,
select {
  font-size: 0.95rem;
  padding: 0.4rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
}

input:focus,
select:focus {
  outline: 2px solid #4a90d9;
  outline-offset: 1px;
}
</style>
```

- [ ] **Step 2: Verify it renders**

Temporarily import the component in `FileList.vue` with dummy data to confirm it mounts:

```vue
<script setup>
import { ref } from 'vue';
import FrontmatterForm from '../components/FrontmatterForm.vue';
const fm = ref({ title: 'Test', quality: 'B', importance: 'Mid' });
</script>

<template>
  <FrontmatterForm v-model="fm" />
  <pre>{{ fm }}</pre>
</template>
```

Run: `cd cms && npx vite --host 127.0.0.1` and open `http://127.0.0.1:5173` in a browser. Confirm the form renders with dropdowns and inputs. Changing a field should update the `<pre>` output.

- [ ] **Step 3: Revert the FileList.vue test harness**

Restore `cms/src/views/FileList.vue` to its placeholder content:

```vue
<template>
  <div>
    <h1>Garden Pages</h1>
    <p>Loading...</p>
  </div>
</template>
```

- [ ] **Step 4: Commit**

```bash
git add cms/src/components/FrontmatterForm.vue
git commit -m "feat(cms): FrontmatterForm component with known + extra fields"
```

---

### Task 6: MarkdownEditor Component with Wikilink Autocomplete

**Files:**
- Create: `cms/src/codemirror/wikilink.js`
- Create: `cms/src/components/MarkdownEditor.vue`

- [ ] **Step 1: Create the wikilink completion source**

Create `cms/src/codemirror/wikilink.js`:

```js
export function wikilinkCompletion(slugsPromise) {
  let slugs = [];
  slugsPromise.then((data) => {
    slugs = data;
  });

  return (context) => {
    const before = context.matchBefore(/\[\[[^\]\|]*/);
    if (!before) return null;

    const query = before.text.slice(2).toLowerCase();

    const options = slugs
      .filter(
        (s) =>
          s.slug.toLowerCase().includes(query) ||
          s.title.toLowerCase().includes(query)
      )
      .map((s) => ({
        label: s.slug,
        detail: s.title,
        apply: s.slug,
      }));

    return {
      from: before.from + 2,
      options,
      validFor: /^[^\]\|]*/,
    };
  };
}
```

- [ ] **Step 2: Create the MarkdownEditor component**

Create `cms/src/components/MarkdownEditor.vue`:

```vue
<script setup>
import { ref, onMounted, watch, shallowRef } from 'vue';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { autocompletion } from '@codemirror/autocomplete';
import { basicSetup } from 'codemirror';
import { wikilinkCompletion } from '../codemirror/wikilink.js';

const props = defineProps({
  modelValue: { type: String, default: '' },
  slugs: { type: Promise, required: true },
});

const emit = defineEmits(['update:modelValue']);
const editorEl = ref(null);
const view = shallowRef(null);

onMounted(() => {
  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      emit('update:modelValue', update.state.doc.toString());
    }
  });

  view.value = new EditorView({
    parent: editorEl.value,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        basicSetup,
        markdown(),
        autocompletion({
          override: [wikilinkCompletion(props.slugs)],
        }),
        updateListener,
        EditorView.theme({
          '&': { fontSize: '0.95rem' },
          '.cm-content': { fontFamily: 'monospace', minHeight: '400px' },
          '.cm-editor': { border: '1px solid #ccc', borderRadius: '4px' },
          '&.cm-focused': { outline: '2px solid #4a90d9' },
        }),
      ],
    }),
  });
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (view.value && view.value.state.doc.toString() !== newVal) {
      view.value.dispatch({
        changes: { from: 0, to: view.value.state.doc.length, insert: newVal },
      });
    }
  }
);
</script>

<template>
  <div ref="editorEl" class="markdown-editor"></div>
</template>

<style scoped>
.markdown-editor {
  margin-bottom: 1rem;
}
</style>
```

- [ ] **Step 3: Verify the editor renders with autocomplete**

Temporarily wire up the editor in `FileList.vue` to confirm it works:

```vue
<script setup>
import { ref } from 'vue';
import MarkdownEditor from '../components/MarkdownEditor.vue';

const content = ref('Type [[ to test autocomplete.');
const slugs = Promise.resolve([
  { slug: 'compost', title: 'Compost pile' },
  { slug: 'now', title: 'Now' },
  { slug: 'dg-reverse', title: 'Digital gardens eschew reverse chronological sorting' },
]);
</script>

<template>
  <MarkdownEditor v-model="content" :slugs="slugs" />
</template>
```

Run Vite dev server, open in browser, type `[[com` and verify the autocomplete popup appears showing `compost — Compost pile`.

- [ ] **Step 4: Revert FileList.vue to placeholder**

Restore `cms/src/views/FileList.vue` to its placeholder content:

```vue
<template>
  <div>
    <h1>Garden Pages</h1>
    <p>Loading...</p>
  </div>
</template>
```

- [ ] **Step 5: Commit**

```bash
git add cms/src/codemirror/ cms/src/components/MarkdownEditor.vue
git commit -m "feat(cms): CodeMirror 6 editor with wikilink autocomplete"
```

---

### Task 7: FileList View

**Files:**
- Modify: `cms/src/views/FileList.vue`

- [ ] **Step 1: Implement the FileList view**

Replace `cms/src/views/FileList.vue`:

```vue
<script setup>
import { ref, computed, onMounted } from 'vue';
import { listFiles } from '../api.js';

const ELEVENTY_URL = import.meta.env.VITE_ELEVENTY_DEV_URL || 'http://localhost:8080';

const files = ref([]);
const loading = ref(true);
const filterText = ref('');
const filterQuality = ref('');
const filterImportance = ref('');
const sortKey = ref('updated');
const sortAsc = ref(false);

onMounted(async () => {
  files.value = await listFiles();
  loading.value = false;
});

const filtered = computed(() => {
  let result = files.value;

  if (filterText.value) {
    const q = filterText.value.toLowerCase();
    result = result.filter(
      (f) =>
        f.title.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)
    );
  }

  if (filterQuality.value) {
    result = result.filter((f) => f.quality === filterQuality.value);
  }

  if (filterImportance.value) {
    result = result.filter((f) => f.importance === filterImportance.value);
  }

  return [...result].sort((a, b) => {
    let aVal = a[sortKey.value] || '';
    let bVal = b[sortKey.value] || '';
    if (aVal < bVal) return sortAsc.value ? -1 : 1;
    if (aVal > bVal) return sortAsc.value ? 1 : -1;
    return 0;
  });
});

function toggleSort(key) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value;
  } else {
    sortKey.value = key;
    sortAsc.value = key !== 'updated';
  }
}

function sortIndicator(key) {
  if (sortKey.value !== key) return '';
  return sortAsc.value ? ' ▲' : ' ▼';
}

function previewUrl(filePath) {
  return `${ELEVENTY_URL}/garden/${filePath}/`;
}
</script>

<template>
  <div class="file-list">
    <div class="toolbar">
      <input
        v-model="filterText"
        type="text"
        placeholder="Filter by title or path..."
        class="filter-input"
      />
      <select v-model="filterQuality">
        <option value="">All Quality</option>
        <option v-for="q in ['FA', 'GA', 'B', 'Start', 'Stub']" :key="q" :value="q">
          {{ q }}
        </option>
      </select>
      <select v-model="filterImportance">
        <option value="">All Importance</option>
        <option v-for="i in ['Top', 'High', 'Mid', 'Low']" :key="i" :value="i">
          {{ i }}
        </option>
      </select>
    </div>

    <p v-if="loading">Loading...</p>

    <table v-else>
      <thead>
        <tr>
          <th @click="toggleSort('title')">Title{{ sortIndicator('title') }}</th>
          <th @click="toggleSort('quality')">Quality{{ sortIndicator('quality') }}</th>
          <th @click="toggleSort('importance')">
            Importance{{ sortIndicator('importance') }}
          </th>
          <th @click="toggleSort('updated')">Updated{{ sortIndicator('updated') }}</th>
          <th>Path</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="file in filtered" :key="file.path">
          <td>
            <router-link :to="`/edit/${file.path}`">{{ file.title }}</router-link>
          </td>
          <td>
            <span v-if="file.quality" class="badge badge-quality">{{
              file.quality
            }}</span>
          </td>
          <td>
            <span v-if="file.importance" class="badge badge-importance">{{
              file.importance
            }}</span>
          </td>
          <td>{{ file.updated || file.date || '' }}</td>
          <td class="path-cell">{{ file.path }}</td>
          <td>
            <a :href="previewUrl(file.path)" target="_blank" title="Open in Eleventy dev server">
              ↗
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.filter-input {
  flex: 1;
  min-width: 200px;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
}

select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

thead th {
  background: #fafafa;
  border-bottom: 2px solid #e0e0e0;
  padding: 0.6rem 0.75rem;
  text-align: left;
  font-size: 0.8rem;
  text-transform: uppercase;
  color: #666;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

thead th:hover {
  background: #f0f0f0;
}

tbody td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
}

tbody tr:hover {
  background: #f8f9ff;
}

.path-cell {
  color: #888;
  font-family: monospace;
  font-size: 0.8rem;
}

.badge {
  display: inline-block;
  padding: 0.1rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-quality {
  background: #e8f5d4;
  color: #3a6b1e;
}

.badge-importance {
  background: #ffe4ff;
  color: #6b2b6b;
}

a {
  color: #4a90d9;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
```

- [ ] **Step 2: Add `VITE_ELEVENTY_DEV_URL` to `.env`**

Append to `cms/.env`:

```
VITE_ELEVENTY_DEV_URL=http://localhost:8080
```

(Vite only exposes env vars prefixed with `VITE_` to client code.)

- [ ] **Step 3: Verify the view works end-to-end**

Start both servers:
```bash
cd cms && node server/index.js &
cd cms && npx vite --host 127.0.0.1
```

Open `http://127.0.0.1:5173` in a browser. Verify:
- Table shows all garden files with titles, quality badges, and dates
- Text filter narrows the list
- Clicking a column header sorts
- The ↗ link opens the Eleventy dev server URL
- Clicking a title navigates to `/edit/<path>`

Kill the servers after verifying.

- [ ] **Step 4: Commit**

```bash
git add cms/src/views/FileList.vue cms/.env
git commit -m "feat(cms): FileList view with sorting, filtering, and preview links"
```

---

### Task 8: Editor View

**Files:**
- Modify: `cms/src/views/Editor.vue`

- [ ] **Step 1: Implement the Editor view**

Replace `cms/src/views/Editor.vue`:

```vue
<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getFile, saveFile, listSlugs } from '../api.js';
import FrontmatterForm from '../components/FrontmatterForm.vue';
import MarkdownEditor from '../components/MarkdownEditor.vue';

const ELEVENTY_URL = import.meta.env.VITE_ELEVENTY_DEV_URL || 'http://localhost:8080';

const route = useRoute();
const router = useRouter();

const filePath = route.params.path;
const frontmatter = ref({});
const body = ref('');
const loading = ref(true);
const saving = ref(false);
const message = ref('');
const slugs = listSlugs();

onMounted(async () => {
  const data = await getFile(filePath);
  frontmatter.value = data.frontmatter;
  body.value = data.body;
  loading.value = false;
});

async function save() {
  saving.value = true;
  message.value = '';
  try {
    await saveFile(filePath, frontmatter.value, body.value);
    message.value = 'Saved.';
    setTimeout(() => (message.value = ''), 2000);
  } catch (e) {
    message.value = `Error: ${e.message}`;
  } finally {
    saving.value = false;
  }
}

function previewUrl() {
  return `${ELEVENTY_URL}/garden/${filePath}/`;
}
</script>

<template>
  <div class="editor-view">
    <div class="editor-header">
      <router-link to="/" class="back-link">← Back</router-link>
      <span class="editor-path">{{ filePath }}</span>
      <a :href="previewUrl()" target="_blank" class="preview-link" title="Open in Eleventy dev server">
        Preview ↗
      </a>
    </div>

    <p v-if="loading">Loading...</p>

    <template v-else>
      <FrontmatterForm v-model="frontmatter" />
      <MarkdownEditor v-model="body" :slugs="slugs" />

      <div class="editor-actions">
        <button @click="save" :disabled="saving" class="save-btn">
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
        <span v-if="message" class="save-message">{{ message }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.editor-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.back-link {
  color: #4a90d9;
  text-decoration: none;
  font-size: 0.9rem;
}

.back-link:hover {
  text-decoration: underline;
}

.editor-path {
  font-family: monospace;
  font-size: 0.85rem;
  color: #888;
}

.preview-link {
  margin-left: auto;
  color: #4a90d9;
  text-decoration: none;
  font-size: 0.85rem;
}

.preview-link:hover {
  text-decoration: underline;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.save-btn {
  padding: 0.5rem 1.5rem;
  background: #4a90d9;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
  cursor: pointer;
}

.save-btn:hover {
  background: #3a7ac0;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-message {
  font-size: 0.85rem;
  color: #2a7a2a;
}
</style>
```

- [ ] **Step 2: Verify end-to-end editing**

Start both servers. Navigate to an existing file (e.g., `/edit/compost`). Verify:
- Frontmatter form populates with the file's data
- CodeMirror editor shows the markdown body
- Typing `[[` triggers wikilink autocomplete
- Clicking Save writes the file (check the file on disk)
- The "Preview ↗" link opens the correct Eleventy URL

- [ ] **Step 3: Commit**

```bash
git add cms/src/views/Editor.vue
git commit -m "feat(cms): Editor view with frontmatter form and CodeMirror editor"
```

---

### Task 9: NewPage View

**Files:**
- Modify: `cms/src/views/NewPage.vue`

- [ ] **Step 1: Implement the NewPage view**

Replace `cms/src/views/NewPage.vue`:

```vue
<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { createFile, listSlugs } from '../api.js';
import FrontmatterForm from '../components/FrontmatterForm.vue';
import MarkdownEditor from '../components/MarkdownEditor.vue';

const router = useRouter();

const today = new Date().toISOString().split('T')[0];

const slug = ref('');
const slugEdited = ref(false);
const frontmatter = ref({
  title: '',
  date: today,
  quality: 'Stub',
  importance: 'Mid',
});
const body = ref('');
const creating = ref(false);
const error = ref('');
const slugs = listSlugs();

function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

watch(
  () => frontmatter.value.title,
  (title) => {
    if (!slugEdited.value) {
      slug.value = titleToSlug(title);
    }
  }
);

function onSlugInput(e) {
  slug.value = e.target.value;
  slugEdited.value = true;
}

async function create() {
  if (!frontmatter.value.title || !slug.value) {
    error.value = 'Title and slug are required.';
    return;
  }

  creating.value = true;
  error.value = '';
  try {
    await createFile(slug.value, frontmatter.value, body.value);
    router.push(`/edit/${slug.value}`);
  } catch (e) {
    error.value = e.message;
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <div class="new-page">
    <div class="new-header">
      <router-link to="/" class="back-link">← Back</router-link>
      <h1>New Page</h1>
    </div>

    <div class="slug-row">
      <label>
        Slug
        <input type="text" :value="slug" @input="onSlugInput" placeholder="auto-generated-from-title" />
      </label>
      <span class="slug-preview">→ garden/{{ slug || '...' }}.md</span>
    </div>

    <FrontmatterForm v-model="frontmatter" />
    <MarkdownEditor v-model="body" :slugs="slugs" />

    <div class="create-actions">
      <button @click="create" :disabled="creating" class="create-btn">
        {{ creating ? 'Creating...' : 'Create' }}
      </button>
      <span v-if="error" class="error-message">{{ error }}</span>
    </div>
  </div>
</template>

<style scoped>
.new-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.new-header h1 {
  font-size: 1.3rem;
  margin: 0;
}

.back-link {
  color: #4a90d9;
  text-decoration: none;
  font-size: 0.9rem;
}

.slug-row {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;
}

.slug-row label {
  display: flex;
  flex-direction: column;
  font-size: 0.8rem;
  font-weight: 600;
  color: #555;
  gap: 0.25rem;
  flex: 1;
}

.slug-row input {
  padding: 0.4rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: monospace;
}

.slug-preview {
  font-family: monospace;
  font-size: 0.8rem;
  color: #888;
  white-space: nowrap;
}

.create-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.create-btn {
  padding: 0.5rem 1.5rem;
  background: #2a7a2a;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
  cursor: pointer;
}

.create-btn:hover {
  background: #236b23;
}

.create-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  font-size: 0.85rem;
  color: #c33;
}
</style>
```

- [ ] **Step 2: Verify end-to-end page creation**

Start both servers. Navigate to `/new`. Verify:
- Typing a title auto-generates the slug
- Editing the slug field stops auto-generation
- Clicking Create produces a new `.md` file in `garden/`
- After creation, redirects to the editor for the new page
- Creating a page with an existing slug shows the "File already exists" error

- [ ] **Step 3: Commit**

```bash
git add cms/src/views/NewPage.vue
git commit -m "feat(cms): NewPage view with slug generation and creation"
```

---

### Task 10: Final Integration and Cleanup

**Files:**
- Modify: `cms/.env`
- Modify: `cms/package.json` (verify scripts)
- Modify: `travisbriggs.com/.gitignore`

- [ ] **Step 1: Verify the `dev:all` script works**

Run: `cd cms && npm run dev:all`

Expected: Both servers start. Opening `http://localhost:5173` shows the file list. Editing and saving a file writes to disk. Creating a page works.

- [ ] **Step 2: Verify `.gitignore` includes CMS artifacts**

Check that `.gitignore` includes:
```
cms/node_modules
cms/dist
```

Add `cms/dist` if missing.

- [ ] **Step 3: Full smoke test**

With both servers running:
1. Open file list — verify all 123+ pages appear
2. Sort by quality, then by updated date
3. Filter by "compost" — verify it narrows
4. Click into a page — verify frontmatter and body load
5. Make a small edit, save, check the file on disk
6. Click "Preview ↗" — verify it opens the Eleventy dev server page
7. Go to New Page, create a test page, verify the file exists, then delete it from disk

- [ ] **Step 4: Commit**

```bash
git add -A cms/ .gitignore
git commit -m "feat(cms): final integration and cleanup"
```
