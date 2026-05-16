<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { createFile, listSlugs } from '../api.js';
import FrontmatterForm from '../components/FrontmatterForm.vue';
import MarkdownEditor from '../components/MarkdownEditor.vue';

const router = useRouter();

const today = new Date().toISOString().split('T')[0];

const slug = ref('');
const slugEdited = ref(false);
const frontmatter = ref({
  title: '',
  date: today,
  quality: 'Stub',
  importance: 'Mid',
});
const body = ref('');
const creating = ref(false);
const error = ref('');
const slugs = listSlugs();

function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

watch(
  () => frontmatter.value.title,
  (title) => {
    if (!slugEdited.value) {
      slug.value = titleToSlug(title);
    }
  }
);

function onSlugInput(e) {
  slug.value = e.target.value;
  slugEdited.value = true;
}

async function create() {
  if (!frontmatter.value.title || !slug.value) {
    error.value = 'Title and slug are required.';
    return;
  }

  creating.value = true;
  error.value = '';
  try {
    await createFile(slug.value, frontmatter.value, body.value);
    router.push(`/edit/${slug.value}`);
  } catch (e) {
    error.value = e.message;
  } finally {
    creating.value = false;
  }
}
</script>

<template>
  <div class="new-page">
    <div class="new-header">
      <router-link to="/" class="back-link">← Back</router-link>
      <h1>New Page</h1>
    </div>

    <div class="slug-row">
      <label>
        Slug
        <input type="text" :value="slug" @input="onSlugInput" placeholder="auto-generated-from-title" />
      </label>
      <span class="slug-preview">→ garden/{{ slug || '...' }}.md</span>
    </div>

    <FrontmatterForm v-model="frontmatter" />
    <MarkdownEditor v-model="body" :slugs="slugs" />

    <div class="create-actions">
      <button @click="create" :disabled="creating" class="create-btn">
        {{ creating ? 'Creating...' : 'Create' }}
      </button>
      <span v-if="error" class="error-message">{{ error }}</span>
    </div>
  </div>
</template>

<style scoped>
.new-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.new-header h1 {
  font-size: 1.3rem;
  margin: 0;
}

.back-link {
  color: #6aa8e8;
  text-decoration: none;
  font-size: 0.9rem;
}

.slug-row {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;
}

.slug-row label {
  display: flex;
  flex-direction: column;
  font-size: 0.8rem;
  font-weight: 600;
  color: #8890a0;
  gap: 0.25rem;
  flex: 1;
}

.slug-row input {
  padding: 0.4rem 0.5rem;
  border: 1px solid #404550;
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: monospace;
  background: #282c34;
  color: #d0d4dc;
}

.slug-preview {
  font-family: monospace;
  font-size: 0.8rem;
  color: #707888;
  white-space: nowrap;
}

.create-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.create-btn {
  padding: 0.5rem 1.5rem;
  background: #2a7a2a;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 0.95rem;
  cursor: pointer;
}

.create-btn:hover {
  background: #236b23;
}

.create-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  font-size: 0.85rem;
  color: #e05555;
}
</style>
