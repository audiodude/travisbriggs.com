<script setup>
import { computed } from 'vue';

const QUALITY_OPTIONS = ['', 'FA', 'GA', 'B', 'Start', 'Stub'];
const IMPORTANCE_OPTIONS = ['', 'Top', 'High', 'Mid', 'Low'];
const KNOWN_KEYS = ['title', 'date', 'updated', 'quality', 'importance'];

const props = defineProps({
  modelValue: { type: Object, required: true },
});

const emit = defineEmits(['update:modelValue']);

function update(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value });
}

const extraFields = computed(() => {
  return Object.entries(props.modelValue).filter(
    ([key]) => !KNOWN_KEYS.includes(key)
  );
});

function updateExtra(key, value) {
  update(key, value);
}

function formatDate(val) {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString().split('T')[0];
  return String(val).split('T')[0];
}
</script>

<template>
  <div class="frontmatter-form">
    <div class="form-row">
      <label>
        Title
        <input
          type="text"
          :value="modelValue.title || ''"
          @input="update('title', $event.target.value)"
        />
      </label>
    </div>

    <div class="form-row form-row--inline">
      <label>
        Date
        <input
          type="date"
          :value="formatDate(modelValue.date)"
          @input="update('date', $event.target.value)"
        />
      </label>

      <label>
        Updated
        <input
          type="date"
          :value="formatDate(modelValue.updated)"
          @input="update('updated', $event.target.value)"
        />
      </label>

      <label>
        Quality
        <select
          :value="modelValue.quality || ''"
          @change="update('quality', $event.target.value || undefined)"
        >
          <option v-for="q in QUALITY_OPTIONS" :key="q" :value="q">
            {{ q || '—' }}
          </option>
        </select>
      </label>

      <label>
        Importance
        <select
          :value="modelValue.importance || ''"
          @change="update('importance', $event.target.value || undefined)"
        >
          <option v-for="i in IMPORTANCE_OPTIONS" :key="i" :value="i">
            {{ i || '—' }}
          </option>
        </select>
      </label>
    </div>

    <div v-for="[key, val] in extraFields" :key="key" class="form-row">
      <label>
        {{ key }}
        <input type="text" :value="val" @input="updateExtra(key, $event.target.value)" />
      </label>
    </div>
  </div>
</template>

<style scoped>
.frontmatter-form {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.form-row {
  margin-bottom: 0.75rem;
}

.form-row--inline {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.form-row--inline label {
  flex: 1;
  min-width: 140px;
}

label {
  display: flex;
  flex-direction: column;
  font-size: 0.8rem;
  font-weight: 600;
  color: #555;
  gap: 0.25rem;
}

input,
select {
  font-size: 0.95rem;
  padding: 0.4rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-family: inherit;
}

input:focus,
select:focus {
  outline: 2px solid #4a90d9;
  outline-offset: 1px;
}
</style>
