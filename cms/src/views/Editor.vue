<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getFile, saveFile, listSlugs } from '../api.js';
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

onMounted(async () => {
  const data = await getFile(filePath);
  frontmatter.value = data.frontmatter;
  body.value = data.body;
  loading.value = false;
});

async function save() {
  saving.value = true;
  message.value = '';
  try {
    await saveFile(filePath, frontmatter.value, body.value);
    message.value = 'Saved.';
    setTimeout(() => (message.value = ''), 2000);
  } catch (e) {
    message.value = `Error: ${e.message}`;
  } finally {
    saving.value = false;
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
      <a :href="previewUrl()" target="_blank" class="preview-link" title="Open in Eleventy dev server">
        Preview ↗
      </a>
    </div>

    <p v-if="loading">Loading...</p>

    <template v-else>
      <FrontmatterForm v-model="frontmatter" />
      <MarkdownEditor v-model="body" :slugs="slugs" />

      <div class="editor-actions">
        <button @click="save" :disabled="saving" class="save-btn">
          {{ saving ? 'Saving...' : 'Save' }}
        </button>
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
  color: #4a90d9;
  text-decoration: none;
  font-size: 0.9rem;
}

.back-link:hover {
  text-decoration: underline;
}

.editor-path {
  font-family: monospace;
  font-size: 0.85rem;
  color: #888;
}

.preview-link {
  margin-left: auto;
  color: #4a90d9;
  text-decoration: none;
  font-size: 0.85rem;
}

.preview-link:hover {
  text-decoration: underline;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.save-btn {
  padding: 0.5rem 1.5rem;
  background: #4a90d9;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
  cursor: pointer;
}

.save-btn:hover {
  background: #3a7ac0;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.save-message {
  font-size: 0.85rem;
  color: #2a7a2a;
}
</style>
