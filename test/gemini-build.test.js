const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { describe, it, before, after } = require('node:test');
const { runBuild } = require('./helpers/build.js');
const { injectFixtures, cleanupFixtures } = require('./helpers/fixtures.js');

describe('gemini build', () => {
  let out;

  before(() => {
    injectFixtures();
    out = runBuild({ config: '.eleventy.gemini.js' });
  });

  after(() => {
    cleanupFixtures();
    fs.rmSync(out, { recursive: true, force: true });
  });

  it('builds a full set of garden nodes as .gmi', () => {
    const entries = fs.readdirSync(path.join(out, 'garden'));
    assert.ok(
      entries.length >= 83,
      `expected >= 83 garden pages, got ${entries.length}`,
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
});
