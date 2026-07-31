<script setup>
import { ref, onMounted, watch, shallowRef } from 'vue';
import { EditorView, keymap } from '@codemirror/view';
import { EditorState, Prec } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { autocompletion } from '@codemirror/autocomplete';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { basicSetup } from 'codemirror';
import { wikilinkCompletion } from '../codemirror/wikilink.js';
import { uploadImage } from '../api.js';

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
  { tag: [tags.url, tags.literal, tags.string], color: '#7cc4e8', textDecoration: 'underline' },
  { tag: tags.monospace, color: '#d8a060' },
  { tag: tags.quote, color: '#a0a8b8', fontStyle: 'italic' },
  { tag: tags.list, color: '#d0d4dc' },
  { tag: tags.meta, color: '#808890' },
  { tag: tags.processingInstruction, color: '#808890' },
  { tag: tags.contentSeparator, color: '#808890' },
]);

async function uploadAndInsert(file, editorView, pos) {
  try {
    const { path: imagePath } = await uploadImage(file);
    const insert = `![](${imagePath})`;
    editorView.dispatch({
      changes: { from: pos, insert },
      selection: { anchor: pos + 2 },
    });
    editorView.focus();
  } catch (err) {
    alert(`Image upload failed: ${err.message}`);
  }
}

const imageUploadHandlers = EditorView.domEventHandlers({
  drop(event, editorView) {
    const files = [...(event.dataTransfer?.files || [])].filter((f) =>
      f.type.startsWith('image/'),
    );
    if (!files.length) return false;
    event.preventDefault();
    const pos =
      editorView.posAtCoords({ x: event.clientX, y: event.clientY }) ??
      editorView.state.selection.main.head;
    uploadAndInsert(files[0], editorView, pos);
    return true;
  },
  paste(event, editorView) {
    const item = [...(event.clipboardData?.items || [])].find(
      (i) => i.kind === 'file' && i.type.startsWith('image/'),
    );
    if (!item) return false;
    event.preventDefault();
    uploadAndInsert(item.getAsFile(), editorView, editorView.state.selection.main.head);
    return true;
  },
});

const props = defineProps({
  modelValue: { type: String, default: '' },
  slugs: { type: Promise, required: true },
});

const emit = defineEmits(['update:modelValue']);
const editorEl = ref(null);
const view = shallowRef(null);
const fileInput = ref(null);

function pickImage() {
  fileInput.value?.click();
}

function onFilePicked(event) {
  const file = event.target.files?.[0];
  if (file && view.value) {
    uploadAndInsert(file, view.value, view.value.state.selection.main.head);
  }
  event.target.value = '';
}

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
        Prec.highest(syntaxHighlighting(markdownHighlight)),
        wikilinkClickHandler,
        imageUploadHandlers,
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
  <div class="editor-toolbar">
    <button type="button" title="Insert image" @click="pickImage">📷 Image</button>
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      style="display: none"
      @change="onFilePicked"
    />
  </div>
  <div ref="editorEl" class="markdown-editor"></div>
</template>

<style scoped>
.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background-color: #22252c;
  border: 1px solid #404550;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
}

.editor-toolbar button {
  font-size: 0.85rem;
  padding: 0.2rem 0.5rem;
  color: #d0d4dc;
  background-color: #2a2e38;
  border: 1px solid #404550;
  border-radius: 4px;
  cursor: pointer;
}

.editor-toolbar button:hover {
  background-color: #3a4560;
}

.markdown-editor {
  margin-bottom: 1rem;
}

.markdown-editor :deep(.cm-editor) {
  border-radius: 0 0 4px 4px;
}
</style>
