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
