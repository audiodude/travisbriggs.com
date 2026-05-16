<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { listFiles, getBacklinks } from '../api.js';

const ELEVENTY_URL = import.meta.env.VITE_ELEVENTY_DEV_URL || 'http://localhost:8080';

const route = useRoute();
const backlinksTarget = ref(route.query.backlinks || '');
const backlinkSlugs = ref(null);

const files = ref([]);
const loading = ref(true);
const activeTab = ref(backlinksTarget.value ? 'backlinks' : 'all');
const filterText = ref('');
const filterQuality = ref('');
const filterImportance = ref('');
const sortKey = ref('updated');
const sortAsc = ref(false);

onMounted(async () => {
  const [allFiles, bl] = await Promise.all([
    listFiles(),
    backlinksTarget.value ? getBacklinks(backlinksTarget.value) : Promise.resolve(null),
  ]);
  files.value = allFiles;
  backlinkSlugs.value = bl;
  loading.value = false;
});

const stubCount = computed(() => files.value.filter((f) => f.quality === 'Stub').length);

const filtered = computed(() => {
  let result = files.value;

  if (activeTab.value === 'stubs') {
    result = result.filter((f) => f.quality === 'Stub');
  } else if (activeTab.value === 'backlinks' && backlinkSlugs.value) {
    result = result.filter((f) => backlinkSlugs.value.includes(f.path));
  }

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
    <div class="tab-bar">
      <button :class="['tab', { active: activeTab === 'all' }]" @click="activeTab = 'all'">
        All Pages
      </button>
      <button :class="['tab', { active: activeTab === 'stubs' }]" @click="activeTab = 'stubs'">
        Stubs <span class="tab-count">{{ stubCount }}</span>
      </button>
      <button
        v-if="backlinkSlugs"
        :class="['tab', { active: activeTab === 'backlinks' }]"
        @click="activeTab = 'backlinks'"
      >
        Backlinks to {{ backlinksTarget }} <span class="tab-count">{{ backlinkSlugs.length }}</span>
      </button>
    </div>

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
          <th @click="toggleSort('date')">Created{{ sortIndicator('date') }}</th>
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
          <td>{{ file.date || '' }}</td>
          <td>{{ file.updated || '' }}</td>
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
.tab-bar {
  display: flex;
  gap: 0;
  margin-bottom: 1rem;
  border-bottom: 2px solid #3a3e48;
}

.tab {
  padding: 0.5rem 1.25rem;
  border: none;
  background: none;
  font-size: 0.9rem;
  font-weight: 600;
  color: #707888;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.15s, border-color 0.15s;
}

.tab:hover {
  color: #a0a8b8;
}

.tab.active {
  color: #6aa8e8;
  border-bottom-color: #6aa8e8;
}

.tab-count {
  display: inline-block;
  background: #2e3240;
  color: #8890a0;
  font-size: 0.75rem;
  padding: 0.05rem 0.45rem;
  border-radius: 10px;
  margin-left: 0.3rem;
}

.tab.active .tab-count {
  background: #1e2e48;
  color: #6aa8e8;
}

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
  border: 1px solid #404550;
  border-radius: 4px;
  font-size: 0.9rem;
  background: #282c34;
  color: #d0d4dc;
}

select {
  padding: 0.5rem;
  border: 1px solid #404550;
  border-radius: 4px;
  font-size: 0.9rem;
  background: #282c34;
  color: #d0d4dc;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: #242830;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

thead th {
  background: #1e222a;
  border-bottom: 2px solid #3a3e48;
  padding: 0.6rem 0.75rem;
  text-align: left;
  font-size: 0.8rem;
  text-transform: uppercase;
  color: #8890a0;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

thead th:hover {
  background: #282c36;
}

tbody td {
  padding: 0.6rem 0.75rem;
  border-bottom: 1px solid #2e3240;
  font-size: 0.9rem;
}

tbody tr:hover {
  background: #2c3040;
}

.path-cell {
  color: #707888;
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
  background: #1e3018;
  color: #7cc460;
}

.badge-importance {
  background: #301830;
  color: #c87cc8;
}

a {
  color: #6aa8e8;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
</style>
