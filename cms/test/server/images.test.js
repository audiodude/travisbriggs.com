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
