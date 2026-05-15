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
