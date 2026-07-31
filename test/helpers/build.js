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
// `env` entries override those defaults (fixture-leak.test.js clears
// DISABLE_MASTODON on purpose, pointing MASTODON_API_BASE at a closed
// port so the posting path can never reach the real network).
function runBuild({ config, env } = {}) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'garden-build-'));
  const args = ['eleventy', `--output=${outDir}`];
  if (config) {
    args.push(`--config=${config}`);
  }
  const result = spawnSync('npx', args, {
    cwd: ROOT,
    env: {
      ...process.env,
      DISABLE_MASTODON: '1',
      MASTODON_API_KEY: '',
      ...env,
    },
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
