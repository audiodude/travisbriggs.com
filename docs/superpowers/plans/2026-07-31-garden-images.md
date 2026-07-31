# Garden Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Garden nodes can include images: responsive on www via the Eleventy image pipeline, gemtext link lines on Gemini via gemdown 0.8.0, first body image as absolute-URL `og:image`, uploadable from the CMS editor.

**Architecture:** Build-integration tests come first (they gate everything), then an Eleventy 2→3 upgrade (required by the image transform plugin), then the www image pipeline + og:image, then gemdown work (recover lost 0.7.0 source, add image support, publish 0.8.0), then CMS upload (Express route + CodeMirror handlers).

**Tech Stack:** Eleventy 3.1.x (CJS configs), @11ty/eleventy-img ^6 (transform plugin), node:test, gemdown (marked-based, jasmine specs), Express + multer, Vue 3 + CodeMirror 6.

**Spec:** `docs/superpowers/specs/2026-07-31-garden-images-design.md`

## Global Constraints

- Node is **20.20.2** (asdf). Use `@11ty/eleventy-img@^6.0.4` — **v7 requires Node ≥22, do not use it**.
- Both Eleventy configs (`.eleventy.js`, `.eleventy.gemini.js`) stay **CommonJS**.
- **NEVER run an Eleventy build without `DISABLE_MASTODON=1` in the environment** (a real build posts public Mastodon statuses for garden nodes missing from `comments.sqlite3`). The test helper sets it; set it manually for any ad-hoc build: `DISABLE_MASTODON=1 npx eleventy`.
- `comments.sqlite3` is already dirty in git status — pre-existing, **never stage or commit it**.
- Test fixtures injected into `garden/` and `assets/img/garden/` use the `zz-test-fixture` name and are gitignored + cleaned up by tests; never commit them.
- gemdown work happens in `/home/tmoney/code/starred/gemdown` (separate repo). `npm publish` there is a **manual auth gate**: check `npm whoami` first; if not logged in, STOP and ask the user.
- All commits end with: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- Site repo commits go on `main`. gemdown commits go on its `main`.
- The site repo root `package.json` has no `"type"` field → root test files are **CommonJS**. The `cms/` package is ESM.

---

### Task 1: Mastodon guard + www build integration test

**Files:**
- Modify: `garden/garden.11tydata.js` (~line 118, the `ELEVENTY_RUN_MODE` check)
- Create: `test/helpers/build.js`
- Create: `test/site-build.test.js`
- Modify: `package.json` (add `test` script)

**Interfaces:**
- Produces: `runBuild({ config }) -> outDir` helper (CJS, `test/helpers/build.js`) used by Task 2/4/5/8 tests. Runs a real Eleventy build into a temp dir with `DISABLE_MASTODON=1` and `MASTODON_API_KEY=''`.
- Produces: guard behavior — any process with `DISABLE_MASTODON` set never posts to Mastodon or writes `comments.sqlite3`.

- [ ] **Step 1: Add the Mastodon guard**

In `garden/garden.11tydata.js`, find:

```js
      if (process.env.ELEVENTY_RUN_MODE != 'build') {
        return;
      }
```

Replace with:

```js
      if (
        process.env.DISABLE_MASTODON ||
        process.env.ELEVENTY_RUN_MODE != 'build'
      ) {
        return;
      }
```

- [ ] **Step 2: Write the build helper**

Create `test/helpers/build.js`:

```js
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

// Runs a real Eleventy build into a fresh temp dir and returns that dir.
// DISABLE_MASTODON short-circuits the status-posting path in
// garden/garden.11tydata.js; the emptied MASTODON_API_KEY is
// belt-and-suspenders (dotenv never overrides pre-set env vars, and an
// empty bearer token can only produce a failed request, never a post).
function runBuild({ config } = {}) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'garden-build-'));
  const args = ['eleventy', `--output=${outDir}`];
  if (config) {
    args.push(`--config=${config}`);
  }
  const result = spawnSync('npx', args, {
    cwd: ROOT,
    env: { ...process.env, DISABLE_MASTODON: '1', MASTODON_API_KEY: '' },
    encoding: 'utf-8',
    timeout: 300000,
  });
  if (result.status !== 0) {
    throw new Error(
      `Build failed (${args.join(' ')}):\n${result.stdout}\n${result.stderr}`,
    );
  }
  return outDir;
}

module.exports = { runBuild, ROOT };
```

- [ ] **Step 3: Write the www build test**

Create `test/site-build.test.js`:

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it, before, after } = require('node:test');
const { runBuild } = require('./helpers/build.js');

describe('www build', () => {
  let out;

  before(() => {
    out = runBuild();
  });

  after(() => {
    fs.rmSync(out, { recursive: true, force: true });
  });

  it('builds a full set of garden nodes', () => {
    const entries = fs.readdirSync(path.join(out, 'garden'));
    assert.ok(
      entries.length >= 100,
      `expected >= 100 garden pages, got ${entries.length}`,
    );
  });

  it('renders a sample node with title, meta tags and wikilinks', () => {
    const html = fs.readFileSync(
      path.join(out, 'garden', 'ai', 'index.html'),
      'utf-8',
    );
    assert.match(html, /<h1>AI<\/h1>/);
    assert.match(html, /<meta property="og:title" content="AI/);
    assert.match(html, /<meta property="og:image" content="[^"]+"/);
    assert.match(html, /href="\/garden\/harness-matters-more\/"/);
    assert.match(html, /backlinks-container|backlinks-default/);
  });

  it('emits a well-formed atom feed', () => {
    const xml = fs.readFileSync(path.join(out, 'feed.xml'), 'utf-8');
    assert.ok(xml.startsWith('<?xml'));
    assert.match(xml, /<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom"/);
    assert.ok(xml.trimEnd().endsWith('</feed>'));
    const opens = (xml.match(/<entry>/g) || []).length;
    const closes = (xml.match(/<\/entry>/g) || []).length;
    assert.ok(opens >= 100, `expected >= 100 feed entries, got ${opens}`);
    assert.equal(opens, closes);
  });

  it('copies static assets and redirects', () => {
    assert.ok(fs.existsSync(path.join(out, 'assets', 'style.css')));
    assert.ok(fs.existsSync(path.join(out, '_redirects')));
  });
});
```

- [ ] **Step 4: Add the test script**

In root `package.json` scripts, add:

```json
"test": "node --test test/"
```

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: PASS (4 passing). These are characterization tests of the current Eleventy 2 build — they pass immediately by design; they exist to hold the line through the upgrade. If any fail, the assertion is wrong about current output: inspect the built file in the temp dir and correct the assertion to match reality (do not change site behavior in this task).

- [ ] **Step 6: Commit**

```bash
git add garden/garden.11tydata.js test/ package.json
git commit -m "Add www build integration tests and DISABLE_MASTODON guard"
```

---

### Task 2: Gemini build integration test

**Files:**
- Create: `test/gemini-build.test.js`

**Interfaces:**
- Consumes: `runBuild({ config })` from `test/helpers/build.js`.
- Produces: the Gemini characterization suite Tasks 3 and 8 rely on.

- [ ] **Step 1: Write the Gemini build test**

Create `test/gemini-build.test.js`:

```js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it, before, after } = require('node:test');
const { runBuild } = require('./helpers/build.js');

describe('gemini build', () => {
  let out;

  before(() => {
    out = runBuild({ config: '.eleventy.gemini.js' });
  });

  after(() => {
    fs.rmSync(out, { recursive: true, force: true });
  });

  it('builds a full set of garden nodes as .gmi', () => {
    const entries = fs.readdirSync(path.join(out, 'garden'));
    assert.ok(
      entries.length >= 100,
      `expected >= 100 garden pages, got ${entries.length}`,
    );
    assert.ok(
      fs.existsSync(path.join(out, 'garden', 'ai', 'index.gmi')),
      'sample node missing',
    );
  });

  it('renders wikilinks as gemtext link lines', () => {
    const gmi = fs.readFileSync(
      path.join(out, 'garden', 'ai', 'index.gmi'),
      'utf-8',
    );
    assert.match(gmi, /^=> \/garden\//m);
  });

  it('contains no HTML entities', () => {
    const gmi = fs.readFileSync(
      path.join(out, 'garden', 'ai', 'index.gmi'),
      'utf-8',
    );
    assert.doesNotMatch(gmi, /&gt;|&lt;|&quot;|&amp;/);
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `npm test`
Expected: PASS (www + gemini suites). Same rule as Task 1: if an assertion fails, inspect the actual `.gmi` output and fix the assertion, not the site.

- [ ] **Step 3: Commit**

```bash
git add test/gemini-build.test.js
git commit -m "Add Gemini build integration tests"
```

---

### Task 3: Eleventy 2 → 3 upgrade

**Files:**
- Modify: `package.json` / `package-lock.json` (dependency bumps)
- Modify: `.eleventy.js` (RSS plugin import, if needed)
- Possibly modify: `.eleventy.gemini.js` (only if the custom md library breaks)

**Interfaces:**
- Consumes: the Task 1/2 test suites as the upgrade safety net.
- Produces: Eleventy 3.1.x environment; `page.rawInput` (an Eleventy 3 feature) becomes available for Task 5.

- [ ] **Step 1: Capture baseline output trees (still on v2)**

```bash
cd /home/tmoney/code/starred/travisbriggs.com
BASE=/tmp/claude-1000/-home-tmoney-code-starred-travisbriggs-com/cae4a282-5f35-4b42-961b-f6104072720b/scratchpad/upgrade-baseline
mkdir -p "$BASE"
DISABLE_MASTODON=1 npx eleventy --output="$BASE/site-v2"
DISABLE_MASTODON=1 npx eleventy --config=.eleventy.gemini.js --output="$BASE/gemini-v2"
```

- [ ] **Step 2: Bump dependencies**

```bash
npm install --save-dev @11ty/eleventy@^3.1.6 @11ty/eleventy-plugin-rss@^3.0.0
```

- [ ] **Step 3: Fix the RSS plugin import in `.eleventy.js`**

`@11ty/eleventy-plugin-rss@3` is ESM (`"type": "module"`). Node 20.20.2 supports `require()` of ESM without top-level await, so first try leaving `const pluginRss = require('@11ty/eleventy-plugin-rss');` as-is and running a build. If it throws (ERR_REQUIRE_ESM or similar), convert the config to an async function — Eleventy 3 supports this:

```js
module.exports = async function (eleventyConfig) {
  // ...existing body unchanged...
  const pluginRss = (await import('@11ty/eleventy-plugin-rss')).default;
  eleventyConfig.addPlugin(pluginRss);
  // ...
};
```

Verify the export shape before wiring it: `node -e "import('@11ty/eleventy-plugin-rss').then(m => console.log(Object.keys(m)))"`. `feed.njk` needs the filters `absoluteUrl`, `dateToRfc3339`, and `htmlToAbsoluteUrls` — register whichever export provides them (the legacy default plugin in v3; if `htmlToAbsoluteUrls` was dropped, check the module's exported filter names and register the equivalent). `feed.njk` itself must not change; the Task 1 feed test is the arbiter.

- [ ] **Step 4: Run the test suite; fix breakage until green**

Run: `npm test`
Expected: PASS. Known risk areas if it fails:
- `.eleventy.gemini.js` uses `setLibrary('md', { permalink, render })` (a custom object, not markdown-it). If Eleventy 3 rejects it, consult https://www.11ty.dev/docs/languages/custom/ and re-express as `eleventyConfig.addExtension('md', { compile: ... })` producing identical output — the Gemini tests define "identical".
- `eleventyConfig.ignores` / passthrough API differences — check the Eleventy 3 release notes at https://www.11ty.dev/blog/eleventy-v3/.

- [ ] **Step 5: Diff the full output trees against baseline**

```bash
BASE=/tmp/claude-1000/-home-tmoney-code-starred-travisbriggs-com/cae4a282-5f35-4b42-961b-f6104072720b/scratchpad/upgrade-baseline
DISABLE_MASTODON=1 npx eleventy --output="$BASE/site-v3"
DISABLE_MASTODON=1 npx eleventy --config=.eleventy.gemini.js --output="$BASE/gemini-v3"
diff -r "$BASE/site-v2" "$BASE/site-v3" | head -100
diff -r "$BASE/gemini-v2" "$BASE/gemini-v3" | head -100
```

Expected: empty diffs, or only trivial whitespace differences. Every non-trivial diff must be explained and accepted (record the explanation in the commit message). Unexplained content differences = failure; fix before proceeding.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .eleventy.js .eleventy.gemini.js
git commit -m "Upgrade Eleventy 2 -> 3 and RSS plugin to 3.x"
```

(Include only files actually changed; note accepted output diffs in the body.)

---

### Task 4: Image transform plugin on www

**Files:**
- Modify: `package.json` (add `@11ty/eleventy-img`)
- Modify: `.eleventy.js` (register transform plugin)
- Modify: `.gitignore` (fixture names + `.cache/`)
- Create: `test/fixtures/test-image.jpg` (committed binary fixture)
- Create: `test/helpers/fixtures.js`
- Modify: `test/site-build.test.js`

**Interfaces:**
- Consumes: Eleventy 3 from Task 3; `runBuild` from Task 1.
- Produces: `injectFixtures()` / `cleanupFixtures()` (CJS, `test/helpers/fixtures.js`) — creates `garden/zz-test-fixture.md` and `assets/img/garden/zz-test-fixture.jpg` in the real source tree (gitignored), used again by Tasks 5 and 8. The fixture node's alt text is exactly `A purple rectangle`.

- [ ] **Step 1: Install and register the plugin**

```bash
npm install --save-dev @11ty/eleventy-img@^6.0.4
```

In `.eleventy.js` (this is v6, CommonJS — plain require works):

```js
const { eleventyImageTransformPlugin } = require('@11ty/eleventy-img');
```

and inside the config function, after the RSS plugin registration:

```js
eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
  extensions: 'html',
  formats: ['webp', 'auto'],
  widths: [480, 800, 1600, 'auto'],
  urlPath: '/img/',
  defaultAttributes: {
    loading: 'lazy',
    decoding: 'async',
  },
  sharpOptions: { animated: true },
});
```

Do NOT add this to `.eleventy.gemini.js` — Gemini serves originals.

- [ ] **Step 2: Create the committed test image**

```bash
node -e "require('sharp')({create:{width:1200,height:800,channels:3,background:{r:120,g:80,b:200}}}).jpeg({quality:60}).toFile('test/fixtures/test-image.jpg').then(()=>console.log('ok'))"
```

(sharp is a transitive dependency of eleventy-img.) Confirm the file is a few KB, then it gets committed.

- [ ] **Step 3: Gitignore the injected fixtures and image cache**

Append to `.gitignore`:

```
.cache/
garden/zz-test-fixture.md
assets/img/garden/zz-test-fixture.jpg
```

- [ ] **Step 4: Write the fixture helper**

Create `test/helpers/fixtures.js`:

```js
const fs = require('node:fs');
const path = require('node:path');
const { ROOT } = require('./build.js');

const FIXTURE_NODE = path.join(ROOT, 'garden', 'zz-test-fixture.md');
const FIXTURE_IMAGE = path.join(
  ROOT,
  'assets',
  'img',
  'garden',
  'zz-test-fixture.jpg',
);
const SOURCE_IMAGE = path.join(__dirname, '..', 'fixtures', 'test-image.jpg');

// Injects a throwaway garden node + image into the real source tree so a
// build exercises the image pipeline. Both paths are gitignored; the
// eleventy configs use setUseGitIgnore(false) so they still build.
function injectFixtures() {
  fs.mkdirSync(path.dirname(FIXTURE_IMAGE), { recursive: true });
  fs.copyFileSync(SOURCE_IMAGE, FIXTURE_IMAGE);
  fs.writeFileSync(
    FIXTURE_NODE,
    `---
title: Zz Test Fixture
date: 2026-07-31
---
A node used by build tests. Do not commit.

![A purple rectangle](/assets/img/garden/zz-test-fixture.jpg)
`,
  );
}

function cleanupFixtures() {
  fs.rmSync(FIXTURE_NODE, { force: true });
  fs.rmSync(FIXTURE_IMAGE, { force: true });
}

module.exports = { injectFixtures, cleanupFixtures };
```

- [ ] **Step 5: Extend the www test (write failing assertions first)**

In `test/site-build.test.js`, import the helper and inject fixtures around the build:

```js
const { injectFixtures, cleanupFixtures } = require('./helpers/fixtures.js');
```

Change the hooks:

```js
  before(() => {
    injectFixtures();
    out = runBuild();
  });

  after(() => {
    cleanupFixtures();
    fs.rmSync(out, { recursive: true, force: true });
  });
```

Add tests:

```js
  it('renders node images through the responsive image pipeline', () => {
    const html = fs.readFileSync(
      path.join(out, 'garden', 'zz-test-fixture', 'index.html'),
      'utf-8',
    );
    assert.match(html, /<picture>/);
    assert.match(html, /srcset="[^"]*\/img\/[^"]*\.webp[^"]*"/);
    assert.match(html, /loading="lazy"/);
    assert.match(html, /alt="A purple rectangle"/);
  });

  it('writes generated image variants to /img/', () => {
    const imgDir = path.join(out, 'img');
    assert.ok(fs.existsSync(imgDir), '_site/img missing');
    const files = fs.readdirSync(imgDir);
    assert.ok(
      files.some((f) => f.endsWith('.webp')),
      `no webp variants in ${files.join(', ')}`,
    );
  });
```

- [ ] **Step 6: Run tests to verify the new assertions fail before the plugin, pass after**

Run: `npm test`
Expected: PASS. (If you wrote the test before Step 1's plugin registration, verify it failed then — TDD order is Steps 5→1 if you prefer; either way both states must be observed: no-plugin = fail, plugin = pass. Temporarily commenting out the `addPlugin` call is an acceptable way to observe the failing state.)

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .eleventy.js .gitignore test/
git commit -m "Render node images responsively via eleventy-img transform"
```

---

### Task 5: og:image from first body image

**Files:**
- Modify: `.eleventy.js` (add `firstImage` filter)
- Modify: `includes/head.html` (og:image logic)
- Modify: `test/site-build.test.js`

**Interfaces:**
- Consumes: fixture node from Task 4 (alt `A purple rectangle`, image `/assets/img/garden/zz-test-fixture.jpg`); `page.rawInput` from Eleventy 3; `site.baseurl` = `https://garden.travisbriggs.com` (no trailing slash) from `_data/site.json`; `type` = `garden` set by `garden/garden.11tydata.js`.
- Produces: og:image is always an absolute URL on every page.

- [ ] **Step 1: Write the failing tests**

Add to the `www build` describe block in `test/site-build.test.js`:

```js
  it('uses the first body image as og:image for nodes that have one', () => {
    const html = fs.readFileSync(
      path.join(out, 'garden', 'zz-test-fixture', 'index.html'),
      'utf-8',
    );
    assert.match(
      html,
      /<meta property="og:image" content="https:\/\/garden\.travisbriggs\.com\/assets\/img\/garden\/zz-test-fixture\.jpg">/,
    );
  });

  it('falls back to an absolute avatar og:image for nodes without images', () => {
    const html = fs.readFileSync(
      path.join(out, 'garden', 'ai', 'index.html'),
      'utf-8',
    );
    assert.match(
      html,
      /<meta property="og:image" content="https:\/\/garden\.travisbriggs\.com\/assets\/avatar\.jpg">/,
    );
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: the two new tests FAIL (current og:image is the relative `/assets/avatar.jpg` on every page).

- [ ] **Step 3: Add the `firstImage` filter in `.eleventy.js`**

```js
// Extracts the first site-local image path from raw markdown, for og:image.
// External (http...) images are skipped: og:image must live on our domain
// so head.html can prepend the baseurl.
eleventyConfig.addFilter('firstImage', (rawInput) => {
  if (!rawInput) return null;
  const pattern = /!\[[^\]]*\]\(\s*([^)\s]+)(?:\s[^)]*)?\)|<img[^>]*\ssrc=["']([^"']+)["']/gi;
  for (const match of rawInput.matchAll(pattern)) {
    const url = match[1] || match[2];
    if (url && url.startsWith('/')) {
      return url;
    }
  }
  return null;
});
```

- [ ] **Step 4: Use it in `includes/head.html`**

Replace the line:

```html
<meta property="og:image" content="/assets/avatar.jpg">
```

with:

```html
{% assign ogimage = "/assets/avatar.jpg" %}
{% if type == "garden" %}
    {% assign firstimg = page.rawInput | firstImage %}
    {% if firstimg %}{% assign ogimage = firstimg %}{% endif %}
{% endif %}
<meta property="og:image" content="{{ ogimage | prepend: site.baseurl }}">
```

(Note the file's existing style: Liquid assigns at top, meta tags below — placing the assign block with the other assigns at the top of the file is preferred.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, including both new tests.

- [ ] **Step 6: Commit**

```bash
git add .eleventy.js includes/head.html test/site-build.test.js
git commit -m "Derive og:image from first node image, absolute URLs"
```

---

### Task 6: gemdown — recover published 0.7.0 source

**Files (all in `/home/tmoney/code/starred/gemdown`):**
- Modify: `lib/`, `spec/`, `testdata/`, `package.json`, possibly `example.js`/`README.md` — synced from the published 0.7.0 tarball

**Interfaces:**
- Consumes: the published 0.7.0 files at `/home/tmoney/code/starred/travisbriggs.com/node_modules/gemdown/`.
- Produces: gemdown repo `main` at version 0.7.0, tests green — the base Task 7 builds on.

- [ ] **Step 1: Fast-forward local main**

```bash
cd /home/tmoney/code/starred/gemdown
git checkout main
git merge --ff-only origin/main
```

Expected: fast-forward from 0.4.0-era commit to `a055e93` (0.6.0). The working tree was verified clean during planning; if it isn't, stop and reassess.

- [ ] **Step 2: Port the published 0.7.0 files**

```bash
PUB=/home/tmoney/code/starred/travisbriggs.com/node_modules/gemdown
diff -r lib "$PUB/lib"; diff -r spec "$PUB/spec"; diff -r testdata "$PUB/testdata"; diff "$PUB/package.json" package.json
rsync -a --exclude node_modules "$PUB/lib/" lib/
rsync -a "$PUB/spec/" spec/
rsync -a "$PUB/testdata/" testdata/
```

Review the diffs first: expected content is the blockquote link-footer handling in `lib/extensions.js` plus quote-style/formatting churn (the tarball was formatted with double quotes). Set `"version": "0.7.0"` in `package.json`. Do not port `node_modules` or lockfiles from the tarball. If `README.md`/`example.js` differ meaningfully, port those too.

- [ ] **Step 3: Normalize formatting to the repo's prettier config**

```bash
npm install
npx prettier --write lib spec
```

- [ ] **Step 4: Run the test suite**

Run: `npm test` (jasmine)
Expected: PASS. Golden specs (`spec/goldens.spec.js`) compare against `testdata/gemini/*.gmi` — if prettier-only changes broke nothing, all green. If a golden fails, the port was incomplete: re-diff against `$PUB`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Restore published 0.7.0 source from npm tarball

The 0.7.0 release (blockquote link-footer handling) was published to npm
in Sept 2023 but never pushed to GitHub. Ported back from the published
tarball."
```

---

### Task 7: gemdown — image support, 0.8.0, publish

**Files (all in `/home/tmoney/code/starred/gemdown`):**
- Modify: `lib/extensions.js`
- Create: `spec/images.spec.js`
- Modify: `package.json` (version 0.8.0), `README.md`

**Interfaces:**
- Consumes: Task 6's restored 0.7.0 code. Key internals in `lib/extensions.js`: `extractLinks(tokens, startIndex)` splices inline `link` tokens into `text[n]` markers and collects them; `walkTokens(token)` appends footer lines `=> ${href} ${n}: ${href}` as a text token at the end of each paragraph/list.
- Produces: gemdown 0.8.0 on npm where `![alt](href)` renders as inline `alt[n]` with footer `=> href n: alt` (href stands in for missing alt). Task 8 depends on the published version.

- [ ] **Step 1: Observe current link output format (informs exact spec expectations)**

```bash
cd /home/tmoney/code/starred/gemdown
node -e "import('./lib/index.js').then(m => console.log(JSON.stringify(m.md2gemini('See [my site](https://example.com) here.'))))"
```

Note the exact whitespace/newline shape — image expectations below must mirror it precisely (adjust the expected strings' leading/trailing newlines to match what links do, keeping the substantive format `=> href n: label`).

- [ ] **Step 2: Write the failing specs**

Create `spec/images.spec.js`:

```js
import { md2gemini } from '../lib/index.js';

describe('images', () => {
  it('renders an inline image as a marker plus a footer link line', () => {
    const gemtext = md2gemini('Check out ![A cool cat](/img/cat.jpg) my cat.');
    expect(gemtext).toContain('Check out A cool cat[1] my cat.');
    expect(gemtext).toContain('=> /img/cat.jpg 1: A cool cat');
    expect(gemtext).not.toContain('[IMAGE OMITTED!]');
  });

  it('uses the href as the label when alt text is empty', () => {
    const gemtext = md2gemini('![](/img/cat.jpg)');
    expect(gemtext).toContain('=> /img/cat.jpg 1: /img/cat.jpg');
  });

  it('numbers images and links in the same sequence', () => {
    const gemtext = md2gemini(
      'A [link](https://example.com) and ![a pic](/img/p.png) together.',
    );
    expect(gemtext).toContain('=> https://example.com 1:');
    expect(gemtext).toContain('=> /img/p.png 2: a pic');
  });

  it('extracts images inside list items', () => {
    const gemtext = md2gemini('* item with ![diagram](/img/d.svg)\n* plain item');
    expect(gemtext).toContain('=> /img/d.svg 1: diagram');
  });
});
```

- [ ] **Step 3: Run specs to verify they fail**

Run: `npm test`
Expected: the four new specs FAIL (current output contains `[IMAGE OMITTED!]` and no footer lines).

- [ ] **Step 4: Implement**

In `lib/extensions.js`:

(a) In `extractLinksInner`, extend the link branch to images. Replace:

```js
      if (child.type === 'link') {
        const text = `${child.text}[${++startIndex}]`;
        tokens.splice(i, 1, { type: 'text', raw: text, text });
        links.push(child);
      } else if (child.tokens) {
```

with:

```js
      if (child.type === 'link' || child.type === 'image') {
        const isImage = child.type === 'image';
        const inline = isImage ? child.text || child.href : child.text;
        const text = `${inline}[${++startIndex}]`;
        tokens.splice(i, 1, { type: 'text', raw: text, text });
        links.push({ href: child.href, label: isImage ? child.text : null });
      } else if (child.tokens) {
```

(b) In `walkTokens`, the footer loop currently reads:

```js
    outputLinks.push(`=> ${link.href} ${i + 1}: ${link.href}`);
```

Replace with:

```js
    outputLinks.push(`=> ${link.href} ${i + 1}: ${link.label || link.href}`);
```

(c) The renderer fallback (for images in contexts extraction doesn't reach). Replace:

```js
  image(href, title, text) {
    return '[IMAGE OMITTED!]';
  },
```

with:

```js
  image(href, title, text) {
    return text || '';
  },
```

(Exact quote style: match whatever prettier produced in Task 6.)

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: ALL specs pass — the four new ones plus every pre-existing spec and golden. If a golden regressed, images appeared in existing testdata; inspect whether the new output is correct and regenerate that golden only if the change is the intended image behavior.

- [ ] **Step 6: Bump version, document, commit**

- `package.json` version → `0.8.0`.
- README: in the options/overview area, add a short "Images" section: images render as numbered footer link lines like regular links, labeled with their alt text.

```bash
git add -A
git commit -m "Render images as gemtext footer links; version 0.8.0"
git push origin main
```

- [ ] **Step 7: Publish (MANUAL AUTH GATE)**

```bash
npm whoami
```

If this errors (not logged in): **STOP. Report back that npm auth is needed and ask the user to run `npm login`** (suggest they run `! cd ~/code/starred/gemdown && npm login` in the session). Do not attempt to work around auth.

Once authed:

```bash
npm publish
npm view gemdown@0.8.0 version
```

Expected: `0.8.0` printed from the registry.

---

### Task 8: Site consumes gemdown 0.8.0; Gemini ships images

**Files (site repo):**
- Modify: `package.json` / `package-lock.json` (gemdown ^0.8.0)
- Modify: `.eleventy.gemini.js` (passthrough for garden images)
- Modify: `test/gemini-build.test.js`

**Interfaces:**
- Consumes: gemdown 0.8.0 from npm (Task 7); `injectFixtures`/`cleanupFixtures` from Task 4 (fixture alt text `A purple rectangle`).
- Produces: `_gemini/assets/img/garden/` in the Gemini output → shipped by `deploy_gemini.sh`'s existing rsync.

- [ ] **Step 1: Write the failing tests**

In `test/gemini-build.test.js`, add the fixture injection (same pattern as the www suite):

```js
const { injectFixtures, cleanupFixtures } = require('./helpers/fixtures.js');
```

```js
  before(() => {
    injectFixtures();
    out = runBuild({ config: '.eleventy.gemini.js' });
  });

  after(() => {
    cleanupFixtures();
    fs.rmSync(out, { recursive: true, force: true });
  });
```

Add tests:

```js
  it('renders node images as gemtext link lines', () => {
    const gmi = fs.readFileSync(
      path.join(out, 'garden', 'zz-test-fixture', 'index.gmi'),
      'utf-8',
    );
    assert.match(
      gmi,
      /^=> \/assets\/img\/garden\/zz-test-fixture\.jpg .*A purple rectangle$/m,
    );
    assert.doesNotMatch(gmi, /IMAGE OMITTED/);
  });

  it('copies garden images into the gemini output', () => {
    assert.ok(
      fs.existsSync(
        path.join(out, 'assets', 'img', 'garden', 'zz-test-fixture.jpg'),
      ),
    );
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: the two new Gemini tests FAIL (`[IMAGE OMITTED!]` from gemdown 0.7.0, no copied image).

- [ ] **Step 3: Update gemdown and add the passthrough**

```bash
npm install gemdown@^0.8.0
```

In `.eleventy.gemini.js`, next to the existing `addPassthroughCopy('./index.gmi')`:

```js
  // Ship original garden images to the capsule (the `assets/*` ignore only
  // excludes templates; passthrough copies are separate).
  eleventyConfig.addPassthroughCopy('assets/img/garden');
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all suites.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .eleventy.gemini.js test/gemini-build.test.js
git commit -m "Gemini: render node images as link lines, ship image files"
```

---

### Task 9: CMS image upload endpoint

**Files:**
- Create: `cms/server/routes/images.js`
- Modify: `cms/server/index.js`
- Modify: `cms/package.json` (add multer)
- Create: `cms/test/server/images.test.js`

**Interfaces:**
- Consumes: `createApp()` export pattern from `cms/server/index.js`; env-var config pattern (`GARDEN_PATH`, now also `IMAGES_PATH`).
- Produces: `POST /api/images` — multipart field `image`; 201 `{ path: "/assets/img/garden/<name>" }`; 400 no file; 415 bad type. Task 10's frontend calls this.

- [ ] **Step 1: Write the failing tests**

Create `cms/test/server/images.test.js` (ESM — `cms/` is `"type": "module"`; mirror `files.test.js`'s `startApp` pattern):

```js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let server;
let base;
let imagesDir;

async function startApp() {
  imagesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cms-images-'));
  process.env.IMAGES_PATH = imagesDir;
  process.env.API_PORT = '0';
  const { createApp } = await import('../../server/index.js');
  const app = createApp();
  return new Promise((resolve) => {
    const srv = app.listen(0, () => {
      resolve({
        server: srv,
        base: `http://localhost:${srv.address().port}`,
      });
    });
  });
}

function jpegUpload(filename, type = 'image/jpeg') {
  const fd = new FormData();
  fd.append('image', new Blob([Buffer.from('fake image bytes')], { type }), filename);
  return fd;
}

describe('POST /api/images', () => {
  before(async () => {
    ({ server, base } = await startApp());
  });

  after(() => {
    server.close();
    fs.rmSync(imagesDir, { recursive: true, force: true });
  });

  it('saves an upload under a slugified name and returns its site path', async () => {
    const res = await fetch(`${base}/api/images`, {
      method: 'POST',
      body: jpegUpload('My Cool Photo.JPG'),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.path, '/assets/img/garden/my-cool-photo.jpg');
    assert.ok(fs.existsSync(path.join(imagesDir, 'my-cool-photo.jpg')));
  });

  it('suffixes colliding names', async () => {
    const res = await fetch(`${base}/api/images`, {
      method: 'POST',
      body: jpegUpload('My Cool Photo.JPG'),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.path, '/assets/img/garden/my-cool-photo-2.jpg');
  });

  it('neutralizes path traversal in filenames', async () => {
    const res = await fetch(`${base}/api/images`, {
      method: 'POST',
      body: jpegUpload('../../evil.jpg'),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.path, '/assets/img/garden/evil.jpg');
    assert.ok(fs.existsSync(path.join(imagesDir, 'evil.jpg')));
  });

  it('rejects non-image uploads', async () => {
    const res = await fetch(`${base}/api/images`, {
      method: 'POST',
      body: jpegUpload('notes.txt', 'text/plain'),
    });
    assert.equal(res.status, 415);
  });

  it('rejects requests with no file', async () => {
    const res = await fetch(`${base}/api/images`, { method: 'POST' });
    assert.equal(res.status, 400);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd cms && npm test`
Expected: images tests FAIL with 404s (route doesn't exist). Pre-existing `files.test.js` stays green.

- [ ] **Step 3: Implement**

```bash
cd cms && npm install multer
```

Create `cms/server/routes/images.js`:

```js
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
```

In `cms/server/index.js`:

```js
import { imageRoutes } from './routes/images.js';
```

and after the existing `app.use('/api', fileRoutes());`:

```js
  app.use('/api', imageRoutes());
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd cms && npm test`
Expected: PASS — new images suite and pre-existing files suite.

- [ ] **Step 5: Commit**

```bash
git add cms/server cms/test cms/package.json cms/package-lock.json
git commit -m "CMS: image upload endpoint"
```

---

### Task 10: CMS editor upload UI (drag-drop, paste, button)

**Files:**
- Modify: `cms/src/api.js`
- Modify: `cms/src/components/MarkdownEditor.vue`

**Interfaces:**
- Consumes: `POST /api/images` from Task 9 (`{ path }` response); `MarkdownEditor.vue`'s existing structure — `view` (shallowRef of EditorView), extension list in `onMounted`, `EditorView.domEventHandlers` pattern (see `wikilinkClickHandler`).
- Produces: authoring flow — image dropped/pasted/picked → uploaded → `![](/assets/img/garden/<name>)` inserted with cursor inside the `[]`.

- [ ] **Step 1: Add the API helper**

Append to `cms/src/api.js`:

```js
export async function uploadImage(file) {
  const fd = new FormData();
  fd.append('image', file, file.name || 'image');
  const res = await fetch(`${BASE}/images`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error(`Failed to upload image: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 2: Add upload handling to `MarkdownEditor.vue`**

In the `<script setup>` block:

```js
import { uploadImage } from '../api.js';

async function uploadAndInsert(file, editorView, pos) {
  try {
    const { path: imagePath } = await uploadImage(file);
    const insert = `![](${imagePath})`;
    editorView.dispatch({
      changes: { from: pos, insert },
      selection: { anchor: pos + 2 },
    });
    editorView.focus();
  } catch (err) {
    alert(`Image upload failed: ${err.message}`);
  }
}

const imageUploadHandlers = EditorView.domEventHandlers({
  drop(event, editorView) {
    const files = [...(event.dataTransfer?.files || [])].filter((f) =>
      f.type.startsWith('image/'),
    );
    if (!files.length) return false;
    event.preventDefault();
    const pos =
      editorView.posAtCoords({ x: event.clientX, y: event.clientY }) ??
      editorView.state.selection.main.head;
    uploadAndInsert(files[0], editorView, pos);
    return true;
  },
  paste(event, editorView) {
    const item = [...(event.clipboardData?.items || [])].find(
      (i) => i.kind === 'file' && i.type.startsWith('image/'),
    );
    if (!item) return false;
    event.preventDefault();
    uploadAndInsert(item.getAsFile(), editorView, editorView.state.selection.main.head);
    return true;
  },
});

const fileInput = ref(null);

function pickImage() {
  fileInput.value?.click();
}

function onFilePicked(event) {
  const file = event.target.files?.[0];
  if (file && view.value) {
    uploadAndInsert(file, view.value, view.value.state.selection.main.head);
  }
  event.target.value = '';
}
```

Register `imageUploadHandlers` in the extensions array in `onMounted` (next to `wikilinkClickHandler`).

- [ ] **Step 3: Add the button to the template**

Read the component's existing `<template>` (lines ~100-117) and add, above the editor element, matching the component's existing styling approach:

```html
  <div class="editor-toolbar">
    <button type="button" title="Insert image" @click="pickImage">📷 Image</button>
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      style="display: none"
      @change="onFilePicked"
    />
  </div>
```

Style the toolbar minimally and consistently with the editor's existing dark theme (muted background, small button).

- [ ] **Step 4: Verify**

- Run: `cd cms && npm test` — server tests still PASS.
- Run: `cd cms && npm run build` — Vite production build succeeds (this catches template/syntax errors without needing a browser).

- [ ] **Step 5: Commit**

```bash
git add cms/src
git commit -m "CMS: drag-drop, paste and button image upload in editor"
```

---

### Task 11: Documentation

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-07-31-garden-images-design.md` (status line)

**Interfaces:**
- Consumes: everything shipped in Tasks 1-10.

- [ ] **Step 1: Update the site README**

- In **Developing**, after the dev-server instructions, add a short **Testing** subsection: `npm test` runs build-integration tests (www + Gemini builds into temp dirs; they set `DISABLE_MASTODON=1` so no statuses are posted). Note the standing warning: ad-hoc builds should use `DISABLE_MASTODON=1` unless you intend to post.
- Add an **Images** subsection: put files in `assets/img/garden/`, reference with `![alt text](/assets/img/garden/name.jpg)`; www renders responsive variants via `@11ty/eleventy-img`; the first body image becomes the node's `og:image`; Gemini renders images as `=>` link lines and serves the originals.
- In the **CMS** paragraph's feature list, add image upload (drag-drop, paste, or 📷 button).
- Mention the Eleventy 3 upgrade only implicitly (no history section needed).

- [ ] **Step 2: Mark the spec implemented**

In the spec file header, change `**Status:** Approved design, pending spec review` to `**Status:** Implemented 2026-07-31`.

- [ ] **Step 3: Run the full suites one last time**

Run: `npm test && (cd cms && npm test)`
Expected: everything PASS.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/superpowers/specs/2026-07-31-garden-images-design.md
git commit -m "Document image support and test suite"
```
