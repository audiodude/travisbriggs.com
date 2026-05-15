<script setup>
import { ref, computed, onMounted } from 'vue';
import { listFiles } from '../api.js';

const ELEVENTY_URL = import.meta.env.VITE_ELEVENTY_DEV_URL || 'http://localhost:8080';

const files = ref([]);
const loading = ref(true);
const filterText = ref('');
const filterQuality = ref('');
const filterImportance = ref('');
const sortKey = ref('updated');
const sortAsc = ref(false);

onMounted(async () => {
  files.value = await listFiles();
  loading.value = false;
});

const filtered = computed(() => {
  let result = files.value;

  if (filterText.value) {
    const q = filterText.value.toLowerCase();
    result = result.filter(
      (f) =>
        f.title.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)
    );
  }

  if (filterQuality.value) {
    result = result.filter((f) => f.quality === filterQuality.value);
  }

  if (filterImportance.value) {
    result = result.filter((f) => f.importance === filterImportance.value);
  }

  return [...result].sort((a, b) => {
    let aVal = a[sortKey.value] || '';
    let bVal = b[sortKey.value] || '';
    if (aVal < bVal) return sortAsc.value ? -1 : 1;
    if (aVal > bVal) return sortAsc.value ? 1 : -1;
    return 0;
  });
});

function toggleSort(key) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value;
  } else {
    sortKey.value = key;
    sortAsc.value = key !== 'updated';
  }
}

function sortIndicator(key) {
  if (sortKey.value !== key) return '';
  return sortAsc.value ? ' ▲' : ' ▼';
}

function previewUrl(filePath) {
  return `${ELEVENTY_URL}/garden/${filePath}/`;
}
</script>

<template>
  <div class="file-list">
    <div class="toolbar">
      <input
        v-model="filterText"
        type="text"
        placeholder="Filter by title or path..."
        class="filter-input"
      />
      <select v-model="filterQuality">
        <option value="">All Quality</option>
        <option v-for="q in ['FA', 'GA', 'B', 'Start', 'Stub']" :key="q" :value="q">
          {{ q }}
        </option>
      </select>
      <select v-model="filterImportance">
        <option value="">All Importance</option>
        <option v-for="i in ['Top', 'High', 'Mid', 'Low']" :key="i" :value="i">
          {{ i }}
        </option>
      </select>
    </div>

    <p v-if="loading">Loading...</p>

    <table v-else>
      <thead>
        <tr>
          <th @click="toggleSort('title')">Title{{ sortIndicator('title') }}</th>
          <th @click="toggleSort('quality')">Quality{{ sortIndicator('quality') }}</th>
          <th @click="toggleSort('importance')">
            Importance{{ sortIndicator('importance') }}
          </th>
          <th @click="toggleSort('updated')">Updated{{ sortIndicator('updated') }}</th>
          <th>Path</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="file in filtered" :key="file.path">
          <td>
            <router-link :to="`/edit/${file.path}`">{{ file.title }}</router-link>
          </td>
          <td>
            <span v-if="file.quality" class="badge badge-quality">{{
              file.quality
            }}</span>
          </td>
          <td>
            <span v-if="file.importance" class="badge badge-importance">{{
              file.importance
            }}</span>
          </td>
          <td>{{ file.updated || file.date || '' }}</td>
          <td class="path-cell">{{ file.path }}</td>
          <td>
            <a :href="previewUrl(file.path)" target="_blank" title="Open in Eleventy dev server">
              ↗
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.filter-input {
  flex: 1;
  min-width: 200px;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
}

select {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

thead th {
  background: #fafafa;
  border-bottom: 2px solid #e0e0e0;
  padding: 0.6rem 0.75rem;
  text-align: left;
  font-size: 0.8rem;
  text-transform: uppercase;
  color: #666;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

thead th:hover {
  background: #f0f0f0;
}

tbody td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid #eee;
  font-size: 0.9rem;
}

tbody tr:hover {
  background: #f8f9ff;
}

.path-cell {
  color: #888;
  font-family: monospace;
  font-size: 0.8rem;
}

.badge {
  display: inline-block;
  padding: 0.1rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-quality {
  background: #e8f5d4;
  color: #3a6b1e;
}

.badge-importance {
  background: #ffe4ff;
  color: #6b2b6b;
}

a {
  color: #4a90d9;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
