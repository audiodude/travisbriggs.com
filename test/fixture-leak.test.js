const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it, before, after, afterEach } = require('node:test');
const { runBuild, ROOT } = require('./helpers/build.js');
const { injectFixtures, cleanupFixtures } = require('./helpers/fixtures.js');

const FIXTURE_NODE = path.join(ROOT, 'garden', 'zz-test-fixture.md');
const FIXTURE_IMAGE = path.join(
  ROOT,
  'assets',
  'img',
  'garden',
  'zz-test-fixture.jpg',
);
const PREFLIGHT = path.join(ROOT, 'scripts', 'preflight-fixtures.js');

// A crashed test run can leave the injected fixture files behind in the
// live source tree. These suites prove a leaked fixture can never reach
// Mastodon: the node itself is flagged unpostable, and real builds sweep
// leaked fixtures away before Eleventy runs.

describe('preflight fixture sweep', () => {
  afterEach(() => {
    cleanupFixtures();
  });

  it('removes leaked fixture files and says so', () => {
    injectFixtures();
    const result = spawnSync('node', [PREFLIGHT], {
      cwd: ROOT,
      encoding: 'utf-8',
    });
    assert.equal(result.status, 0);
    assert.ok(!fs.existsSync(FIXTURE_NODE), 'fixture node not removed');
    assert.ok(!fs.existsSync(FIXTURE_IMAGE), 'fixture image not removed');
    assert.match(result.stderr, /leaked test fixture/i);
  });

  it('is silent when nothing leaked', () => {
    const result = spawnSync('node', [PREFLIGHT], {
      cwd: ROOT,
      encoding: 'utf-8',
    });
    assert.equal(result.status, 0);
    assert.equal(result.stderr, '');
  });

  it('runs before npm run build via the prebuild hook', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'),
    );
    assert.equal(pkg.scripts.prebuild, 'node scripts/preflight-fixtures.js');
  });

  it('runs at the top of the gemini deploy script', () => {
    const sh = fs.readFileSync(path.join(ROOT, 'deploy_gemini.sh'), 'utf-8');
    assert.match(sh, /node scripts\/preflight-fixtures\.js/);
  });
});

describe('leaked fixture cannot post to Mastodon', () => {
  let out;

  before(() => {
    injectFixtures();
    // Simulate the disaster case: a real build (no DISABLE_MASTODON) with a
    // leaked fixture present. MASTODON_API_BASE points at a closed local
    // port, so if the posting path is ever reached the fetch throws and the
    // build fails — this test then fails without any network traffic.
    try {
      out = runBuild({
        config: '.eleventy.gemini.js',
        env: {
          DISABLE_MASTODON: '',
          MASTODON_API_BASE: 'http://127.0.0.1:9',
        },
      });
    } catch (err) {
      err.message +=
        '\n\nThis build ran with Mastodon posting ENABLED (against a closed ' +
        'local port). It fails when any node reaches the posting path: ' +
        'either the testFixture guard regressed, or a garden node has no ' +
        'comments.sqlite3 row yet (i.e. a real `npm run build` would post ' +
        'for it — run that first if the new node is intentional).';
      throw err;
    }
  });

  after(() => {
    cleanupFixtures();
    fs.rmSync(out, { recursive: true, force: true });
  });

  it('builds cleanly because the fixture node is flagged unpostable', () => {
    assert.ok(
      fs.existsSync(path.join(out, 'garden', 'zz-test-fixture', 'index.gmi')),
    );
  });
});
