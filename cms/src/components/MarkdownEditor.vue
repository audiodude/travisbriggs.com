<script setup>
import { ref, onMounted, watch, shallowRef } from 'vue';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { autocompletion } from '@codemirror/autocomplete';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { basicSetup } from 'codemirror';
import { wikilinkCompletion } from '../codemirror/wikilink.js';

const wikilinkClickHandler = EditorView.domEventHandlers({
  mousedown(event, view) {
    if (!(event.ctrlKey || event.metaKey)) return false;
    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos === null) return false;
    const line = view.state.doc.lineAt(pos);
    const offset = pos - line.from;
    const re = /\[\[\s?([^\[\]\|\n\r]+)(\|[^\[\]\|\n\r]+)?\s?\]\]/g;
    let match;
    while ((match = re.exec(line.text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (offset >= start && offset <= end) {
        const slug = match[1].replace(/\.(md|markdown)\s?$/i, '').trim();
        event.preventDefault();
        window.open(`/edit/${slug}`, '_blank');
        return true;
      }
    }
    return false;
  },
});

const markdownHighlight = HighlightStyle.define([
  { tag: tags.heading, color: '#e0d090', fontWeight: 'bold' },
  { tag: tags.strong, color: '#e8e8e8', fontWeight: 'bold' },
  { tag: tags.emphasis, color: '#e8e8e8', fontStyle: 'italic' },
  { tag: tags.link, color: '#7cc4e8' },
  { tag: tags.url, color: '#7cc4e8', textDecoration: 'underline' },
  { tag: tags.monospace, color: '#d8a060' },
  { tag: tags.quote, color: '#a0a8b8', fontStyle: 'italic' },
  { tag: tags.list, color: '#d0d4dc' },
  { tag: tags.meta, color: '#808890' },
  { tag: tags.processingInstruction, color: '#808890' },
  { tag: tags.contentSeparator, color: '#808890' },
]);

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
        syntaxHighlighting(markdownHighlight),
        wikilinkClickHandler,
        autocompletion({
          override: [wikilinkCompletion(props.slugs)],
        }),
        updateListener,
        EditorView.lineWrapping,
        EditorView.theme({
          '&': { fontSize: '0.95rem' },
          '.cm-content': { fontFamily: 'monospace', minHeight: '400px', color: '#d0d4dc' },
          '.cm-editor': { border: '1px solid #404550', borderRadius: '4px', backgroundColor: '#282c34' },
          '.cm-gutters': { backgroundColor: '#22252c', color: '#606878', borderRight: '1px solid #3a3e48' },
          '.cm-activeLineGutter': { backgroundColor: '#2a2e38' },
          '.cm-activeLine': { backgroundColor: '#2a2e3880' },
          '.cm-cursor': { borderLeftColor: '#d0d4dc' },
          '&.cm-focused': { outline: '2px solid #6aa8e8' },
          '.cm-selectionBackground': { backgroundColor: '#3a4560 !important' },
          '&.cm-focused .cm-selectionBackground': { backgroundColor: '#3a4560 !important' },
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
