# Garden Images Design

**Date:** 2026-07-31
**Status:** Implemented 2026-07-31

## Goal

Garden nodes can include images. Images render responsively on the www site,
appear as link lines on the Gemini capsule, drive each node's `og:image` tag,
and can be uploaded directly from the CMS editor.

## Background

- Garden nodes are markdown files in `garden/`, rendered by Eleventy 2 with
  `markdown-it` (`html: true`) for www and by gemdown (via
  `.eleventy.gemini.js`) for Gemini.
- `includes/head.html` hardcodes `og:image` to `/assets/avatar.jpg` — a
  relative URL, which most crawlers ignore. This is an existing bug.
- gemdown is our own npm package. The site consumes `gemdown@^0.7.0` from the
  registry. The GitHub repo (`audiodude/gemdown`) is at 0.6.0, the local
  checkout at `~/code/starred/gemdown` is at 0.4.0, and the 0.7.0 source
  (a blockquote/link-footer fix) exists only in the published tarball.
  gemdown currently renders images as `[IMAGE OMITTED!]`.
- The repo has no automated tests for the site build. `npm run build` posts to
  Mastodon for any garden node without a row in `comments.sqlite3` (140 rows
  vs 137 nodes today — covered, but nothing enforces it).

## Decisions made during brainstorming

| Question | Decision |
| --- | --- |
| Authoring flow | CMS gets upload support (drag-drop/paste/button) |
| og:image source | First image in node body; fallback to avatar.jpg |
| Gemini handling | Images become gemtext link lines, via a gemdown update |
| gemdown delivery | Publish 0.8.0 to npm (after recovering 0.7.0 source) |
| Image processing | Eleventy image pipeline (`@11ty/eleventy-img` transform) |
| Eleventy version | Upgrade 2 → 3 first (transform plugin requires v3) |
| Test strategy | Build integration tests written **before** the upgrade |

## Phase 0 — Build integration tests

New test suite using `node:test` (no new framework). Location: `test/` in the
repo root, run via `npm test`.

- Each suite runs a real Eleventy build as a child process into a temp output
  directory: www (`npx eleventy`) and Gemini
  (`npx eleventy --config=.eleventy.gemini.js`).
- All test builds run with `DISABLE_MASTODON=1`. A new guard in
  `garden/garden.11tydata.js` returns early from the comment-posting path when
  that variable is set, so a test build can never post a public Mastodon
  status or write to `comments.sqlite3`.
- Assertions are durable invariants, not golden trees:
  - www: expected garden page count (>= a floor, not exact); a sample node's
    HTML contains its `<h1>` title, `og:title`/`og:image`/`og:description`
    meta tags, resolved wikilink `href="/garden/..."` links, and a backlinks
    section; `feed.xml` parses as XML; `_redirects` and `assets/` are copied.
  - Gemini: sample `.gmi` file exists at the right path, contains `=>` link
    footer lines, contains no HTML entities (`&gt;` etc.).
- Tests must pass on Eleventy 2 before Phase 1 begins. They are the
  upgrade's safety net and remain as regression coverage afterward.

## Phase 1 — Eleventy 2 → 3 upgrade

- Bump `@11ty/eleventy` ^2.0.1 → ^3.1.6 and `@11ty/eleventy-plugin-rss`
  ^1.2.0 → ^3.0.0.
- Both config files stay CommonJS (supported by v3; Node is v20, which also
  supports `require(esm)` if a plugin needs it).
- Fix whatever the upgrade breaks until the Phase 0 tests pass.
- One-time manual verification beyond the tests: build `_site/` and
  `_gemini/` on v2 (`DISABLE_MASTODON=1`), stash the trees, rebuild on v3,
  `diff -r` both pairs, and explain/accept every difference.
- Own commit.

## Phase 2 — Images on www

- **Storage:** repo path `assets/img/garden/`. Already passthrough-copied via
  the existing `addPassthroughCopy('assets')`.
- **Authoring format:** plain markdown, e.g.
  `![alt text](/assets/img/garden/foo.jpg)`.
- **Rendering:** `eleventyImageTransformPlugin` from `@11ty/eleventy-img` v7,
  registered in `.eleventy.js` (www config only). Settings: widths
  `[480, 800, 1600]` plus original cap, formats `["webp", "auto"]`,
  `loading="lazy"` + `decoding="async"`, output to `_site/img/`, disk cache in
  `.cache/` (gitignored).
- **og:image:** a filter in `.eleventy.js` (www-only; Gemini has no og tags)
  extracts
  the first image reference from the node's raw markdown
  (`![...](...)` or `<img src>`). `includes/head.html` emits it as an
  absolute URL (`site.baseurl` + path); nodes without images fall back to
  `site.baseurl` + `/assets/avatar.jpg`. This fixes the relative-URL og:image
  bug for all pages. The og:image URL points at the original uploaded asset
  (not a generated variant) for simplicity and stability.
- **Tests:** a fixture garden node with an image (committed test image) —
  assert the built HTML contains `<picture>`/`srcset` and the correct
  `og:image` meta; assert a node without images falls back to avatar.

## Phase 3 — gemdown 0.8.0

In `~/code/starred/gemdown`:

1. Fast-forward local `main` to `origin/main` (0.6.0).
2. Recover 0.7.0: port the diff between origin's `lib/` and the published
   0.7.0 tarball (blockquote link-footer handling) into the repo, set version
   0.7.0, commit as a restoration commit.
3. Image support: markdown images render as gemtext link lines
   (`=> <href> <alt text>`), using the same link-extraction/footer mechanism
   as regular links. An image with no alt text uses the href alone. Behavior
   replaces `[IMAGE OMITTED!]` unconditionally — no new option; nobody wants
   the old behavior.
4. Add jasmine specs following the existing spec/testdata patterns.
5. Bump to 0.8.0, update README, commit, push, `npm publish`.
   **Manual step: npm login/OTP will likely be needed — stop and ask.**

Back in the site repo:

- Update to `gemdown@^0.8.0`.
- Gemini build: copy `assets/img/garden/` into `_gemini/assets/img/garden/`
  (narrow passthrough despite the general `assets/*` ignore) so
  `deploy_gemini.sh`'s rsync ships original image files to the capsule.
  Gemini serves originals — no responsive variants.
- Tests: Gemini suite asserts a fixture node's `.gmi` contains the image as a
  `=>` link line and that the image file lands in `_gemini`.

## Phase 4 — CMS upload

- **Backend** (`cms/server`): `POST /api/images` using `multer` (memory
  storage). Validates content type (jpeg/png/gif/webp), slugifies the
  original filename (collision → `-2` suffix), writes to
  `assets/img/garden/`, returns `{ path: "/assets/img/garden/<name>" }`.
  Path traversal in filenames rejected.
- **Frontend** (`cms/src`): in the CodeMirror markdown editor —
  - drag-and-drop an image file onto the editor,
  - paste an image from the clipboard,
  - and a toolbar/button flow with a file picker.
  Each uploads via the API and inserts `![](/assets/img/garden/<name>)` at
  the cursor (cursor placed inside the `[]` so alt text can be typed).
- **Tests:** backend route tests following existing `cms/test` patterns
  (valid upload, bad type rejected, collision suffix, traversal rejected).

## Out of scope (YAGNI)

- Frontmatter `image:` override for og:image.
- CMS image management (listing, deleting, renaming images).
- Migrating/retro-fitting images into existing nodes.
- Responsive variants on Gemini.
- Client-side downscaling in the CMS.

## Success criteria

1. `npm test` passes: build invariants, image rendering, og:image, Gemini
   image links, CMS upload routes.
2. A garden node containing `![alt](/assets/img/garden/x.jpg)` renders a
   responsive `<picture>` on www, a `=>` link line on Gemini, and that
   image as an absolute-URL `og:image`.
3. Nodes without images keep avatar.jpg as og:image (now absolute).
4. An image can be added to a node entirely from the CMS (upload + insert).
5. gemdown 0.8.0 published, its source fully recovered on GitHub.
6. README updated (image authoring, test command); CMS README section
   updated for upload.

## Documentation

- Site README: how to add images to nodes, how to run tests.
- gemdown README: image handling + new option (if any).
