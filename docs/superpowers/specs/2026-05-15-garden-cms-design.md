# Garden CMS — Design Spec

A local-only Vue 3 SPA + Express API for editing the digital garden's markdown content files. Lives in `cms/` inside the existing `travisbriggs.com` repo. Completely decoupled from Eleventy — it reads and writes files in `garden/`, nothing more.

## Architecture

```
travisbriggs.com/
├── garden/                ← content directory (CMS reads/writes here)
├── .eleventy.js           ← untouched
├── cms/
│   ├── server/
│   │   └── index.js       ← Express API
│   ├── src/
│   │   ├── App.vue
│   │   ├── router.js
│   │   ├── views/
│   │   │   ├── FileList.vue
│   │   │   ├── Editor.vue
│   │   │   └── NewPage.vue
│   │   └── components/
│   │       ├── FrontmatterForm.vue
│   │       └── MarkdownEditor.vue
│   ├── package.json       ← separate from root package.json
│   └── vite.config.js
```

Two processes during development:
- Vite dev server (default port 5173) serves the Vue SPA
- Express API server (port 3001) handles file operations
- Vite proxies `/api/*` requests to Express

The Express server resolves all file paths relative to a configured garden root, which defaults to `../garden/` (relative to `cms/`).

No authentication — this is a local development tool only.

## API

All endpoints are prefixed with `/api`.

### GET /api/files

List all `.md` files in `garden/` recursively. Returns an array of objects with parsed frontmatter and file metadata.

```json
[
  {
    "path": "compost",
    "title": "Compost pile",
    "date": "2023-11-14",
    "updated": "2024-09-14",
    "quality": "B",
    "importance": "Mid"
  },
  {
    "path": "writings/introduction",
    "title": "Introduction",
    "date": "2014-09-08",
    "updated": null,
    "quality": null,
    "importance": null
  }
]
```

The `path` field is the relative path from `garden/` without the `.md` extension.

### GET /api/files/:path

Read a single file. The `:path` parameter can include slashes (e.g., `writings/introduction`). Returns parsed frontmatter and raw markdown body separately.

```json
{
  "frontmatter": {
    "title": "Compost pile",
    "date": "2023-11-14",
    "updated": "2024-09-14",
    "quality": "B",
    "importance": "Mid"
  },
  "body": "I've struggled against [[dg-reverse|Reverse Chronological Order]]..."
}
```

### PUT /api/files/:path

Write a file. Accepts frontmatter object and body string. The server serializes frontmatter to YAML and combines with body, then writes to disk.

Request body:
```json
{
  "frontmatter": {
    "title": "Compost pile",
    "date": "2023-11-14",
    "updated": "2026-05-15",
    "quality": "B",
    "importance": "Mid"
  },
  "body": "Updated content here..."
}
```

Returns `200 OK` on success.

### POST /api/files

Create a new file. Accepts a slug and initial frontmatter/body.

Request body:
```json
{
  "slug": "new-topic",
  "frontmatter": {
    "title": "New Topic",
    "date": "2026-05-15",
    "quality": "Stub",
    "importance": "Mid"
  },
  "body": ""
}
```

Creates `garden/new-topic.md`. Returns `201 Created` with the new file's path. Returns `409 Conflict` if the file already exists.

### GET /api/slugs

Lightweight endpoint for wikilink autocomplete. Returns slug and title pairs for all garden pages.

```json
[
  { "slug": "compost", "title": "Compost pile" },
  { "slug": "now", "title": "Now" },
  { "slug": "writings/introduction", "title": "Introduction" }
]
```

## Vue SPA

### Dependencies

- Vue 3 (Composition API)
- Vue Router
- CodeMirror 6 (`@codemirror/view`, `@codemirror/state`, `@codemirror/lang-markdown`, `@codemirror/autocomplete`)
- Vite

No state management library (Pinia/Vuex). Each view fetches what it needs.

### Routes

| Path | View | Purpose |
|------|------|---------|
| `/` | FileList | Browse and filter all garden pages |
| `/edit/:path(.*)` | Editor | Edit an existing page |
| `/new` | NewPage | Create a new page |

### File List View (`/`)

A sortable, filterable table of all garden nodes.

**Columns:** Title, Quality, Importance, Updated, Path, Preview Link

- Default sort: updated date, newest first
- Text filter input at top: filters across title and path
- Quality and importance can be filtered via dropdowns
- Click any row to navigate to `/edit/<path>`
- Each row has a small external-link icon pointing to the Eleventy dev server URL for that page (e.g., `http://localhost:8080/garden/<slug>/`). The dev server base URL is configurable (environment variable or a config constant).
- "New Page" button in the top-right, navigates to `/new`

### Editor View (`/edit/:path`)

Two sections stacked vertically:

**Frontmatter form (top):**
- Title: text input
- Date: date input (read-only display for existing pages, or editable)
- Updated: date input
- Quality: dropdown (FA, GA, B, Start, Stub)
- Importance: dropdown (Top, High, Mid, Low)
- Tags: comma-separated text input
- Any other frontmatter keys present in the file: shown as raw key=value text inputs (catch-all for fields like `permalink`, `include_recent`, `comments`, etc.)

**Markdown editor (below):**
- CodeMirror 6 instance with markdown syntax highlighting
- Wikilink autocomplete (see below)
- Standard editor keybindings

**Save button:** Combines frontmatter form state + editor content, PUTs to API. Updates the `updated` frontmatter field to today's date on save (or prompts/lets the user decide).

**Back link:** Returns to file list.

### New Page View (`/new`)

- Title input: required
- Slug input: auto-generated from title (lowercase, hyphenated), editable by user
- Same frontmatter form as editor, with defaults: date = today, quality = Stub, importance = Mid
- Empty CodeMirror editor
- "Create" button POSTs to API, then redirects to `/edit/<new-slug>`

### FrontmatterForm Component

Shared between Editor and NewPage views. Receives frontmatter object as a prop (or v-model). Emits changes.

Known fields get dedicated inputs with appropriate types and validation. Unknown fields render as generic text inputs with key and value.

### MarkdownEditor Component

Wraps CodeMirror 6. Props: `modelValue` (string). Emits: `update:modelValue`.

## Wikilink Autocomplete

A custom CodeMirror 6 completion source.

**Trigger:** Activates when the cursor is inside `[[...` context (after typing `[[` and before the closing `]]`).

**Data:** On editor mount, fetch `GET /api/slugs`. Cache in memory. Each entry has `slug` and `title`.

**Matching:** As the user types after `[[`, fuzzy-match against both slug and title. Display both in the dropdown: `compost — Compost pile`.

**Insertion:** Selecting an item inserts the slug, producing `[[compost]]`. The user can then manually type `|display text` if they want.

**Refresh:** The slug list is fetched once on mount. Creating a new page in another tab requires a page reload to pick up the new slug. No websocket/polling needed.

**Implementation:** Use `@codemirror/autocomplete`'s `autocompletion` extension with a custom `CompletionSource` function. Approximately 30-40 lines of code.

## Styling

Minimal, functional, tool-oriented. No need to match the garden's aesthetic. Clean defaults with plain CSS or a small utility approach. The CMS is a local dev tool, not a public-facing site.

## Configuration

- `GARDEN_PATH`: path to the garden content directory (default: `../garden/` relative to `cms/`)
- `ELEVENTY_DEV_URL`: base URL for the Eleventy dev server preview links (default: `http://localhost:8080`)
- `API_PORT`: Express server port (default: `3001`)

These can be set via environment variables or a `.env` file in `cms/`.

## Out of Scope

- No rendered preview (use Eleventy's dev server separately)
- No Mastodon/comments integration
- No Gemini output awareness
- No deployment pipeline for the CMS itself
- No file deletion (use the filesystem or git)
- No authentication or multi-user support
- No image upload or asset management
