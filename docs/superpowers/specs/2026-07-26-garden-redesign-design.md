# Digital Garden Redesign — Design Spec

Date: 2026-07-26
Status: Approved (all approvals assumed per user)

## Summary

Full visual reskin of travisbriggs.com (Eleventy digital garden): dark-only,
flat, hand-made IndieWeb identity with Rainfall-blue accents. Two new homepage
widgets: a random-song player (songs.travisbriggs.com) and latest-Mastodon-post
line. No content, URL, or structural changes.

## Decisions log

- Rainfall design system: **loose inspiration** (blue accent, flat panels), not strict tokens
- Color scheme: **dark only**, no toggle, no light theme
- Type: **2 fonts max, no monospace** — Archivo Black (headings/site name) + Inter (body)
- Accent: **Rainfall blue** (`#60a5fa` links, `#3b82f6` fills)
- Direction: **"Hand-made IndieWeb" at "nearly flat" texture level (V3)** — hairline
  rules, solid borders, roughness limited to small signature details
- Headings off-white, not pure white (user found `#fff` too harsh)
- Scope: **reskin only** — CSS + templates, no content/URL changes
- Pain point addressed: current 8px gutter/border frame is removed
- Songs source: new `/songs.json` endpoint on songs.travisbriggs.com (already
  implemented and deployed as part of this project)

## Visual system

### Palette (dark only)

| Token              | Value                  | Use                                      |
| ------------------ | ---------------------- | ---------------------------------------- |
| `--bg-body`        | `#17181f`              | page canvas                              |
| `--bg-surface`     | `#1e2029`              | raised surfaces (comments, player, code) |
| `--bg-inset`       | `#22232c`              | inline code                              |
| `--border`         | `#262833`              | hairlines, rules                         |
| `--border-strong`  | `#2e303c`              | tags, player box                         |
| `--text`           | `#c9ccd6`              | body                                     |
| `--text-heading`   | `#e3e5ee`              | h1, site name                            |
| `--text-heading-2` | `#d5d8e3`              | h2, h3                                   |
| `--text-muted`     | `#8b8fa3`              | meta, nav, secondary                     |
| `--text-faint`     | `#565a6e`              | footer fine print                        |
| `--accent`         | `#60a5fa`              | links, focus, avatar ring                |
| `--accent-deep`    | `#3b82f6`              | rare fills (play glyph, badges hover)    |
| `--accent-dim`     | `rgba(96,165,250,.35)` | link underline hint                      |

### Type

- **Archivo Black**: h1, h2, site name. h1 `#e3e5ee`, h2 `#d5d8e3`.
- **Inter**: everything else (already in use).
- Both loaded from Google Fonts in `includes/head.html`.

### Texture budget ("nearly flat")

Roughness is confined to these signature details:

- Dashed-ring avatar, tilted −4°, in header
- Small outlined meta tags (quality/importance) on node pages
- Tiny footer badges (Gemini, RSS, Est. 2015)
- Occasional 3–6px radii on cards/inputs

Everything else: flat hairlines (`1px solid var(--border)`), no shadows, no
gradients, no wavy or dashed underlines on links (links get a 1px bottom border
in `--accent-dim`, full accent on hover).

### Explicitly removed

- 8px gutter frame (`--bg-gutter`, `--border-gutter`, body side borders)
- Light theme, theme toggle button + JS, `localStorage` theme script
- `prefers-color-scheme` light/dark variable swapping
- Old CSS variable set (replaced wholesale)

## Architecture

### Files changed

- `assets/style.css` — full rewrite with new token set
- `layouts/default.html` — new header (avatar + site name + nav), new footer
  (copyright/CC, badges, links to songs.travisbriggs.com + dangerthirdrail.com),
  theme JS deleted
- `layouts/garden.html` — meta line becomes outlined tags; no content changes
- `layouts/writings.html`, `index.html` — markup alignment with new furniture
- `includes/head.html` — Google Fonts (Archivo Black + Inter), drop old font refs
- `includes/recent.html`, `includes/backlinks.html`, `includes/comments.html` —
  restyled (hairline lists, thin-bordered comment cards)
- h-card microformats markup in header preserved

### Files untouched

- All `garden/` content, `_redirects`, comments.sqlite3, CMS, `layouts_gemini/`,
  `includes_gemini/`, Gemini deploy path

## Widgets

### Random-song player (homepage)

- Data: `https://songs.travisbriggs.com/songs.json` — static JSON, CORS-open
  (`Access-Control-Allow-Origin: *`), shape
  `[{slug, title, date, duration, tags, src, url, cover}]`. Endpoint built and
  deployed in the sibling repo (`src/pages/songs.json.ts`).
- Client-side fetch on page load; "Play a random song" button picks a random
  entry, sets it into a themed `<audio controls>`, shows title + cover +
  link to the song page (`url`).
- No autoplay, no external JS libraries.
- Failure fallback: widget collapses to a static link to songs.travisbriggs.com.

### Latest Mastodon post (homepage)

- sfba.social sends `Access-Control-Allow-Origin: *` on API requests that carry
  an `Origin` header (verified 2026-07-26) — browsers always send it, so direct
  client-side fetch works. No proxy needed.
- Client-side fetch of
  `https://sfba.social/api/v1/accounts/111123478093089904/statuses?limit=1&exclude_replies=true&exclude_reblogs=true`,
  render latest toot: plain-text snippet (HTML stripped), relative timestamp,
  link to the post. Account ID 111123478093089904 (@audiodude@sfba.social).
- Failure fallback: static "Mastodon ↗" link.

## Page furniture

- **Header:** avatar (dashed ring, tilted) + "Travis Briggs" (Archivo Black) +
  right nav (Garden / About Me / Now), hairline rule below.
- **Footer:** copyright + CC BY-SA (compacted), badge row (Gemini, RSS,
  Est. 2015), outbound links to songs.travisbriggs.com and dangerthirdrail.com.
- **Node pages:** meta (created/updated/quality/importance) as small outlined
  tags; backlinks as hairline-separated list; comments as thin-bordered cards.
- **Homepage:** existing intro content, player box, Mastodon line,
  recently-tended list.

## Verification

- `npm run build` passes
- Manual review: homepage, a node page with comments + backlinks, writings
  page, mobile width (~375px) and desktop
- Both widgets verified against live endpoints (songs.json live; Mastodon proxy
  only works once deployed to Netlify — local fallback verified instead)
- No automated tests added (none exist for the theme)

## Out of scope

- Content rewrites, new pages, URL changes
- Gemini capsule styling (kept deliberately plain)
- CMS visual changes
- Deploy of the redesigned garden itself (user deploys per README workflow)
