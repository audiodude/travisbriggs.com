# Garden Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Reskin travisbriggs.com (Eleventy digital garden) with a dark-only, flat, hand-made IndieWeb identity, plus two homepage widgets (random-song player, latest Mastodon toot).

**Architecture:** Full rewrite of `assets/style.css` against a new dark token set; header/footer rework in `layouts/default.html`; homepage rework in `index.html` with a new `assets/home.js` driving both widgets via public, CORS-open endpoints. No content or URL changes.

**Tech Stack:** Eleventy (Nunjucks/Liquid-style templates), vanilla CSS custom properties, vanilla JS. No new dependencies, no test framework exists for the theme (verification is build + output inspection).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-26-garden-redesign-design.md`
- Dark only. No light theme, no theme toggle, no `prefers-color-scheme` swapping.
- Exactly 2 fonts: **Archivo Black** (h1/h2/site name) + **Inter** (everything else). No monospace webfont; inline `code` uses system mono.
- Accent: Rainfall blue — `--accent: #60a5fa`, `--accent-deep: #3b82f6`.
- "Nearly flat" texture: roughness limited to dashed-ring tilted avatar, outlined meta tags, footer badges, 3–6px radii. No shadows, no gradients (except the backlink-preview fade), no wavy/dashed link underlines.
- Do NOT touch: `garden/` content, `comments.sqlite3`, `layouts_gemini/`, `includes_gemini/`, `cms/`, `_redirects`, `netlify.toml`.
- `npm run build` is safe: it only posts to Mastodon for NEW garden nodes (tracked in `comments.sqlite3`); we add none.
- h-card microformats markup in the header must be preserved.

## File Map

| File                      | Responsibility                                     |
| ------------------------- | -------------------------------------------------- |
| `includes/head.html`      | Font loading (Archivo Black + Inter)               |
| `assets/style.css`        | Entire visual system (full rewrite)                |
| `layouts/default.html`    | Header, footer, page chrome                        |
| `index.html`              | Homepage: hero + widget markup + recent list       |
| `assets/home.js`          | Homepage widgets: random-song player + latest toot |
| `includes/recent.html`    | Section label markup                               |
| `includes/backlinks.html` | Section label markup                               |
| `includes/comments.html`  | Section label markup (JS untouched)                |

---

### Task 1: Fonts in `includes/head.html`

**Files:**

- Modify: `includes/head.html:52`

**Interfaces:**

- Produces: `--font-display: 'Archivo Black'` and `--font-body: 'Inter'` usable in CSS (Task 2 relies on these family names).

- [x] **Step 1: Update the Google Fonts link**

Replace the Inter-only link:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
  rel="stylesheet"
/>
```

with Archivo Black + Inter:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
  rel="stylesheet"
/>
```

- [x] **Step 2: Build and verify**

Run: `npm run build`
Then: `grep -o "Archivo+Black" _site/index.html`
Expected: build succeeds; grep prints `Archivo+Black`.

- [x] **Step 3: Commit**

```bash
git add includes/head.html
git commit -m "Load Archivo Black display font"
```

---

### Task 2: Full rewrite of `assets/style.css`

**Files:**

- Modify: `assets/style.css` (replace entire contents)

**Interfaces:**

- Consumes: font families from Task 1.
- Produces: every selector the existing templates use (`.page-header`, `.meta`, `.quality.*`, `.importance.*`, `.backlink`, `.backlink__preview`, `.comment`, `.writing`, `.garden-hr`, `.section-label`, etc.) plus homepage widget styles (`.hero`, `.home-widget`, `.btn`, `.now-playing`, `.badges`, `.badge`, `.site-name`, `.home-recent`, `.mastodon-line`) used by Tasks 3–5.

- [x] **Step 1: Replace `assets/style.css` entirely**

```css
/* Digital Garden of Travis Briggs — dark-only "nearly flat IndieWeb" theme.
   See docs/superpowers/specs/2026-07-26-garden-redesign-design.md */

:root {
  color-scheme: dark;

  --bg-body: #17181f;
  --bg-surface: #1e2029;
  --bg-inset: #22232c;
  --border: #262833;
  --border-strong: #2e303c;

  --text: #c9ccd6;
  --text-heading: #e3e5ee;
  --text-heading-2: #d5d8e3;
  --text-muted: #8b8fa3;
  --text-faint: #565a6e;

  --accent: #60a5fa;
  --accent-deep: #3b82f6;
  --accent-dim: rgba(96, 165, 250, 0.35);

  --ok-soft: #7dd3a8;

  --font-body: "Inter", system-ui, -apple-system, sans-serif;
  --font-display: "Archivo Black", "Inter", system-ui, sans-serif;
}

html {
  font-size: 100%;
  background-color: var(--bg-body);
}

body {
  font-family: var(--font-body);
  font-size: 1.0625rem;
  line-height: 1.7;
  background-color: var(--bg-body);
  color: var(--text);

  display: flex;
  flex-direction: column;
  min-height: 100vh;

  max-width: 44rem;
  margin: 0 auto;
  padding: 0 24px;
}

img {
  max-width: 100%;
}

/* ---------- Links ---------- */

a[href] {
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px solid var(--accent-dim);
}

a[href]:hover {
  border-bottom-color: var(--accent);
}

a[href]:focus {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
}

/* External-link arrow inside long-form content only */
article a[href]:not([href^="/"])::after {
  content: " \2197";
  font-size: 0.75em;
  color: var(--text-muted);
}

/* ---------- Typography ---------- */

p {
  margin: 0 0 1rem;
}

h1,
h2,
h3,
h4,
h5 {
  font-family: var(--font-display);
  font-weight: 400;
  line-height: 1.2;
  color: var(--text-heading-2);
  margin: 2rem 0 0.75rem;
}

h1 {
  font-size: 1.9rem;
  color: var(--text-heading);
  margin-top: 0;
}

h2 {
  font-size: 1.35rem;
}
h3 {
  font-size: 1.1rem;
}
h4,
h5 {
  font-size: 1rem;
}

blockquote {
  margin: 1rem 0;
  padding: 0.15rem 1rem;
  border-left: 2px solid var(--border-strong);
  color: var(--text-muted);
}

code {
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: 0.9em;
  background: var(--bg-inset);
  border-radius: 3px;
  padding: 0.1em 0.35em;
  color: #a5d6ff;
}

pre {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
}

pre code {
  background: none;
  padding: 0;
}

hr {
  border: none;
  border-top: 1px solid var(--border);
  margin: 2rem 0;
}

article hr:not(.garden-hr) {
  width: 70%;
  margin-left: auto;
  margin-right: auto;
}

.garden-hr {
  margin: 2.5rem 0 1.5rem;
}

table {
  border-collapse: collapse;
}

th,
td {
  border: 1px solid var(--border);
  padding: 0.35rem 0.75rem;
}

.footnotes {
  font-size: 0.85em;
  color: var(--text-muted);
}

small {
  font-size: 0.85em;
}

/* ---------- Header ---------- */

.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 20px 0 16px;
  border-bottom: 1px solid var(--border);
}

.page-header__logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-header__logo a[href="/"] {
  border-bottom: none;
}

.page-header__logo .u-photo {
  display: block;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px dashed var(--accent);
  padding: 2px;
  transform: rotate(-4deg);
}

.site-name {
  font-family: var(--font-display);
  font-size: 1.05rem;
  color: var(--text-heading);
}

a.site-name {
  border-bottom: none;
}

a.site-name:hover {
  color: var(--accent);
}

.page-header nav {
  margin-left: auto;
}

.page-header nav a {
  color: var(--text-muted);
  border-bottom: none;
  margin-left: 20px;
  font-size: 0.95rem;
}

.page-header nav a:first-child {
  margin-left: 0;
}

.page-header nav a:hover {
  color: #fff;
}

@media only screen and (max-width: 468px) {
  .page-header nav {
    margin-left: 0;
    width: 100%;
  }
  .page-header nav a {
    margin-left: 0;
    margin-right: 20px;
  }
}

/* ---------- Main ---------- */

main {
  flex-grow: 1;
  width: 100%;
  margin: 0 auto;
  padding-top: 8px;
}

article {
  margin: 0 auto;
}

/* ---------- Section labels (Recently updated / Backlinks / Comments) ---------- */

.section-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin: 0 0 0.5rem;
}

.comment-size {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.comments-exp-top {
  margin-top: 0;
}

/* ---------- Node meta (created / quality / importance) ---------- */

.meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0 0 1.25rem;
}

.quality,
.importance {
  display: inline-block;
  border: 1px solid var(--border-strong);
  border-radius: 3px;
  padding: 0 0.45em;
  font-size: 0.72rem;
  color: var(--text-muted);
  background: transparent;
}

.quality.FA,
.quality.fa,
.importance.Top,
.importance.top {
  color: var(--accent);
  border-color: var(--accent-dim);
}

.quality.GA,
.quality.ga,
.importance.High,
.importance.high {
  color: var(--ok-soft);
  border-color: rgba(125, 211, 168, 0.35);
}

.quality.Start,
.quality.start,
.quality.Stub,
.quality.stub,
.importance.Low,
.importance.low {
  color: var(--text-faint);
}

/* ---------- Backlinks / recent lists ---------- */

.backlinks-container {
  list-style: none;
  padding: 0;
  margin: 0;
}

.backlink {
  width: fit-content;
  position: relative;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
}

.backlinks-container .backlink:last-child {
  border-bottom: none;
}

.backlink:hover {
  padding-right: 4px;
  /* Allow mouse to travel between link and preview */
}

.backlink__preview {
  display: none;

  position: absolute;
  bottom: 8px;
  left: 100%;
  z-index: 10;
  background-color: var(--bg-surface);
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  padding: 8px 10px;
  width: 348px;
  max-height: 148px;
  overflow: hidden;
  font-size: 0.85rem;
}

.backlink__preview::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  background: linear-gradient(transparent, var(--bg-surface));
  width: 100%;
  height: 24px;
}

.backlink__preview h1 {
  font-size: 1rem;
  margin: 4px 0;
}

.backlink:hover .backlink__preview {
  display: block;
}

.backlinks-default {
  margin: 0 0 0 2px;
  color: var(--text-muted);
}

/* ---------- Comments ---------- */

#comments {
  margin: 2.5rem 0 0;
}

#comments-wrapper .avatar {
  max-width: 40px;
  border-radius: 50%;
}

.comment {
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-surface);
  padding: 0.6rem 0.75rem;
  margin-top: 0.6rem;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  font-size: 0.92rem;
}

.comment main {
  width: 100%;
  padding-top: 4px;
}

.comment main p {
  margin-bottom: 0.5rem;
}

.comment-reply {
  margin-left: 2rem;
}

.instance {
  display: inline-block;
  font-size: 0.78rem;
}

.avatar-link,
.author,
.display,
#comments-wrapper time,
.instance {
  margin-right: 0.75rem;
}

#comments-wrapper time {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.faves {
  font-size: 0.78rem;
}

.op .display {
  color: var(--accent);
}

/* ---------- Writing (long-form pages) ---------- */

.writing {
  background-color: var(--bg-surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 2rem;
  margin-top: 1rem;
}

/* ---------- Footer ---------- */

.page-footer {
  width: 100%;
  text-align: center;
  margin-top: 3rem;
  padding: 20px 0 28px;
  border-top: 1px solid var(--border);
}

.badges {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 10px;
}

.badge {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 7px;
  border: 1px solid var(--border-strong);
  font-size: 0.62rem;
  letter-spacing: 0.06em;
  color: var(--text-faint);
}

a.badge {
  border-bottom: none;
}

a.badge:hover {
  color: var(--accent);
  border-color: var(--accent-dim);
}

.page-footer .copy {
  margin: 0 auto;
  font-size: 0.72rem;
  color: var(--text-faint);
}

.page-footer .copy a {
  color: var(--text-muted);
  border-bottom-color: var(--border-strong);
}

/* ---------- Homepage ---------- */

.hero {
  text-align: center;
  margin: 3.5rem 0 3rem;
}

.hero h1 {
  font-size: 2.4rem;
  margin-bottom: 1.5rem;
}

.hero-enter {
  font-size: 1.35rem;
}

.hero-what {
  display: inline-block;
  margin-top: 0.6rem;
  font-size: 0.85rem;
  color: var(--text-muted);
  border-bottom-color: var(--border-strong);
}

.home-widget {
  border: 1px solid var(--border-strong);
  border-radius: 6px;
  background: var(--bg-surface);
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
}

.home-widget .section-label {
  margin-bottom: 0.6rem;
}

.btn {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.9rem;
  color: #fff;
  background: var(--accent-deep);
  border: none;
  border-radius: 4px;
  padding: 0.45rem 1rem;
  cursor: pointer;
}

.btn:hover {
  background: var(--accent);
}

.widget-note {
  margin-left: 10px;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.now-playing {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 0.9rem;
}

.now-playing img {
  width: 44px;
  height: 44px;
  border-radius: 4px;
}

.now-playing .np-title {
  font-weight: 600;
}

.now-playing .np-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
}

#random-song-audio {
  width: 100%;
  margin-top: 0.75rem;
}

.mastodon-line {
  margin: 0;
  font-size: 0.92rem;
}

.mastodon-line .toot-date {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.home-recent {
  list-style: none;
  padding: 0;
  margin: 0;
}

.home-recent li {
  padding: 5px 0;
  border-bottom: 1px solid var(--border);
}

.home-recent li:last-child {
  border-bottom: none;
}
```

- [x] **Step 2: Build and verify**

Run: `npm run build`
Then: `grep -c "Archivo Black" _site/assets/style.css && grep -c "theme-toggle" _site/assets/style.css || true`
Expected: build succeeds; first grep prints `1`; second prints `0` (grep exit 1 is why `|| true`).

- [x] **Step 3: Commit**

```bash
git add assets/style.css
git commit -m "Rewrite stylesheet: dark-only flat IndieWeb theme"
```

---

### Task 3: Header & footer in `layouts/default.html`

**Files:**

- Modify: `layouts/default.html` (replace entire contents)

**Interfaces:**

- Consumes: `.site-name`, `.badges`, `.badge`, header/footer CSS from Task 2.
- Produces: `{{ content }}` wrapper used by all layouts; no theme JS anywhere.

- [x] **Step 1: Replace `layouts/default.html` entirely**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    {% include 'head.html' %}
  </head>

  <body>
    <header class="page-header">
      <div class="h-card page-header__logo">
        <a href="/" title="Go home"
          ><img
            class="u-photo"
            src="/assets/avatar.jpg"
            alt="Travis Briggs"
            width="40"
        /></a>
        <a class="site-name p-name" href="/">Travis Briggs</a>
        <p class="p-note" style="display:none">
          Musician. Programmer. Digital Gardener. Atheist. Life, the Universe,
          and Everything. Toots auto-delete after 90 days. I'm audiodude pretty
          much everywhere, including at gmail.com
        </p>
        <a
          class="u-email"
          style="display:none"
          href="mailto:audiodude@gmail.com"
          >audiodude@gmail.com</a
        >
        <p style="display:none">
          <span class="p-locality">San Francisco</span>,
          <span class="p-region">CA</span>
          <span class="p-country-name">USA</span>
        </p>
      </div>

      <nav>
        <a href="/garden/">Garden</a>
        <a href="/garden/about">About Me</a>
        <a href="/now">Now</a>
      </nav>
    </header>
    <main>{{content}}</main>

    <footer class="page-footer">
      <div class="badges">
        <a class="badge" href="https://gem.travisbriggs.com">GEMINI</a>
        <a class="badge" href="/feed.xml">RSS</a>
        <span class="badge">EST. 2015</span>
      </div>
      <p class="copy">
        &copy; {% year %} {{site.author}} &middot;
        <a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/"
          >CC BY-SA 4.0</a
        >
      </p>
      <p class="copy">
        <a href="https://songs.travisbriggs.com">songs</a> &middot;
        <a href="https://dangerthirdrail.com">danger third rail</a> &middot;
        <a href="https://sfba.social/@audiodude">mastodon</a>
      </p>
    </footer>
  </body>
</html>
```

- [x] **Step 2: Build and verify**

Run: `npm run build`
Then: `grep -c "theme-toggle" _site/index.html || true; grep -o 'class="site-name' _site/index.html; grep -o 'class="badge"' _site/index.html | head -2`
Expected: build succeeds; `0` for theme-toggle; `class="site-name` found; badge classes found.

- [x] **Step 3: Commit**

```bash
git add layouts/default.html
git commit -m "New header (tilted avatar + site name) and footer (badges)"
```

---

### Task 4: Homepage markup + widgets (`index.html`, `assets/home.js`)

**Files:**

- Modify: `index.html` (replace entire contents)
- Create: `assets/home.js`

**Interfaces:**

- Consumes: `.hero`, `.home-widget`, `.btn`, `.now-playing`, `.mastodon-line`, `.home-recent`, `.section-label` from Task 2; `collections.rss` (same source as `includes/recent.html`).
- Produces: DOM ids `#random-song`, `#random-song-btn`, `#random-song-now`, `#random-song-audio`, `#latest-toot` that `assets/home.js` expects.

- [x] **Step 1: Replace `index.html` entirely**

```html
---
layout: default
updated: 2023-01-01
---

<section class="hero">
  <h1>Digital Garden of Travis Briggs</h1>
  <p>
    <a class="hero-enter" href="/garden/">Approach the garden</a><br />
    <a class="hero-what" href="https://maggieappleton.com/garden-history"
      >What is a digital garden?</a
    >
  </p>
</section>

<section id="random-song" class="home-widget">
  <div class="section-label">A random song of mine</div>
  <button id="random-song-btn" class="btn" type="button">
    &#9654; Play a random song
  </button>
  <span class="widget-note"
    >from
    <a href="https://songs.travisbriggs.com">songs.travisbriggs.com</a> &middot;
    est. 2008</span
  >
  <div id="random-song-now" class="now-playing" hidden></div>
  <audio id="random-song-audio" controls hidden></audio>
</section>

<section class="home-widget">
  <div class="section-label">Latest toot</div>
  <p id="latest-toot" class="mastodon-line">
    <a href="https://sfba.social/@audiodude">@audiodude@sfba.social</a>
  </p>
</section>

<section class="home-widget">
  <div class="section-label">Recently tended</div>
  <ul class="home-recent">
    {% assign links = collections.rss | reverse %} {% for link in links limit:6
    %} {% if link.data.title %}
    <li><a href="{{link.page.url}}">{{link.data.title}}</a></li>
    {% endif %} {% endfor %}
  </ul>
</section>

<script src="/assets/home.js"></script>
```

- [x] **Step 2: Create `assets/home.js`**

```js
/* Homepage widgets: random-song player (songs.travisbriggs.com) and latest
   Mastodon toot (@audiodude@sfba.social). Both endpoints are CORS-open.
   Each widget degrades to a static link if its fetch fails. */
(function () {
  /* ---------- Random song player ---------- */
  var playerBox = document.getElementById("random-song");
  if (playerBox) {
    fetch("https://songs.travisbriggs.com/songs.json")
      .then(function (r) {
        if (!r.ok) throw new Error("songs.json " + r.status);
        return r.json();
      })
      .then(function (songs) {
        if (!songs.length) throw new Error("no songs");
        var btn = document.getElementById("random-song-btn");
        var now = document.getElementById("random-song-now");
        var audio = document.getElementById("random-song-audio");

        function fmtDuration(ms) {
          var s = Math.round(ms / 1000);
          return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
        }

        function pick() {
          var song = songs[Math.floor(Math.random() * songs.length)];
          now.innerHTML =
            '<img src="' +
            song.cover +
            '" alt="" width="44" height="44">' +
            '<span><span class="np-title">' +
            song.title +
            "</span><br>" +
            '<span class="np-meta">' +
            fmtDuration(song.duration) +
            " &middot; " +
            '<a href="' +
            song.url +
            '">song page</a>' +
            "</span></span>";
          now.hidden = false;
          audio.src = song.src;
          audio.hidden = false;
          audio.play().catch(function () {
            /* user can press play manually */
          });
          btn.textContent = "▶ Play another";
        }

        btn.addEventListener("click", pick);
      })
      .catch(function () {
        playerBox.innerHTML =
          '<div class="section-label">A random song of mine</div>' +
          '<a href="https://songs.travisbriggs.com">Listen at songs.travisbriggs.com</a>';
      });
  }

  /* ---------- Latest toot ---------- */
  var tootEl = document.getElementById("latest-toot");
  if (tootEl) {
    fetch(
      "https://sfba.social/api/v1/accounts/111123478093089904/statuses" +
        "?limit=1&exclude_replies=true&exclude_reblogs=true",
    )
      .then(function (r) {
        if (!r.ok) throw new Error("statuses " + r.status);
        return r.json();
      })
      .then(function (statuses) {
        var status = statuses[0];
        if (!status) throw new Error("no statuses");
        var tmp = document.createElement("div");
        tmp.innerHTML = status.content;
        var text = (tmp.textContent || "").trim();
        if (text.length > 160) text = text.slice(0, 160).trimEnd() + "…";

        tootEl.innerHTML = "";
        var quote = document.createTextNode("“" + text + "” ");
        var link = document.createElement("a");
        link.href = status.url;
        link.className = "toot-date";
        link.textContent = new Date(status.created_at).toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
            year: "numeric",
          },
        );
        tootEl.appendChild(quote);
        tootEl.appendChild(link);
      })
      .catch(function () {
        /* Leave the static fallback link in place. */
      });
  }
})();
```

- [x] **Step 3: Build and verify**

Run: `npm run build`
Then: `ls _site/assets/home.js && grep -o 'id="random-song-btn"' _site/index.html && grep -o 'id="latest-toot"' _site/index.html && grep -c 'class="home-widget"' _site/index.html`
Expected: build succeeds; file exists; both ids found; widget count `3`.

- [x] **Step 4: Verify the live endpoints the widgets call**

Run: `curl -s https://songs.travisbriggs.com/songs.json | jq 'length'` (expect a number > 100)
Run: `curl -s "https://sfba.social/api/v1/accounts/111123478093089904/statuses?limit=1&exclude_replies=true&exclude_reblogs=true" | jq 'length'` (expect `1`)

- [x] **Step 5: Commit**

```bash
git add index.html assets/home.js
git commit -m "Homepage: hero, random-song player, latest toot, recently tended"
```

---

### Task 5: Section labels in `includes/recent.html`, `includes/backlinks.html`, `includes/comments.html`

**Files:**

- Modify: `includes/recent.html:3`
- Modify: `includes/backlinks.html:2`
- Modify: `includes/comments.html:3`

**Interfaces:**

- Consumes: `.section-label` from Task 2.
- Produces: removes usage of `.recent-title`, `.backlinks-title`, `.comments-title`, `.title-larger` (already absent from the new CSS).

- [x] **Step 1: Swap heading markup for section labels**

In `includes/recent.html`, replace:

```html
<h3 class="recent-title title-larger">Recently Updated</h3>
```

with:

```html
<div class="section-label">Recently updated</div>
```

In `includes/backlinks.html`, replace:

```html
<h3 class="backlinks-title title-larger">Backlinks</h3>
```

with:

```html
<div class="section-label">Backlinks</div>
```

In `includes/comments.html`, replace:

```html
<h3 class="comments-title title-larger">Comments</h3>
```

with:

```html
<div class="section-label">Comments</div>
```

Do not touch anything else in these files — the comments JS and backlink preview logic stay exactly as-is.

- [x] **Step 2: Build and verify**

Run: `npm run build`
Then: `grep -rl "section-label" _site/garden/ | head -3; grep -rl "title-larger" _site/ | head -3 || true`
Expected: build succeeds; at least one garden page contains `section-label`; no built page contains `title-larger`.

- [x] **Step 3: Commit**

```bash
git add includes/recent.html includes/backlinks.html includes/comments.html
git commit -m "Use section labels for recent/backlinks/comments headings"
```

---

### Task 6: Final verification pass

**Files:** none (verification only)

- [x] **Step 1: Full build**

Run: `npm run build`
Expected: completes with no errors.

- [x] **Step 2: Check removals across the whole built site**

Run: `grep -rl "theme-toggle\|light-theme\|dark-theme\|bg-gutter" _site/ || echo "CLEAN"`
Expected: `CLEAN`.

- [x] **Step 3: Spot-check representative pages exist and carry the new chrome**

Run: `grep -l "site-name" _site/index.html _site/garden/about/index.html _site/all/index.html`
Expected: all three listed. (If `_site/garden/about/index.html` doesn't exist, find an equivalent node page: `ls _site/garden | head` and pick one with an `index.html`.)

- [x] **Step 4: Manual visual review**

Run `npm run dev`, then in a browser check at desktop and ~375px widths:

- `/` — hero, player box, toot line, recently tended; click "Play a random song" (audio should start; button becomes "Play another")
- one garden node with comments + backlinks (e.g. a recent node)
- a writings page
  Confirm: dark background everywhere, tilted dashed avatar, footer badges, no gutter frame.

- [x] **Step 5: Commit any fixes from review**

```bash
git add -A
git commit -m "Redesign polish from visual review" || true
```
