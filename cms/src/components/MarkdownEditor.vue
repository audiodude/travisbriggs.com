<script setup>
import { ref, onMounted, watch, shallowRef } from 'vue';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { autocompletion } from '@codemirror/autocomplete';
import { basicSetup } from 'codemirror';
import { wikilinkCompletion } from '../codemirror/wikilink.js';

const props = defineProps({
  modelValue: { type: String, default: '' },
  slugs: { type: Promise, required: true },
});

const emit = defineEmits(['update:modelValue']);
const editorEl = ref(null);
const view = shallowRef(null);

onMounted(() => {
  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      emit('update:modelValue', update.state.doc.toString());
    }
  });

  view.value = new EditorView({
    parent: editorEl.value,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        basicSetup,
        markdown(),
        autocompletion({
          override: [wikilinkCompletion(props.slugs)],
        }),
        updateListener,
        EditorView.theme({
          '&': { fontSize: '0.95rem' },
          '.cm-content': { fontFamily: 'monospace', minHeight: '400px' },
          '.cm-editor': { border: '1px solid #ccc', borderRadius: '4px' },
          '&.cm-focused': { outline: '2px solid #4a90d9' },
        }),
      ],
    }),
  });
});

watch(
  () => props.modelValue,
  (newVal) => {
    if (view.value && view.value.state.doc.toString() !== newVal) {
      view.value.dispatch({
        changes: { from: 0, to: view.value.state.doc.length, insert: newVal },
      });
    }
  }
);
</script>

<template>
  <div ref="editorEl" class="markdown-editor"></div>
</template>

<style scoped>
.markdown-editor {
  margin-bottom: 1rem;
}
</style>
