// One-off: scan garden nodes and use Claude Haiku to suggest:
//   1. Wikilinks this node could add to other existing nodes
//   2. Other nodes that could elaborate on topics this one touches
//
// Read-only — writes a static HTML report; does not modify any garden files.
//
// Usage:
//   node scripts/suggest-links.js                # analyze all nodes
//   node scripts/suggest-links.js --limit 5      # first 5 nodes
//   node scripts/suggest-links.js --node now     # one specific node (by fileSlug)
//   node scripts/suggest-links.js --out path.html  # custom output path
//
// Requires ANTHROPIC_API_KEY in .env.

require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const matter = require('gray-matter');
const { titleCase } = require('title-case');
const Anthropic = require('@anthropic-ai/sdk').default;

const GARDEN = path.join(__dirname, '..', 'garden');
const DEFAULT_OUT = path.join(__dirname, '..', 'link-suggestions.html');
const WIKILINK_RE = /\[\[\s?([^\[\]\|\n\r]+)(\|[^\[\]\|\n\r]+)?\s?\]\]/g;

function loadNodes() {
  const nodes = [];
  function walk(dir, base = '') {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      const rel = path.join(base, e.name);
      if (e.isDirectory()) {
        walk(full, rel);
      } else if (e.name.endsWith('.md')) {
        const { data, content } = matter(fs.readFileSync(full, 'utf-8'));
        const slug = rel.replace(/\.md$/, '').split(path.sep).join('/');
        const fileSlug = path.basename(slug);
        nodes.push({
          slug,
          fileSlug,
          title: data.title || titleCase(fileSlug),
          content,
        });
      }
    }
  }
  walk(GARDEN);
  return nodes;
}

function existingLinks(content) {
  const links = new Set();
  for (const m of content.matchAll(WIKILINK_RE)) {
    links.add(m[1].replace(/\.(md|markdown)\s?$/i, '').trim().toLowerCase());
  }
  return links;
}

function summarize(content, n = 800) {
  return content
    .replace(/\[\[([^\[\]\|]+)(\|[^\[\]]+)?\]\]/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, n);
}

const SCHEMA = {
  type: 'object',
  properties: {
    suggested_links: {
      type: 'array',
      description: 'Wikilinks to add inside the body of THIS node.',
      items: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'Target node fileSlug (must exist in the index)' },
          anchor_text: { type: 'string', description: 'The exact phrase in the body to wikilink' },
          context: { type: 'string', description: 'Short quote (~15 words) of the surrounding text where the link belongs' },
          rationale: { type: 'string', description: 'Why this link is meaningful (one sentence)' },
        },
        required: ['slug', 'anchor_text', 'context', 'rationale'],
        additionalProperties: false,
      },
    },
    cross_references: {
      type: 'array',
      description: 'Other nodes whose existing content could elaborate or extend topics in THIS node.',
      items: {
        type: 'object',
        properties: {
          slug: { type: 'string' },
          rationale: { type: 'string' },
        },
        required: ['slug', 'rationale'],
        additionalProperties: false,
      },
    },
  },
  required: ['suggested_links', 'cross_references'],
  additionalProperties: false,
};

function buildSystemPrompt(allNodes) {
  const index = allNodes
    .slice()
    .sort((a, b) => a.fileSlug.localeCompare(b.fileSlug))
    .map(
      (n) =>
        `- slug=${JSON.stringify(n.fileSlug)} title=${JSON.stringify(n.title)}: ${summarize(n.content)}`,
    )
    .join('\n');

  return `You analyze garden nodes from a personal digital garden and suggest network improvements.

The user gives you ONE node. Your job:

1. **suggested_links**: Identify topics this node mentions that are ALSO the subject of other nodes in the index, but are NOT already wikilinked. Suggest where to add [[wikilinks]] inside the body.

2. **cross_references**: Identify other nodes whose existing content could MEANINGFULLY ELABORATE on something this node touches on — places where a "see also [[other]]" would deepen the garden's connections.

Rules:
- **CRITICAL: Only use slugs that appear EXACTLY in the index below.** Do not invent slugs, do not infer slugs from topic names, do not pluralize/singularize. If a topic seems relevant but no node for it exists in the index, omit the suggestion entirely. Any slug you return that is not in the index will be discarded.
- Use slugs EXACTLY as they appear (case, spaces, and punctuation preserved).
- Be conservative. Only suggest links/references with clear, specific topical overlap. Don't link on generic words ("music", "writing") unless the linked node specifically covers that very topic.
- Don't re-suggest links the node already has (you'll be told which slugs are already linked).
- Don't suggest a node link to itself.
- If a node has nothing worth suggesting, return empty arrays. Quality over quantity.

Index of ALL nodes in the garden:
${index}`;
}

async function analyzeNode(client, system, node) {
  const existing = existingLinks(node.content);
  const userPrompt = `Current node:
  slug: ${node.fileSlug}
  title: ${node.title}
  already-linked slugs (don't re-suggest): ${[...existing].join(', ') || '(none)'}

Body:
${node.content.trim()}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    thinking: { type: 'adaptive' },
    system: [
      { type: 'text', text: system, cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content: userPrompt }],
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: SCHEMA },
    },
  });

  const text = response.content.find((b) => b.type === 'text')?.text || '';
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { error: `failed to parse JSON: ${e.message}`, raw: text, usage: response.usage };
  }
  return { parsed, usage: response.usage };
}

function parseArgs(argv) {
  const out = { limit: Infinity, node: null, out: DEFAULT_OUT };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--limit') out.limit = Number(argv[++i]);
    else if (argv[i] === '--node') out.node = argv[++i];
    else if (argv[i] === '--out') out.out = path.resolve(argv[++i]);
  }
  return out;
}

function pad(n, width) {
  return String(n).padStart(width);
}

function htmlEscape(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderHtml({ results, totals, generatedAt, nodeCount, allNodes, droppedCount }) {
  const totalLinks = results.reduce((a, r) => a + (r.parsed?.suggested_links?.length || 0), 0);
  const totalRefs = results.reduce((a, r) => a + (r.parsed?.cross_references?.length || 0), 0);

  const allNodesMin = allNodes.map((n) => ({ slug: n.slug, fileSlug: n.fileSlug, title: n.title }));
  const dataJson = JSON.stringify({ results, totals, generatedAt, nodeCount, totalLinks, totalRefs, allNodes: allNodesMin, droppedCount });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Garden Link Suggestions</title>
<style>
:root {
  --bg: #1e2028;
  --bg-elev: #242830;
  --bg-deep: #1a1c22;
  --border: #3a3e48;
  --text: #d0d4dc;
  --muted: #808890;
  --muted2: #707888;
  --accent: #6aa8e8;
  --accent-soft: #1e2e48;
  --good: #7cc460;
  --warn: #e8b060;
  --error: #e05555;
  --badge-bg: #2e3240;
}
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.5;
  font-size: 14px;
}
.layout { display: grid; grid-template-columns: 320px 1fr; min-height: 100vh; }
aside {
  background: var(--bg-deep);
  border-right: 1px solid var(--border);
  position: sticky; top: 0;
  height: 100vh; overflow-y: auto;
  display: flex; flex-direction: column;
}
aside header {
  padding: 1rem 1rem 0.75rem;
  border-bottom: 1px solid var(--border);
}
aside header h1 { margin: 0 0 0.3rem; font-size: 1rem; }
aside header .meta { font-size: 0.75rem; color: var(--muted); }
.controls { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); }
.controls input[type="text"] {
  width: 100%;
  background: var(--bg-elev);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.4rem 0.5rem;
  font-size: 0.85rem;
}
.controls label { display: flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; color: var(--muted); margin-top: 0.5rem; cursor: pointer; }
.controls select {
  width: 100%;
  background: var(--bg-elev); color: var(--text); border: 1px solid var(--border);
  border-radius: 4px; padding: 0.3rem 0.4rem; font-size: 0.8rem; margin-top: 0.5rem;
}
nav { flex: 1; overflow-y: auto; padding: 0.25rem 0; }
.nav-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.4rem 1rem; color: var(--text); text-decoration: none; font-size: 0.85rem;
  border-left: 3px solid transparent;
}
.nav-item:hover { background: var(--bg-elev); }
.nav-item.active { background: var(--accent-soft); border-left-color: var(--accent); }
.nav-item .counts { font-size: 0.7rem; color: var(--muted); }
.nav-item .counts strong { color: var(--accent); margin-right: 0.4rem; }
.nav-item .counts em { color: var(--good); font-style: normal; }
.nav-item .slug { color: var(--muted2); font-family: monospace; font-size: 0.75rem; margin-left: 0.3rem; }

main { padding: 1.5rem 2rem; max-width: 900px; }
main h2 { margin: 0 0 0.25rem; font-size: 1.4rem; }
main .node-meta { color: var(--muted); font-family: monospace; font-size: 0.85rem; margin-bottom: 1rem; }
main .node-meta a { color: var(--accent); text-decoration: none; margin-right: 1rem; }
main .node-meta a:hover { text-decoration: underline; }

.section { margin-top: 1.5rem; }
.section h3 { font-size: 0.95rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 0.6rem; }
.empty { color: var(--muted2); font-style: italic; font-size: 0.85rem; }

.card {
  background: var(--bg-elev);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.6rem;
}
.card .head { display: flex; gap: 0.5rem; align-items: baseline; flex-wrap: wrap; }
.card .target {
  font-family: monospace;
  background: var(--accent-soft);
  color: var(--accent);
  padding: 0.1rem 0.5rem;
  border-radius: 3px;
  font-size: 0.85rem;
}
.card .target.missing { background: rgba(224,85,85,0.15); color: var(--error); }
.card .target a { color: inherit; text-decoration: none; }
.card .anchor { color: var(--good); font-style: italic; font-size: 0.85rem; }
.card .anchor::before { content: '"'; }
.card .anchor::after { content: '"'; }
.card .context, .card .rationale { margin-top: 0.4rem; font-size: 0.85rem; }
.card .context { color: var(--muted); }
.card .context::before { content: '> '; color: var(--muted2); }
.card .rationale { color: var(--text); }
.card .actions { margin-top: 0.5rem; font-size: 0.75rem; }
.card .actions a { color: var(--accent); text-decoration: none; margin-right: 1rem; }
.card .actions a:hover { text-decoration: underline; }

.stats { display: flex; gap: 1.5rem; margin-bottom: 1.5rem; font-size: 0.8rem; color: var(--muted); }
.stats span strong { color: var(--text); font-weight: 600; margin-right: 0.25rem; }
.error { color: var(--error); }
.no-node { color: var(--muted); padding: 2rem; text-align: center; }
</style>
</head>
<body>
<div class="layout">
  <aside>
    <header>
      <h1>Garden Link Suggestions</h1>
      <div class="meta" id="meta"></div>
    </header>
    <div class="controls">
      <input type="text" id="filter" placeholder="Filter by slug or title…">
      <select id="sort">
        <option value="suggestions">Sort: most suggestions</option>
        <option value="slug">Sort: slug A–Z</option>
        <option value="title">Sort: title A–Z</option>
      </select>
      <label><input type="checkbox" id="hide-empty" checked> Hide nodes with no suggestions</label>
    </div>
    <nav id="nav"></nav>
  </aside>
  <main id="main">
    <div class="no-node">Pick a node from the sidebar.</div>
  </main>
</div>

<script id="data" type="application/json">${dataJson.replaceAll('</', '<\\/')}</script>
<script>
const DATA = JSON.parse(document.getElementById('data').textContent);
const ELEVENTY = 'http://localhost:8080';
const CMS = 'http://localhost:5173';

const slugSet = new Set(DATA.allNodes.map(n => n.fileSlug.toLowerCase()));

function escapeHtml(s) {
  return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'", '&#39;');
}

function renderMeta() {
  const m = document.getElementById('meta');
  m.innerHTML = \`
    <div>\${DATA.nodeCount} nodes · \${DATA.totalLinks} link suggestions · \${DATA.totalRefs} cross-refs</div>
    <div style="margin-top:0.2rem;color:var(--muted2);font-size:0.7rem">generated \${new Date(DATA.generatedAt).toLocaleString()}</div>
  \`;
}

function getSortedFiltered() {
  const q = document.getElementById('filter').value.trim().toLowerCase();
  const hideEmpty = document.getElementById('hide-empty').checked;
  const sortBy = document.getElementById('sort').value;

  let items = DATA.results.slice();
  if (q) {
    items = items.filter(r =>
      r.node.fileSlug.toLowerCase().includes(q) ||
      r.node.title.toLowerCase().includes(q) ||
      r.node.slug.toLowerCase().includes(q)
    );
  }
  if (hideEmpty) {
    items = items.filter(r => (r.parsed && (r.parsed.suggested_links.length + r.parsed.cross_references.length > 0)) || r.error);
  }
  if (sortBy === 'slug') items.sort((a,b) => a.node.slug.localeCompare(b.node.slug));
  else if (sortBy === 'title') items.sort((a,b) => a.node.title.localeCompare(b.node.title));
  else items.sort((a,b) => {
    const ac = (a.parsed ? a.parsed.suggested_links.length + a.parsed.cross_references.length : 0);
    const bc = (b.parsed ? b.parsed.suggested_links.length + b.parsed.cross_references.length : 0);
    return bc - ac || a.node.slug.localeCompare(b.node.slug);
  });
  return items;
}

let selectedSlug = null;

function renderNav() {
  const nav = document.getElementById('nav');
  const items = getSortedFiltered();
  nav.innerHTML = items.map(r => {
    const links = r.parsed ? r.parsed.suggested_links.length : 0;
    const refs = r.parsed ? r.parsed.cross_references.length : 0;
    const isActive = r.node.slug === selectedSlug;
    return \`
      <a class="nav-item \${isActive ? 'active' : ''}" data-slug="\${escapeHtml(r.node.slug)}" href="#\${encodeURIComponent(r.node.slug)}">
        <div>\${escapeHtml(r.node.title)}<span class="slug">\${escapeHtml(r.node.slug)}</span></div>
        <div class="counts"><strong>\${links}</strong><em>\${refs}</em></div>
      </a>
    \`;
  }).join('');
}

function renderNode(r) {
  if (!r) {
    document.getElementById('main').innerHTML = '<div class="no-node">No matching node.</div>';
    return;
  }
  const eleventy = \`\${ELEVENTY}/garden/\${encodeURI(r.node.slug)}/\`;
  const cms = \`\${CMS}/edit/\${encodeURI(r.node.slug)}\`;

  let html = \`
    <h2>\${escapeHtml(r.node.title)}</h2>
    <div class="node-meta">
      <a href="\${cms}" target="_blank">Edit in CMS ↗</a>
      <a href="\${eleventy}" target="_blank">Preview ↗</a>
      <span>\${escapeHtml(r.node.slug)}</span>
    </div>
  \`;

  if (r.error) {
    html += \`<div class="error">Error: \${escapeHtml(r.error)}</div>\`;
  } else {
    const sl = r.parsed.suggested_links;
    const cr = r.parsed.cross_references;
    html += \`<div class="section">
      <h3>Suggested Wikilinks (\${sl.length})</h3>
      \${sl.length ? sl.map(s => renderSuggestion(s, r.node)).join('') : '<div class="empty">No new wikilink suggestions.</div>'}
    </div>\`;
    html += \`<div class="section">
      <h3>Could Elaborate This Node (\${cr.length})</h3>
      \${cr.length ? cr.map(c => renderCrossRef(c, r.node)).join('') : '<div class="empty">No cross-reference suggestions.</div>'}
    </div>\`;
  }

  document.getElementById('main').innerHTML = html;
}

function renderSuggestion(s, parentNode) {
  const exists = slugSet.has(s.slug.toLowerCase());
  const targetCms = exists ? \`\${CMS}/edit/\${encodeURI(s.slug)}\` : null;
  const targetView = exists ? \`\${ELEVENTY}/garden/\${encodeURI(s.slug)}/\` : null;
  const parentCms = \`\${CMS}/edit/\${encodeURI(parentNode.slug)}\`;
  return \`
    <div class="card">
      <div class="head">
        <span class="target \${exists ? '' : 'missing'}">
          \${exists ? \`<a href="\${targetCms}" target="_blank">[[\${escapeHtml(s.slug)}]]</a>\` : \`[[\${escapeHtml(s.slug)}]] ⚠ no such node\`}
        </span>
        <span class="anchor">\${escapeHtml(s.anchor_text)}</span>
      </div>
      <div class="context">\${escapeHtml(s.context)}</div>
      <div class="rationale">\${escapeHtml(s.rationale)}</div>
      <div class="actions">
        <a href="\${parentCms}" target="_blank">Edit \${escapeHtml(parentNode.slug)} →</a>
        \${exists ? \`<a href="\${targetView}" target="_blank">Preview target ↗</a>\` : ''}
      </div>
    </div>
  \`;
}

function renderCrossRef(c, parentNode) {
  const exists = slugSet.has(c.slug.toLowerCase());
  const targetCms = exists ? \`\${CMS}/edit/\${encodeURI(c.slug)}\` : null;
  const targetView = exists ? \`\${ELEVENTY}/garden/\${encodeURI(c.slug)}/\` : null;
  return \`
    <div class="card">
      <div class="head">
        <span class="target \${exists ? '' : 'missing'}">
          \${exists ? \`<a href="\${targetCms}" target="_blank">\${escapeHtml(c.slug)}</a>\` : \`\${escapeHtml(c.slug)} ⚠ no such node\`}
        </span>
      </div>
      <div class="rationale">\${escapeHtml(c.rationale)}</div>
      \${exists ? \`<div class="actions"><a href="\${targetView}" target="_blank">Preview target ↗</a></div>\` : ''}
    </div>
  \`;
}

function selectFromHash() {
  const slug = decodeURIComponent((location.hash || '').replace(/^#/, ''));
  if (!slug) return;
  const found = DATA.results.find(r => r.node.slug === slug);
  selectedSlug = slug;
  renderNav();
  renderNode(found);
}

document.addEventListener('click', e => {
  const a = e.target.closest('.nav-item');
  if (!a) return;
  e.preventDefault();
  const slug = a.dataset.slug;
  selectedSlug = slug;
  history.replaceState(null, '', '#' + encodeURIComponent(slug));
  renderNav();
  renderNode(DATA.results.find(r => r.node.slug === slug));
});

document.getElementById('filter').addEventListener('input', renderNav);
document.getElementById('sort').addEventListener('change', renderNav);
document.getElementById('hide-empty').addEventListener('change', renderNav);
window.addEventListener('hashchange', selectFromHash);

renderMeta();
renderNav();
selectFromHash();
</script>
</body>
</html>`;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not set in environment / .env');
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  const nodes = loadNodes();
  console.error(`Loaded ${nodes.length} garden nodes.`);

  let targets;
  if (args.node) {
    targets = nodes.filter((n) => n.fileSlug === args.node || n.slug === args.node);
    if (!targets.length) {
      console.error(`No node matches "${args.node}"`);
      process.exit(1);
    }
  } else {
    targets = nodes.slice(0, args.limit);
  }
  console.error(`Analyzing ${targets.length} node${targets.length === 1 ? '' : 's'}...`);

  const client = new Anthropic();
  const system = buildSystemPrompt(nodes);
  const width = String(targets.length).length;

  const validSlugs = new Set(nodes.map((n) => n.fileSlug.toLowerCase()));

  const results = [];
  const totals = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
  let droppedCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const node = targets[i];
    process.stderr.write(`[${pad(i + 1, width)}/${targets.length}] ${node.slug}…`);
    try {
      const r = await analyzeNode(client, system, node);
      // Drop hallucinated slugs and self-references before they reach the report.
      let dropped = 0;
      if (r.parsed) {
        const filter = (s) => {
          const key = s.slug.toLowerCase();
          const isSelf = key === node.fileSlug.toLowerCase();
          const exists = validSlugs.has(key);
          if (!exists || isSelf) { dropped++; return false; }
          return true;
        };
        r.parsed.suggested_links = r.parsed.suggested_links.filter(filter);
        r.parsed.cross_references = r.parsed.cross_references.filter(filter);
      }
      droppedCount += dropped;
      results.push({ node, parsed: r.parsed, error: r.error, raw: r.raw, usage: r.usage });
      totals.input += r.usage.input_tokens || 0;
      totals.output += r.usage.output_tokens || 0;
      totals.cacheRead += r.usage.cache_read_input_tokens || 0;
      totals.cacheWrite += r.usage.cache_creation_input_tokens || 0;
      const links = r.parsed?.suggested_links?.length || 0;
      const refs = r.parsed?.cross_references?.length || 0;
      const dropNote = dropped ? ` (dropped ${dropped})` : '';
      process.stderr.write(` ${r.error ? 'ERR' : `${links} links, ${refs} refs${dropNote}`}\n`);
    } catch (e) {
      results.push({ node, error: e.message, usage: { input_tokens: 0, output_tokens: 0 } });
      process.stderr.write(` ERROR: ${e.message}\n`);
    }
  }

  const html = renderHtml({
    results,
    totals,
    generatedAt: new Date().toISOString(),
    nodeCount: targets.length,
    allNodes: nodes,
    droppedCount,
  });

  fs.writeFileSync(args.out, html);

  // Sonnet 4.6: $3/M input, $15/M output, $0.30/M cache read, $3.75/M cache write
  const cost =
    (totals.input * 3) / 1_000_000 +
    (totals.output * 15) / 1_000_000 +
    (totals.cacheRead * 0.3) / 1_000_000 +
    (totals.cacheWrite * 3.75) / 1_000_000;

  console.error('');
  console.error(`Wrote ${args.out}`);
  console.error(`Tokens: input=${totals.input} output=${totals.output} cache_read=${totals.cacheRead} cache_write=${totals.cacheWrite}`);
  console.error(`Cost: $${cost.toFixed(4)}`);
  if (droppedCount) console.error(`Filtered out ${droppedCount} hallucinated/self-referential suggestion${droppedCount === 1 ? '' : 's'}.`);
  console.error(`Open: file://${args.out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
