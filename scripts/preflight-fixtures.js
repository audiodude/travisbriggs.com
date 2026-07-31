// Removes test-fixture files leaked into the source tree by a crashed test
// run, before a real build can publish them (or worse, Mastodon-post them).
// Wired in as the npm `prebuild` hook and called by deploy_gemini.sh.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

const LEAKABLE = [
  path.join(ROOT, 'garden', 'zz-test-fixture.md'),
  path.join(ROOT, 'assets', 'img', 'garden', 'zz-test-fixture.jpg'),
];

for (const file of LEAKABLE) {
  if (fs.existsSync(file)) {
    fs.rmSync(file);
    console.error(
      `Removed leaked test fixture ${path.relative(ROOT, file)} ` +
        '(a test run probably crashed before cleanup)',
    );
  }
}
