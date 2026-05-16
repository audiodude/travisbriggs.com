<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getFile, saveFile, deleteFile, getBacklinks, listSlugs } from '../api.js';
import FrontmatterForm from '../components/FrontmatterForm.vue';
import MarkdownEditor from '../components/MarkdownEditor.vue';

const ELEVENTY_URL = import.meta.env.VITE_ELEVENTY_DEV_URL || 'http://localhost:8080';

const route = useRoute();
const router = useRouter();

const filePath = route.params.path;
const frontmatter = ref({});
const body = ref('');
const loading = ref(true);
const saving = ref(false);
const message = ref('');
const slugs = listSlugs();

const dirty = ref(false);
let autoSaveTimer = null;

function onKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (!saving.value && !loading.value) save();
  }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown);
  const data = await getFile(filePath);
  frontmatter.value = data.frontmatter;
  body.value = data.body;
  loading.value = false;
  watch([frontmatter, body], () => (dirty.value = true), { deep: true });
  autoSaveTimer = setInterval(() => {
    if (dirty.value && !saving.value) save({ auto: true });
  }, 15000);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  if (autoSaveTimer) clearInterval(autoSaveTimer);
});

async function save({ auto = false } = {}) {
  saving.value = true;
  if (!auto) message.value = '';
  try {
    await saveFile(filePath, frontmatter.value, body.value);
    dirty.value = false;
    message.value = auto ? 'Auto-saved.' : 'Saved.';
    setTimeout(() => (message.value = ''), 2000);
  } catch (e) {
    message.value = `Error: ${e.message}`;
  } finally {
    saving.value = false;
  }
}

async function remove() {
  try {
    const backlinks = await getBacklinks(filePath);
    const warning = backlinks.length
      ? `${backlinks.length} page${backlinks.length === 1 ? '' : 's'} link to this page. Delete "${filePath}" anyway?`
      : `Delete "${filePath}"? This cannot be undone.`;
    if (!confirm(warning)) return;
    await deleteFile(filePath);
    router.push('/');
  } catch (e) {
    message.value = `Error: ${e.message}`;
  }
}

function previewUrl() {
  return `${ELEVENTY_URL}/garden/${filePath}/`;
}
</script>

<template>
  <div class="editor-view">
    <div class="editor-header">
      <router-link to="/" class="back-link">← Back</router-link>
      <span class="editor-path">{{ filePath }}</span>
      <div class="header-links">
        <router-link :to="`/?backlinks=${filePath}`">Backlinks</router-link>
        <a :href="previewUrl()" target="_blank" title="Open in Eleventy dev server">
          Preview ↗
        </a>
      </div>
    </div>

    <p v-if="loading">Loading...</p>

    <template v-else>
      <FrontmatterForm v-model="frontmatter" />
      <MarkdownEditor v-model="body" :slugs="slugs" />

      <div class="editor-actions">
        <button @click="save" :disabled="saving" class="save-btn">
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
        <button @click="remove" class="delete-btn">Delete</button>
        <span v-if="message" class="save-message">{{ message }}</span>
      </div>
    </template>
  </div>
</template>

<style scoped>
.editor-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.back-link {
  color: #6aa8e8;
  text-decoration: none;
  font-size: 0.9rem;
}

.back-link:hover {
  text-decoration: underline;
}

.editor-path {
  font-family: monospace;
  font-size: 0.85rem;
  color: #707888;
}

.header-links {
  margin-left: auto;
  display: flex;
  gap: 1rem;
}

.header-links a {
  color: #6aa8e8;
  text-decoration: none;
  font-size: 0.85rem;
}

.header-links a:hover {
  text-decoration: underline;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.save-btn {
  padding: 0.5rem 1.5rem;
  background: #4a8ad0;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
  cursor: pointer;
}

.save-btn:hover {
  background: #3a78b8;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.delete-btn {
  padding: 0.5rem 1.5rem;
  background: transparent;
  color: #c05050;
  border: 1px solid #c05050;
  border-radius: 4px;
  font-size: 0.95rem;
  cursor: pointer;
}

.delete-btn:hover {
  background: #c05050;
  color: #fff;
}

.save-message {
  font-size: 0.85rem;
  color: #5cb85c;
}
</style>
