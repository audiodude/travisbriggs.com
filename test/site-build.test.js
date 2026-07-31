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
      entries.length >= 80,
      `expected >= 80 garden pages, got ${entries.length}`,
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
