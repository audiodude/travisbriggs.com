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

export async function getBacklinks(path) {
  const res = await fetch(`${BASE}/backlinks/${path}`);
  if (!res.ok) throw new Error(`Failed to get backlinks: ${res.status}`);
  return res.json();
}

export async function deleteFile(path) {
  const res = await fetch(`${BASE}/files/${path}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete file: ${res.status}`);
  return res.json();
}

export async function listSlugs() {
  const res = await fetch(`${BASE}/slugs`);
  if (!res.ok) throw new Error(`Failed to list slugs: ${res.status}`);
  return res.json();
}

export async function uploadImage(file) {
  const fd = new FormData();
  fd.append('image', file, file.name || 'image');
  const res = await fetch(`${BASE}/images`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error(`Failed to upload image: ${res.status}`);
  return res.json();
}
