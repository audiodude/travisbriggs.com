# Digital Garden of Travis Briggs

This is the static site generator that creates the digital gardens at:

https://travisbriggs.com

[gemini://gem.travisbriggs.com](gemini://gem.travisbriggs.com)

## Background

A Digital Garden is like a blog, as it's a place to share personal thoughts, projects and other things on the web (or on Gemini). However it differs in that it is setup more as a graph of nodes that are connected and evergreen instead of a dreaded reverse chronological ordering of "posts". For more information on Digital Gardens, see the [post that inspired me by Maggie Appleton](https://maggieappleton.com/garden-history).

This static site generator is built off the awesome template [Eleventy Garden](https://github.com/binyamin/eleventy-garden) by [Binyamin Aron Green](https://www.buymeacoffee.com/binyamin). That in turn uses the awesome [Eleventy static site generator](https://www.11ty.dev/), which is more or less a clone of [Jekyll](https://jekyllrb.com/) in Javascript that winds up being more flexibile and more easily extensible.

## Developing

```bash
npm install
npm run dev
```

### Testing

```bash
npm test
```

Runs build-integration tests that build both the www and Gemini site into
temp directories. They set `DISABLE_MASTODON=1` so no statuses are posted.
That's a standing warning worth generalizing: any ad-hoc build should set
`DISABLE_MASTODON=1` unless you actually intend to post to Mastodon.

The tests inject throwaway fixture files (`zz-test-fixture.*`) into the
source tree and clean them up afterwards. Two safeguards make a leaked
fixture (from a crashed test run) harmless: the fixture node carries
`testFixture: true` frontmatter, which the Mastodon-posting code refuses to
post for, and `npm run build` / `deploy_gemini.sh` sweep leaked fixture
files away before building (`scripts/preflight-fixtures.js`).

### Images

Drop image files in `assets/img/garden/` and reference them from a node's
markdown with `![alt text](/assets/img/garden/name.jpg)`. On www, images are
run through `@11ty/eleventy-img` to produce responsive variants, and the
first image in a node's body becomes that node's `og:image` (an absolute
URL, falling back to the site avatar if the node has no images). On Gemini,
images render as `=>` link lines and the original files are shipped
alongside the capsule content.

## Deploying

### www
First, build the site. **Warning:** this will create a Mastodon post for every new garden node, assuming you have a `MASTODON_API_KEY` entry in a top-level `.env` file.

```bash
npm run build
```

Next deploy to Netlify (`--prod` to skip the preview step):

```bash
netlify deploy --prod -d _site
```

Finally, commit the code and push to Github (left to the reader). It's **important that this step is last**, because the comments.sqlite3 (where the Mastodon ids for node comments live) database is commited as part of the repo, and will be out of date if the repo is pushed before deploying.

### Gemini
The Gemini capsule is hosted on a [Hetzner](https://www.hetzner.com/) box using the [Agate](https://github.com/mbrubeck/agate) server, with [Let's Encrypt](https://letsencrypt.org/) certificates auto-renewed via Cloudflare DNS-01. Agate serves each vhost from `/srv/gemini/content/<hostname>/`. To deploy the Gemini site, run:

```bash
npm run deploy-gemini
```

This runs Eleventy in Gemini mode and rsyncs the built `_gemini/` tree into the `gem.travisbriggs.com` content root on the box. Defaults (host `gem.travisbriggs.com`, user `root`, key `~/.ssh/id_skynet`, dest `/srv/gemini/content/gem.travisbriggs.com`) can be overridden with the `GEM_HOST`, `GEM_USER`, `GEM_KEY`, and `GEM_DEST` env vars.

## CMS

There's a local-only CMS for editing garden content, vibe coded with Claude. It's a Vue 3 SPA with an Express backend that reads and writes the markdown files in `garden/` directly.

```bash
cd cms
npm install
npm run dev:all
# Open http://localhost:5173
```

Features: sortable/filterable file list, frontmatter form with quality/importance dropdowns, CodeMirror 6 markdown editor with `[[wikilink]]` autocomplete, image upload (drag-drop, paste, or the 📷 toolbar button), and new page creation with slug auto-generation. Run `npm run dev` in the repo root alongside it if you want the preview links to work.

## Recreating the comments database

If you're in this section, I'm sad for you. You probably want to first [delete all existing comments](https://gist.github.com/audiodude/cb8234b4957892a65af6608f0ac3c359). Then run:

```bash
node create_comments_db.js
```

Finally, follow the build and deploy steps above.
