// Build the static Lokta docs site into site/. Plain HTML plus the built token
// CSS and the component layer. Copies fonts, generates the page (overview,
// foundations, components, tokens reference), and leaves room for the rendered
// Marp deck (deck.html + lokta-deck.pdf) that CI drops alongside.
import { readFile, writeFile, mkdir, cp, rm, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const site = join(root, 'site');

const tokens = JSON.parse(await readFile(join(root, 'tokens/lokta.tokens.json'), 'utf8'));

// ── copy assets ───────────────────────────────────────────────────────────
await rm(site, { recursive: true, force: true });
await mkdir(site, { recursive: true });
await cp(join(root, 'packages/css/fonts'), join(site, 'fonts'), { recursive: true });
const copies = [
  ['packages/tokens/dist/css/lokta.css', 'lokta.tokens.css'],
  ['packages/css/fonts.css', 'fonts.css'],
  ['packages/css/lokta-base.css', 'lokta-base.css'],
  ['packages/css/lokta-components.css', 'lokta-components.css'],
  ['packages/css/lokta-icons.css', 'lokta-icons.css'],
  ['packages/css/lokta-stocks.css', 'lokta-stocks.css'],
  ['packages/css/lokta-utilities.css', 'lokta-utilities.css'],
  // The deterministic verification dashboard (the proof).
  ['proof/lokta-verification.html', 'verification.html'],
  // The components, icons, and accessibility reference (self-contained page).
  ['components/components.html', 'components.html'],
  ['components/lokta-ref.js', 'lokta-ref.js'],
  // Publishable example templates, built only from Lokta classes.
  ['templates/dashboard.html', 'dashboard.html'],
  ['templates/landing.html', 'landing.html'],
  ['templates/cookbook.html', 'cookbook.html'],
  ['templates/patterns.html', 'patterns.html'],
  // External icon sprite the templates reference via <use href>.
  ['packages/css/icons/lokta-icons.svg', 'lokta-icons.svg'],
  ['packages/css/lokta-behaviors.js', 'lokta-behaviors.js'],
  // Mermaid: theme config, web ESM, CSS, and the pre-rendered demo diagram.
  ['packages/mermaid/index.mjs', 'lokta.mermaid.mjs'],
  ['packages/mermaid/lokta-mermaid.json', 'lokta-mermaid.json'],
  ['packages/mermaid/lokta-mermaid.css', 'lokta-mermaid.css'],
  ['packages/mermaid/example.svg', 'diagram-demo.svg'],
  // The deck render (CI) references this beside deck.html.
  ['packages/marp-theme/lokta-pipeline.svg', 'lokta-pipeline.svg'],
];
for (const [from, to] of copies) await cp(join(root, from), join(site, to));

// Self-contained drop-in for the site: import the tokens first so a single
// <link href="lokta.css"> is genuinely batteries-included (the @lokta/css
// package keeps tokens separate; here everything is co-located).
const dropin = await readFile(join(root, 'packages/css/lokta.css'), 'utf8');
await writeFile(join(site, 'lokta.css'), `@import "./lokta.tokens.css";\n${dropin}`);

// Typst example PDFs, if built (build:typst runs first in the pipeline).
const typstPdfs = ['example', 'example-recipe', 'example-cover'];
const typstHere = {};
for (const name of typstPdfs) {
  const src = join(root, 'packages/typst/dist', `${name}.pdf`);
  typstHere[name] = await access(src).then(
    () => true,
    () => false,
  );
  if (typstHere[name]) await cp(src, join(site, `${name}.pdf`));
}

// Figma Variables manifest, if built (build:figma).
const figmaSrc = join(root, 'packages/tokens/dist/figma/lokta.variables.json');
const figmaHere = await access(figmaSrc).then(
  () => true,
  () => false,
);
if (figmaHere) await cp(figmaSrc, join(site, 'lokta.variables.json'));

// ── helpers ─────────────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const swatch = (name, value, note) => `
  <figure class="sw">
    <div class="sw-chip" style="background:${esc(value)}"></div>
    <figcaption>
      <code>${esc(name)}</code>
      <span class="sw-hex">${esc(value)}</span>
      ${note ? `<span class="sw-note">${esc(note)}</span>` : ''}
    </figcaption>
  </figure>`;

// ── colour ──────────────────────────────────────────────────────────────────
const p = tokens.primitives;
const paperSwatches = Object.entries(p.paper)
  .map(([k, v]) => swatch(`paper.${k}`, v.$value, v.$description))
  .join('');
const inkSwatches = Object.entries(p.ink)
  .map(([k, v]) => swatch(`ink.${k}`, v.$value, v.$description))
  .join('');
const pigmentSwatches = Object.entries(p.pigment)
  .map(([k, v]) => swatch(`pigment.${k}`, v.$value, v.$description))
  .join('');

const STOCKS = [
  { id: 'paper', name: 'Paper', sub: 'light, default' },
  { id: 'ink', name: 'Ink', sub: 'warm dark' },
  { id: 'bone', name: 'Bone', sub: 'cool light' },
  { id: 'indigo', name: 'Indigo', sub: 'cool dark' },
];
// Extra stocks shipped via lokta-stocks.css (not token-built, but AA-validated).
const EXTRA_STOCKS = [
  { id: 'manuscript', name: 'Manuscript' },
  { id: 'highland', name: 'Highland' },
  { id: 'pine', name: 'Pine' },
  { id: 'mulberry', name: 'Mulberry' },
  { id: 'slate', name: 'Slate' },
  { id: 'steel', name: 'Steel' },
  { id: 'onyx', name: 'Onyx' },
  { id: 'slate-light', name: 'Slate L' },
  { id: 'steel-light', name: 'Steel L' },
  { id: 'onyx-light', name: 'Onyx L' },
];
const stockCards = STOCKS.map(
  (s) => `
  <div class="stock-card" data-theme="${s.id}">
    <div class="lk-label">${esc(s.name)} · ${esc(s.sub)}</div>
    <p class="stock-h">Headline primary</p>
    <p class="stock-b">Body text on the page surface, AA across every role.</p>
    <p class="stock-s">Secondary · muted</p>
    <div class="stock-row">
      <span class="lk-status lk-status-done">Done</span>
      <span class="lk-status lk-status-alert">Alert</span>
      <button class="lk-btn lk-btn-primary" type="button">Action</button>
    </div>
  </div>`,
).join('');

// ── type set ──────────────────────────────────────────────────────────────
const TYPE_ROLES = [
  ['Display', 'type-3xl', '72 / 1.05', '800', '-0.03em', 'Book cover'],
  ['Section', 'type-2xl', '48 / 1.05', '700', '-0.03em', 'Section opener'],
  ['Title', 'type-xl', '32 / 1.2', '700', '-0.01em', 'Recipe title'],
  ['Subhead', 'type-lg', '24 / 1.2', '600', '-0.01em', 'Deck'],
  ['Lead', 'type-md', '18 / 1.45', '400', '0', 'Lead-in'],
  ['Body', 'type-base', '15 / 1.45', '400', '0', 'Paragraphs'],
  ['Caption', 'type-sm', '13 / 1.45', '400', '0', 'Meta, captions'],
  ['Label', 'type-xs', '11 / 1.2', '500', '0.12em', 'Tracked mono label'],
];
const typeRows = TYPE_ROLES.map(
  ([role, tok, lh, wt, track, use]) => `
  <tr>
    <td><span style="font-size:var(--${tok});font-weight:${wt};letter-spacing:${track};line-height:1;color:var(--text-primary)">${esc(role)}</span></td>
    <td><code>--${tok}</code></td>
    <td class="lk-table-num">${esc(lh)}</td>
    <td class="lk-table-num">${esc(wt)}</td>
    <td class="lk-table-num">${esc(track)}</td>
    <td>${esc(use)}</td>
  </tr>`,
).join('');

// ── spacing ─────────────────────────────────────────────────────────────────
const spaceRows = Object.entries(p.space)
  .map(
    ([k, v]) => `
  <div class="space-row">
    <code>space-${k}</code>
    <span class="space-bar" style="width:${v.$value}"></span>
    <span class="space-val">${v.$value}</span>
  </div>`,
  )
  .join('');

// ── motion ──────────────────────────────────────────────────────────────────
const MOTION = [
  ['--ease-paper', 'cubic-bezier(0.2, 0, 0.1, 1)', 'UI feedback'],
  ['--ease-productive', 'cubic-bezier(0.2, 0, 0.38, 0.9)', 'State changes'],
  ['--ease-expressive', 'cubic-bezier(0.4, 0.14, 0.3, 1)', 'Entrances'],
  ['--dur-fast', '120ms', 'Hover, press'],
  ['--dur-base', '200ms', 'Most transitions'],
  ['--dur-slow', '320ms', 'Overlays'],
];
const motionRows = MOTION.map(
  ([n, v, u]) =>
    `<tr><td><code>${esc(n)}</code></td><td class="lk-mono">${esc(v)}</td><td>${esc(u)}</td></tr>`,
).join('');

// ── icons (self-hosted sharpened sprite; vendored by build:icons) ───────────
const spriteFile = join(root, 'packages/css/icons/lokta-icons.svg');
const iconSprite = await access(spriteFile).then(
  () => readFile(spriteFile, 'utf8'),
  () => '',
);
const ico = (name, size = 28) =>
  `<svg class="lk-ico" style="width:${size}px;height:${size}px" aria-hidden="true"><use href="#lk-i-${name}"></use></svg>`;
const iconRow = [
  'arrow-right',
  'check',
  'alert-triangle',
  'circle',
  'chevron-right',
  'search',
  'settings',
  'star',
  'download',
  'external-link',
]
  .map((n) => ico(n))
  .join('');

// ── tokens reference table (generated from the JSON) ────────────────────────
const SETS = ['primitives', 'semantic-paper', 'semantic-ink', 'stock-bone', 'stock-indigo'];
function flatten(obj, prefix = []) {
  const rows = [];
  for (const [k, v] of Object.entries(obj)) {
    if (k.startsWith('$')) continue;
    if (v && typeof v === 'object' && '$value' in v) {
      rows.push({
        path: [...prefix, k].join('.'),
        type: v.$type || '',
        value: v.$value,
        note: v.$description || '',
      });
    } else if (v && typeof v === 'object') {
      rows.push(...flatten(v, [...prefix, k]));
    }
  }
  return rows;
}
const isRef = (v) => typeof v === 'string' && v.startsWith('{');
const tokenTables = SETS.map((set) => {
  const rows = flatten(tokens[set])
    .map(
      (r) => `<tr>
        <td><code>${esc(r.path)}</code></td>
        <td>${esc(r.type)}</td>
        <td>${isRef(r.value) ? `<code>${esc(r.value)}</code>` : `<span class="tok-val"><span class="tok-chip" style="background:${esc(r.value)}"></span>${esc(r.value)}</span>`}</td>
        <td>${esc(r.note)}</td>
      </tr>`,
    )
    .join('');
  return `<h3 class="tok-set"><code>${esc(set)}</code></h3>
    <table class="lk-table tok-table"><thead><tr><th>Token</th><th>Type</th><th>Value</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table>`;
}).join('');

// ── deck link (rendered by CI; degrade gracefully when absent) ──────────────
const deckHere = await access(join(site, 'deck.html')).then(
  () => true,
  () => false,
);
const deckLinks = `
  <p>The Lokta Marp theme renders this brief as slides, with the same fonts and pigments.</p>
  <div class="lk-row">
    <a class="lk-btn lk-btn-primary" href="deck.html">View deck (HTML)</a>
    <a class="lk-btn" href="lokta-deck.pdf">Download PDF</a>
  </div>
  ${deckHere ? '' : '<p class="muted">The deck is rendered into this site by the Pages workflow. To preview locally, run <code>npm run build:deck</code> and copy <code>deck.html</code> plus <code>lokta-deck.pdf</code> into <code>site/</code>.</p>'}`;

// ── diagrams (Mermaid) ──────────────────────────────────────────────────────
const MERMAID_CLASSES = [
  ['hero', 'marigold', 'the one node to read first'],
  ['store', 'celadon', 'a datastore'],
  ['dec', 'indigo', 'a decision'],
  ['danger', 'cinnabar', 'a failure or drop'],
  ['muted', 'paper', 'secondary'],
];
const diagramsSection = `
  <p class="muted">The same diagram theme renders live in the browser and pre-renders to SVG for print and Typst. Square nodes, 1.5px ink strokes, straight edges, Archivo labels, Spline Sans Mono edge labels. Load a token theme and the colours track the active stock.</p>
  <div class="comp-demo" style="justify-content:center"><img src="diagram-demo.svg" alt="Lokta-themed flowchart: Intake to Validate to a Dedupe decision, then to an event store or a drop." style="max-width:100%"></div>
  <h3 class="sub-h">Node classes</h3>
  <table class="lk-table" style="max-width:520px"><thead><tr><th>Class</th><th>Pigment</th><th>Use</th></tr></thead><tbody>
    ${MERMAID_CLASSES.map(([c, pig, use]) => `<tr><td><code>${c}</code></td><td>${pig}</td><td>${esc(use)}</td></tr>`).join('')}
  </tbody></table>
  <h3 class="sub-h">Use it</h3>
  <pre class="lk-code">// web
import mermaid from "mermaid";
import { initLoktaMermaid } from "@lokta/mermaid";
initLoktaMermaid(mermaid);

// print / Typst
mmdc -c lokta-mermaid.json -C lokta-mermaid.print.css -i d.mmd -o d.svg</pre>
  <p class="muted">Zero install on the web: import <code>https://msradam.github.io/lokta/lokta.mermaid.mjs</code> and the theme JSON beside it.</p>`;

// ── documents (Typst) ───────────────────────────────────────────────────────
const TYPST_TEMPLATES = [
  ['lokta-tech', 'White technical report'],
  ['lokta-report', 'Cream editorial report'],
  ['lokta-article', 'Long-form editorial'],
  ['lokta-bulletin', 'Single-sheet notice'],
  ['lokta-letter', 'Correspondence'],
  ['lokta-cover', 'Pigment ground with the vertical spine'],
  ['lokta-recipe', 'After the cookbook page'],
];
const typstPdf = (name, label) =>
  typstHere[name]
    ? `<a class="lk-btn" href="${name}.pdf">${esc(label)} (PDF)</a>`
    : `<a class="lk-btn" aria-disabled="true">${esc(label)} (PDF)</a>`;
const documentsSection = `
  <p class="muted">The print arm of the system: Typst document themes that carry the same cream stock, hatched rules, mono labels, and right-aligned grotesk titles onto the page. Built with the vendored static fonts.</p>
  <div class="lk-row">
    ${typstPdf('example', 'Technical report')}
    ${typstPdf('example-recipe', 'Recipe')}
    ${typstPdf('example-cover', 'Cover')}
  </div>
  <table class="lk-table" style="max-width:560px;margin-top:20px"><thead><tr><th>Template</th><th>What it is</th></tr></thead><tbody>
    ${TYPST_TEMPLATES.map(([t, d]) => `<tr><td><code>${t}</code></td><td>${esc(d)}</td></tr>`).join('')}
  </tbody></table>
  <h3 class="sub-h">Use it</h3>
  <pre class="lk-code">#import "@local/lokta:0.1.0": *
#show: lokta-recipe.with(title: "Dashi Broth", film: "Spirited Away", ..)</pre>`;

// ── page ────────────────────────────────────────────────────────────────────
const html = `<!doctype html>
<html lang="en" data-theme="paper">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lokta · An editorial UI design system</title>
<meta name="description" content="Lokta, an editorial UI design system adapted from the page layout of the cookbook Cuisine on Screen (Sachiyo Harada, Prestel).">
<link rel="stylesheet" href="fonts.css">
<link rel="stylesheet" href="lokta.tokens.css">
<link rel="stylesheet" href="lokta-base.css">
<link rel="stylesheet" href="lokta-components.css">
<link rel="stylesheet" href="lokta-icons.css">
<link rel="stylesheet" href="lokta-utilities.css">
<link rel="stylesheet" href="lokta-stocks.css">
<link rel="stylesheet" href="styles.css">
<script src="lokta-behaviors.js" defer></script>
</head>
<body class="lk lk-sheet">
${iconSprite}
<a class="lk-sr-only" href="#main">Skip to content</a>

<header class="topbar">
  <div class="brand"><span class="lk-label">Lokta</span> <span class="muted">An editorial UI system · v0.1</span></div>
  <nav class="topnav" aria-label="Sections">
    <a href="#overview">Overview</a>
    <a href="#install">Install</a>
    <a href="#customization">Customization</a>
    <a href="#foundations">Foundations</a>
    <a href="#components">Components</a>
    <a href="#templates">Templates</a>
    <a href="#diagrams">Diagrams</a>
    <a href="#documents">Documents</a>
    <a href="#deck">Deck</a>
    <a href="#tokens">Tokens</a>
  </nav>
  <div class="switcher" role="group" aria-label="Theme">
    ${[...STOCKS, ...EXTRA_STOCKS].map((s) => `<button class="lk-btn theme-btn" type="button" data-set-theme="${s.id}" aria-pressed="${s.id === 'paper'}">${esc(s.name)}</button>`).join('')}
  </div>
</header>

<main id="main" class="wrap">

  <section id="overview" class="cover">
    <div class="lk-running-head"><span>映画の料理 · LOKTA</span><span>WCAG 2.2 AA</span></div>
    <p class="lk-label" style="margin-top:24px">After Cuisine on Screen · Prestel</p>
    <h1 class="cover-title">Lokta</h1>
    <p class="cover-lede lk-serif">One cookbook's page system, ported to the screen. Lokta adapts the layout of Sachiyo Harada's Cuisine on Screen (Prestel): a warm cream stock, a vertical 映画の料理 spine, hatched rules that let a section breathe, grotesk titles run hard to the right margin, and marigold grounds on the film-opener spreads. It holds every text role to WCAG 2.2 AA.</p>
    <div class="lk-measure"><span class="lk-measure-line" style="width:120px"></span><span class="lk-measure-gap"></span><span class="lk-measure-hatch"></span></div>
    <div class="cover-grid">
      <div><span class="lk-label">Type</span><p>Archivo, Spline Sans Mono, Source Serif 4, Noto Sans JP, Anek Bangla. All SIL OFL, self-hosted.</p></div>
      <div><span class="lk-label">Color</span><p>Warm paper surfaces, warm-tinted ink text, saturated pigment grounds. Marigold is the hero.</p></div>
      <div><span class="lk-label">Stocks</span><p>Paper, Ink, Bone, Indigo. Every text role clears AA on each.</p></div>
      <div><span class="lk-label">Tokens</span><p>Three tiers (primitives, semantic, stocks) built with Style Dictionary to CSS, SCSS, and JS.</p></div>
    </div>
  </section>

  <section id="install">
    <h2 class="sec-h">Install</h2>
    <p class="muted">Three ways in. Set the stock with <code>data-theme</code> on <code>&lt;html&gt;</code> (default is paper).</p>
    <div class="install-grid">
      <div>
        <h3 class="sub-h">npm</h3>
        <pre class="lk-code">npm install @lokta/tokens @lokta/css</pre>
        <pre class="lk-code">@import "@lokta/tokens/css/lokta.css";
@import "@lokta/css/lokta.css";</pre>
      </div>
      <div>
        <h3 class="sub-h">Standalone repos</h3>
        <pre class="lk-code">npm install github:msradam/lokta-css
npm install github:msradam/lokta-marp
npm install github:msradam/lokta-typst
npm install github:msradam/lokta-mermaid</pre>
        <p class="muted">Each repo is self-contained with its own quick start.</p>
      </div>
      <div>
        <h3 class="sub-h">Drop-in (no build)</h3>
        <pre class="lk-code">&lt;link rel="stylesheet"
  href="https://msradam.github.io/lokta/lokta.css"&gt;</pre>
        <p class="muted">The site <code>lokta.css</code> bundles the tokens, base, components, and utilities in one link.</p>
      </div>
    </div>
    <p class="lk-row">
      <a class="lk-btn" href="components.html">Components reference</a>
      <a class="lk-btn" href="patterns.html">Patterns gallery</a>
      <a class="lk-btn" href="https://github.com/msradam/lokta">Source on GitHub</a>
    </p>
  </section>

  <section id="customization">
    <h2 class="sec-h">Customization</h2>
    <p class="muted">Opinion lives in what cannot be changed. Lokta exposes six brand dials, each range-limited so even at its extreme the output is recognizably Lokta. Everything else (the type scale, the 8px grid, the AA rules, the flat hard-edged character) is locked.</p>
    <h3 class="sub-h">The six dials</h3>
    <table class="lk-table"><thead><tr><th>Dial</th><th>Range (the guardrail)</th></tr></thead><tbody>
      <tr><td>Stock</td><td>a curated set (paper, manuscript, bone, ink, indigo, highland, slate, steel, onyx, and light variants), not a freeform background</td></tr>
      <tr><td>Accent</td><td>a curated pigment (marigold, madder, lac, cinnabar, indigo, …), not a colour picker</td></tr>
      <tr><td>Voice</td><td>named typeface options per role (Archivo or Mukta for display, Source Serif or Martel for serif). Script is automatic by language, never a dial</td></tr>
      <tr><td>Density</td><td>comfortable or compact. Two steps</td></tr>
      <tr><td>Radius</td><td>clamped 0 to 3px. Square is the default and the ceiling is gentle</td></tr>
      <tr><td>Grain</td><td>off, subtle, or fibrous. Texture, never depth</td></tr>
    </tbody></table>
    <h3 class="sub-h">Why six, and why range-limited</h3>
    <p class="muted">Disciplined systems converge on three to eight consumer dials, clustering at five to six. The strength is in the constraints: every dial is range-limited rather than freeform, the font work is one Voice dial rather than several inputs, and script is an automatic context, not a preference.</p>
    <table class="lk-table"><thead><tr><th>System</th><th>Consumer dials</th></tr></thead><tbody>
      <tr><td>Radix Themes</td><td>accent, gray, appearance, radius, scaling, panel (about 6)</td></tr>
      <tr><td>Material 3</td><td>a seed colour plus light/dark (about 1 to 2)</td></tr>
      <tr><td>USWDS</td><td>colour families, spacing base, type scale, font families (a handful)</td></tr>
      <tr><td>Lokta</td><td>Stock, Accent, Voice, Density, Radius, Grain (6)</td></tr>
    </tbody></table>
    <p class="muted">If a brand needs more, the answer is a new curated option inside an existing dial (a new stock, a new accent, a new Voice option), or a component token, never a new knob. Full philosophy in <a href="https://github.com/msradam/lokta/blob/main/CUSTOMIZATION.md">CUSTOMIZATION.md</a>.</p>
  </section>

  <section id="foundations">
    <h2 class="sec-h">Foundations</h2>

    <h3 class="sub-h">Color</h3>
    <p class="muted">Never pure white, never pure black. Contrast ratios are noted against paper-01. Every text role clears WCAG 2.2 AA on its surface in every stock.</p>
    <div class="lk-label rule-label">Paper · surfaces</div>
    <div class="sw-grid">${paperSwatches}</div>
    <div class="lk-label rule-label">Ink · text</div>
    <div class="sw-grid">${inkSwatches}</div>
    <div class="lk-label rule-label">Pigment · grounds</div>
    <div class="sw-grid">${pigmentSwatches}</div>
    <div class="lk-label rule-label">Stocks</div>
    <div class="stock-grid">${stockCards}</div>

    <h3 class="sub-h">Type</h3>
    <p class="muted">A real type set: every size pairs a line-height, weight, and tracking.</p>
    <table class="lk-table"><thead><tr><th>Role</th><th>Token</th><th>Size / LH</th><th>Weight</th><th>Tracking</th><th>Use</th></tr></thead><tbody>${typeRows}</tbody></table>
    <div class="type-families">
      <div class="lk-card"><span class="lk-label">Display / Body</span><p style="font-size:var(--type-lg)">Archivo. A neutral editorial grotesk.</p></div>
      <div class="lk-card"><span class="lk-label">Mono</span><p class="lk-mono" style="font-size:var(--type-lg)">Spline Sans Mono 0123</p></div>
      <div class="lk-card"><span class="lk-label">Serif</span><p class="lk-serif" style="font-size:var(--type-lg);font-style:italic">Source Serif 4 pull quote</p></div>
      <div class="lk-card"><span class="lk-label">CJK</span><p class="lk-cjk-jp" style="font-size:var(--type-lg)">映画の料理</p></div>
      <div class="lk-card"><span class="lk-label">Bengali</span><p class="lk-bn" style="font-size:var(--type-lg)">রান্না খাদ্য পুষ্টি</p></div>
    </div>

    <h3 class="sub-h">Spacing</h3>
    <p class="muted">An 8px grid with a 4px half-step. Generous gutters, paper measure.</p>
    <div class="space-scale">${spaceRows}</div>

    <h3 class="sub-h">Grid</h3>
    <p class="muted">Twelve columns, 24px gutters (space-5), on an 8px base. Body measure caps near 72ch for readability. Breakpoints: 480 · 768 · 1024 · 1440.</p>
    <div class="grid-demo">${Array.from({ length: 12 }, () => '<span></span>').join('')}</div>

    <h3 class="sub-h">Motion</h3>
    <p class="muted">Paper does not bounce. Productive easing for feedback, expressive for entrances. Honors <code>prefers-reduced-motion</code>.</p>
    <table class="lk-table"><thead><tr><th>Token</th><th>Value</th><th>Use</th></tr></thead><tbody>${motionRows}</tbody></table>

    <h3 class="sub-h">Icons</h3>
    <p class="muted">Tabler as the base, sharpened: square line caps, miter joins, 2px stroke, currentColor. Self-hosted as a vendored sprite (<code>npm run build:icons</code>); Myna UI is the alternative set. The live searchable browser is on the <a href="components.html">components reference</a>.</p>
    <div class="icon-row">${iconRow}</div>
  </section>

  <section id="components">
    <h2 class="sec-h">Components</h2>
    <p class="muted">Built on the semantic layer, so they theme with the switcher above. Use it to feel every stock.</p>
    <p class="lk-row"><a class="lk-btn lk-btn-primary" href="components.html">Open the components, icons, and accessibility reference</a></p>
    <p class="muted">The reference page is keyboard-operable (tabs, accordion, dialog, menu) with the ARIA wiring from <code>lokta-behaviors.js</code>, and a live icon browser. It is what the Playwright and axe suite tests.</p>

    ${component(
      'Buttons',
      'Printed keys. 36px minimum target, square caps, optional radius via --lk-radius.',
      `
      <button class="lk-btn" type="button">Default</button>
      <button class="lk-btn lk-btn-primary" type="button">Primary</button>
      <button class="lk-btn lk-btn-lg" type="button">Large</button>
      <button class="lk-btn" type="button" disabled>Disabled</button>`,
    )}

    ${component(
      'Tags',
      'Hard-cornered metadata pills.',
      `
      <span class="lk-tag">Outline</span>
      <span class="lk-tag lk-tag-filled">Filled</span>
      <span class="lk-tag lk-tag-pigment">Pigment</span>`,
    )}

    ${component(
      'Inputs',
      'Text, select, textarea, with placeholder and disabled states.',
      `
      <div class="lk-field" style="max-width:320px">
        <label class="lk-label" for="d-in">Field</label>
        <input class="lk-input" id="d-in" placeholder="Placeholder text">
      </div>
      <div class="lk-field" style="max-width:320px">
        <label class="lk-label" for="d-sel">Select</label>
        <select class="lk-select" id="d-sel"><option>Paper</option><option>Ink</option></select>
      </div>
      <input class="lk-input" style="max-width:320px" value="Disabled" disabled>`,
    )}

    ${component(
      'Checkbox &amp; radio',
      'Square caps; the radio reads with an inner filled square.',
      `
      <label class="lk-check"><input type="checkbox" checked> Checked</label>
      <label class="lk-check"><input type="checkbox"> Unchecked</label>
      <label class="lk-radio"><input type="radio" name="d-r" checked> Selected</label>
      <label class="lk-radio"><input type="radio" name="d-r"> Option</label>`,
    )}

    ${component(
      'Tabs',
      'Live: click or use Left/Right, Home/End. Roving tabindex, real ARIA.',
      `
      <div style="max-width:520px">
        <div class="lk-tabs" role="tablist" data-tabs aria-label="Example tabs">
          <button class="lk-tab" role="tab" id="t1" aria-controls="tp1" aria-selected="true">Overview</button>
          <button class="lk-tab" role="tab" id="t2" aria-controls="tp2" aria-selected="false">Detail</button>
          <button class="lk-tab" role="tab" id="t3" aria-controls="tp3" aria-selected="false">History</button>
        </div>
        <div id="tp1" role="tabpanel" aria-labelledby="t1" style="padding:14px 2px">The overview panel.</div>
        <div id="tp2" role="tabpanel" aria-labelledby="t2" style="padding:14px 2px" hidden>The detail panel.</div>
        <div id="tp3" role="tabpanel" aria-labelledby="t3" style="padding:14px 2px" hidden>The history panel.</div>
      </div>`,
    )}

    ${component(
      'Accordion',
      'Live: Enter or Space toggles each panel (aria-expanded + region).',
      `
      <div class="lk-accordion" style="max-width:520px">
        <button class="lk-acc-head" aria-expanded="true" aria-controls="acp1">What is a stock?</button>
        <div class="lk-acc-body" id="acp1" role="region">A stock re-points the semantic layer: Paper, Ink, Bone, Indigo.</div>
        <button class="lk-acc-head" aria-expanded="false" aria-controls="acp2">Is it accessible?</button>
        <div class="lk-acc-body" id="acp2" role="region" hidden>Every text role clears WCAG 2.2 AA on its surface, in every stock.</div>
      </div>`,
    )}

    ${component(
      'Menu',
      'Live: ArrowDown opens, arrows move, Escape closes and restores focus.',
      `
      <div class="lk-menu" data-menu>
        <button class="lk-btn lk-menu-btn" data-menu-btn aria-haspopup="true" aria-expanded="false">Actions</button>
        <ul class="lk-menu-list" role="menu" data-menu-list hidden>
          <li><button role="menuitem">Duplicate</button></li>
          <li><button role="menuitem">Export</button></li>
          <li><button role="menuitem">Delete</button></li>
        </ul>
      </div>`,
    )}

    ${component(
      'Dialog',
      'Live: opens with focus trap, Escape closes, focus returns to the trigger.',
      `
      <button class="lk-btn lk-btn-primary" data-open-dialog="siteDialog">Open dialog</button>
      <div class="lk-modal-backdrop" id="siteDialog" role="dialog" aria-modal="true" aria-labelledby="siteDialog-t" hidden>
        <div class="lk-modal">
          <div class="lk-modal-head"><span class="lk-modal-title" id="siteDialog-t">Set the stock</span><button class="lk-btn" data-close-dialog="siteDialog" aria-label="Close">&#10005;</button></div>
          <p>Choose a paper for the run. The choice re-points every semantic token.</p>
          <div class="lk-modal-foot"><button class="lk-btn" data-close-dialog="siteDialog">Cancel</button><button class="lk-btn lk-btn-primary" data-close-dialog="siteDialog">Confirm</button></div>
        </div>
      </div>`,
    )}

    ${component(
      'Inline notifications',
      'Color is paired with a glyph, so meaning never relies on hue.',
      `
      <div class="lk-note lk-note-success" style="max-width:520px"><div><span class="lk-note-title">Saved</span><div>The page was written to the press.</div></div></div>
      <div class="lk-note lk-note-danger" style="max-width:520px"><div><span class="lk-note-title">Failed</span><div>The plate did not register.</div></div></div>
      <div class="lk-note lk-note-info" style="max-width:520px"><div><span class="lk-note-title">Note</span><div>Marigold demands dark text.</div></div></div>`,
    )}

    ${component(
      'Breadcrumb',
      '',
      `
      <ol class="lk-breadcrumb"><li><a href="#">Library</a></li><li><a href="#">Stocks</a></li><li aria-current="page">Paper</li></ol>`,
    )}

    ${component(
      'Pagination',
      '',
      `
      <div class="lk-pagination">
        <button class="lk-page" type="button">Prev</button>
        <button class="lk-page" aria-current="page" type="button">1</button>
        <button class="lk-page" type="button">2</button>
        <button class="lk-page" type="button">3</button>
        <button class="lk-page" type="button">Next</button>
      </div>`,
    )}

    ${component(
      'Progress',
      '',
      `
      <div class="lk-progress" style="max-width:420px" role="progressbar" aria-valuenow="64" aria-valuemin="0" aria-valuemax="100"><div class="lk-progress-bar" style="width:64%"></div></div>`,
    )}

    ${component('Slider', '', `<input class="lk-slider" type="range" min="0" max="100" value="40" style="max-width:420px" aria-label="Demo slider">`)}

    ${component(
      'Tooltip',
      'Hover or focus the button.',
      `
      <button class="lk-btn lk-has-tooltip" type="button" data-tooltip="Hatched end-mark">Hover me</button>
      <span class="lk-tooltip">Static tooltip</span>`,
    )}

    ${component(
      'Status',
      '',
      `
      <span class="lk-status lk-status-done">Done</span>
      <span class="lk-status lk-status-alert">Alert</span>
      <span class="lk-status lk-status-pending">Pending</span>`,
    )}

    ${component(
      'Code',
      '',
      `
      <pre class="lk-code">npm install @lokta/tokens @lokta/css</pre>
      <p>Inline <code class="lk-code-inline">--surface-page</code> too.</p>`,
    )}

    ${component(
      'Data table',
      'Tracked mono headers, hairline rules, striped rows, tabular figures.',
      `
      <table class="lk-table" style="max-width:520px"><thead><tr><th>Stock</th><th>Surface</th><th class="lk-table-num">Roles</th></tr></thead>
      <tbody><tr><td>Paper</td><td><code>paper-01</code></td><td class="lk-table-num">12</td></tr>
      <tr><td>Ink</td><td><code>ink-90</code></td><td class="lk-table-num">12</td></tr>
      <tr><td>Indigo</td><td><code>#1B2230</code></td><td class="lk-table-num">12</td></tr></tbody></table>`,
    )}

    ${component(
      'Modal',
      'The one shadow in the system: a single hard offset, no blur.',
      `
      <div class="lk-modal" style="position:static">
        <div class="lk-modal-head"><span class="lk-modal-title">Set the stock</span><button class="lk-btn" type="button" aria-label="Close">✕</button></div>
        <p>Choose a paper for the run. The choice re-points every semantic token.</p>
        <div class="lk-modal-foot"><button class="lk-btn" type="button">Cancel</button><button class="lk-btn lk-btn-primary" type="button">Confirm</button></div>
      </div>`,
    )}

    ${component(
      'Editorial marks',
      'Rules, the measured rule, and the hatched end-mark.',
      `
      <div style="display:grid;gap:14px;max-width:520px">
        <hr class="lk-rule">
        <hr class="lk-rule-thick">
        <hr class="lk-rule-double">
        <div class="lk-measure"><span class="lk-measure-line" style="width:160px"></span><span class="lk-measure-gap"></span><span class="lk-measure-hatch"></span></div>
        <span class="lk-endmark"></span>
      </div>`,
    )}

    ${component(
      'Page furniture',
      'Running head, colophon, folio.',
      `
      <div style="display:grid;gap:14px;max-width:520px">
        <div class="lk-running-head"><span>Chapter · Stocks</span><span>p. 12</span></div>
        <div class="lk-colophon"><span>Lokta</span><span>Set in Archivo &amp; Spline Sans Mono</span></div>
        <div class="lk-folio">012</div>
      </div>`,
    )}
  </section>

  <section id="templates">
    <h2 class="sec-h">Templates</h2>
    <p class="muted">Whole-page examples built only from Lokta classes (app shell, stat cards, marketing kit), plus a small interactive demo app. Copy the markup as a starting point. All are part of the axe-core suite.</p>
    <p class="lk-row">
      <a class="lk-btn lk-btn-primary" href="cookbook.html">Open the cookbook demo</a>
      <a class="lk-btn lk-btn-primary" href="dashboard.html">Open the dashboard template</a>
      <a class="lk-btn lk-btn-primary" href="landing.html">Open the landing template</a>
      <a class="lk-btn" href="patterns.html">Patterns gallery</a>
    </p>
    <p class="muted">The cookbook is a film-dish browser (after <em>Cuisine on Screen</em>): live search, tag filters, a recipe dialog with an ingredient table, save-to-list with a toast, and a stock switcher.</p>
  </section>

  <section id="diagrams">
    <h2 class="sec-h">Diagrams</h2>
    ${diagramsSection}
  </section>

  <section id="documents">
    <h2 class="sec-h">Documents</h2>
    ${documentsSection}
  </section>

  <section id="deck">
    <h2 class="sec-h">Deck</h2>
    ${deckLinks}
  </section>

  <section id="tokens">
    <h2 class="sec-h">Tokens reference</h2>
    <p class="muted">Generated from <code>tokens/lokta.tokens.json</code>. References like <code>{ink.90}</code> resolve through the semantic layer at build time. The values are checked on every push by <code>npm run verify</code>: WCAG AA contrast for every text role on every surface in every stock, cross-surface parity (the Typst and Mermaid literals equal their primitive), and the 8px grid.</p>
    <p class="lk-row"><a class="lk-btn" href="verification.html">View the verification dashboard</a></p>
    ${tokenTables}
  </section>

</main>

<footer class="colophon-foot">
  <div class="lk-measure"><span class="lk-measure-hatch"></span><span class="lk-measure-gap"></span><span class="lk-measure-line" style="width:120px"></span></div>
  <p class="muted">Lokta · v0.1 · MIT. After the page layout of <em class="lk-serif">Cuisine on Screen</em> by Sachiyo Harada (Prestel, 2024), with a heritage thread from Professor Siddika Kabir's <em class="lk-serif">Ranna Khaddo Pushti</em>. An interpretation of their typography, with no text or imagery reproduced from either.</p>
</footer>

<script>
  const root = document.documentElement;
  for (const btn of document.querySelectorAll('[data-set-theme]')) {
    btn.addEventListener('click', () => {
      const t = btn.dataset.setTheme;
      root.setAttribute('data-theme', t);
      for (const b of document.querySelectorAll('[data-set-theme]')) {
        b.setAttribute('aria-pressed', String(b === btn));
      }
    });
  }
</script>
</body>
</html>
`;

function component(title, note, demo) {
  return `<article class="comp">
    <div class="comp-head"><h3 class="comp-h">${title}</h3>${note ? `<p class="muted comp-note">${note}</p>` : ''}</div>
    <div class="comp-demo lk-row">${demo}</div>
  </article>`;
}

await writeFile(join(site, 'index.html'), html);
await writeFile(join(site, 'styles.css'), await siteStyles());
await writeFile(join(site, '.nojekyll'), '');

console.log('Built site/: index.html, styles.css, token CSS, fonts.');

// ── site chrome (uses the tokens, hard-edged) ──────────────────────────────
async function siteStyles() {
  return `/* Lokta docs site chrome. Built on the same tokens. Generated. */
* { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: 84px; }
body { margin: 0; color: var(--text-body); background: var(--surface-page); }
.muted { color: var(--text-secondary); }
.lk-row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
code { font-family: "Spline Sans Mono", ui-monospace, monospace; font-size: 0.9em; color: var(--text-primary); }

.topbar {
  position: sticky; top: 0; z-index: 10;
  display: flex; align-items: center; gap: 24px; flex-wrap: wrap;
  padding: 12px 24px;
  background: var(--surface-raised);
  border-bottom: var(--rule-2) solid var(--text-primary);
}
.brand { display: flex; align-items: baseline; gap: 10px; }
.topnav { display: flex; gap: 16px; margin-left: auto; }
.topnav a { font-family: "Spline Sans Mono", ui-monospace, monospace; font-size: var(--type-xs); text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-secondary); text-decoration: none; }
.topnav a:hover { color: var(--text-primary); }
.switcher { display: flex; flex-wrap: wrap; gap: 1px; }
.theme-btn { margin-left: -1px; }
.theme-btn[aria-pressed="true"] { background: var(--text-primary); color: var(--surface-raised); border-color: var(--text-primary); }

.wrap { max-width: 1040px; margin: 0 auto; padding: 0 24px 96px; }
section { padding: 64px 0; border-bottom: var(--rule-1) solid var(--border-hairline); }
.sec-h { font-size: var(--type-2xl); font-weight: 800; letter-spacing: -0.03em; line-height: 1.05; color: var(--text-primary); margin: 0 0 8px; }
.sub-h { font-size: var(--type-xl); font-weight: 700; letter-spacing: -0.01em; color: var(--text-primary); margin: 48px 0 8px; }
.rule-label { display: block; margin: 28px 0 12px; padding-bottom: 6px; border-bottom: var(--rule-1) solid var(--border-default); }

.cover { padding-top: 40px; }
.cover-title { font-size: var(--type-3xl); font-weight: 800; letter-spacing: -0.045em; line-height: 0.95; color: var(--text-primary); margin: 8px 0 16px; }
.cover-lede { font-size: var(--type-md); max-width: 64ch; color: var(--text-body); }
.cover-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; margin-top: 40px; }
.cover-grid p { margin: 6px 0 0; }

.sw-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.sw { margin: 0; border: var(--rule-1) solid var(--border-default); background: var(--surface-raised); }
.sw-chip { height: 64px; border-bottom: var(--rule-1) solid var(--border-default); }
.sw figcaption { display: flex; flex-direction: column; gap: 2px; padding: 8px 10px; }
.sw-hex { font-family: "Spline Sans Mono", ui-monospace, monospace; font-size: var(--type-xs); color: var(--text-secondary); }
.sw-note { font-size: var(--type-xs); color: var(--text-muted); }

.stock-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.stock-card { padding: 16px; border: var(--rule-1) solid var(--border-default); background: var(--surface-page); color: var(--text-body); }
.stock-h { font-size: var(--type-lg); font-weight: 700; color: var(--text-primary); margin: 10px 0 4px; }
.stock-b { margin: 0 0 6px; }
.stock-s { color: var(--text-secondary); margin: 0 0 12px; }
.stock-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

.type-families { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 20px; }
.type-families p { margin: 8px 0 0; }

.space-scale { display: grid; gap: 8px; }
.space-row { display: grid; grid-template-columns: 90px 1fr 60px; align-items: center; gap: 12px; }
.space-bar { height: 14px; background: var(--accent-feature-fill); display: inline-block; }
.space-val { font-family: "Spline Sans Mono", ui-monospace, monospace; font-size: var(--type-xs); color: var(--text-secondary); text-align: right; }

.grid-demo { display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; margin-top: 8px; }
.grid-demo span { height: 56px; background: var(--surface-inset); border: var(--rule-1) solid var(--border-default); }

.icon-row { display: flex; gap: 16px; color: var(--text-primary); margin-top: 8px; }

.comp { padding: 24px 0; border-top: var(--rule-1) solid var(--border-hairline); }
.comp:first-of-type { border-top: 0; }
.comp-head { margin-bottom: 14px; }
.comp-h { font-size: var(--type-lg); font-weight: 700; color: var(--text-primary); margin: 0; }
.comp-note { margin: 4px 0 0; }
.comp-demo { padding: 20px; background: var(--surface-raised); border: var(--rule-1) solid var(--border-default); align-items: flex-start; }

.tok-set { margin: 32px 0 8px; }
.tok-table { margin-bottom: 8px; }
.tok-val { display: inline-flex; align-items: center; gap: 8px; font-family: "Spline Sans Mono", ui-monospace, monospace; }
.tok-chip { width: 14px; height: 14px; border: var(--rule-1) solid var(--border-default); display: inline-block; }

.colophon-foot { max-width: 1040px; margin: 0 auto; padding: 32px 24px 64px; }
.colophon-foot p { max-width: 72ch; margin-top: 16px; }

.install-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; margin: 18px 0; align-items: start; }
.install-grid pre.lk-code { white-space: pre-wrap; word-break: break-word; overflow-x: auto; }

@media (max-width: 900px) {
  .install-grid { grid-template-columns: 1fr; }
}
@media (max-width: 640px) {
  .topnav { display: none; }
  .grid-demo { grid-template-columns: repeat(6, 1fr); gap: 12px; }
  .cover-grid { grid-template-columns: 1fr 1fr; }
  pre.lk-code { white-space: pre-wrap; word-break: break-word; }
  /* Wide data tables scroll horizontally rather than blow out the page. */
  .lk-table { display: block; max-width: 100%; overflow-x: auto; }
  .main, .wrap, section { min-width: 0; }
}
`;
}
