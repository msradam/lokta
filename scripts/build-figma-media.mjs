// Generate 1920x1080 carousel images for the Figma Community listing. Builds
// on-brand Lokta cards from the already-built site CSS, screenshots each at 2x
// via headless Chrome, and downscales to exactly 1920x1080. Run after build:site.
//   node scripts/build-figma-media.mjs
import { writeFile, mkdir, rm, readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const site = join(root, 'site');
const out = join(root, 'docs/figma/media');
await mkdir(out, { recursive: true });

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (
  !(await access(CHROME).then(
    () => true,
    () => false,
  ))
) {
  console.error('Chrome not found; this generator is for local use.');
  process.exit(1);
}
if (
  !(await access(join(site, 'lokta.tokens.css')).then(
    () => true,
    () => false,
  ))
) {
  console.error('Run npm run build:site first.');
  process.exit(1);
}

const head = `<!doctype html><html lang="en" data-theme="paper"><head><meta charset="utf-8">
<link rel="stylesheet" href="fonts.css">
<link rel="stylesheet" href="lokta.tokens.css">
<link rel="stylesheet" href="lokta-base.css">
<link rel="stylesheet" href="lokta-components.css">
<link rel="stylesheet" href="lokta-stocks.css">
<style>
  html,body{margin:0}
  .fig{width:1920px;height:1080px;box-sizing:border-box;padding:96px 120px;position:relative;overflow:hidden;background:var(--surface-page);color:var(--text-body);font-family:"Archivo",sans-serif}
  .fig .rh{display:flex;justify-content:space-between;font-family:"Spline Sans Mono",monospace;font-size:15px;letter-spacing:0.14em;text-transform:uppercase;color:var(--text-secondary);border-bottom:1px solid var(--text-primary);padding-bottom:12px;margin-bottom:48px}
  .fig .folio{position:absolute;right:120px;bottom:64px;font-family:"Spline Sans Mono",monospace;font-size:16px;color:var(--text-secondary)}
  .fig .kick{font-family:"Spline Sans Mono",monospace;font-size:18px;letter-spacing:0.18em;text-transform:uppercase;color:var(--accent-feature)}
  .fig h1{font-size:200px;font-weight:800;letter-spacing:-0.05em;line-height:0.9;color:var(--text-primary);margin:24px 0}
  .fig h2{font-size:64px;font-weight:800;letter-spacing:-0.03em;line-height:1;color:var(--text-primary);margin:0 0 28px}
  .fig .lede{font-family:"Source Serif 4",serif;font-size:34px;line-height:1.4;color:var(--text-body);max-width:30ch}
  .fig .measure{display:flex;align-items:center;height:8px;margin:40px 0;gap:0}
  .fig .measure .ln{height:2px;width:260px;background:var(--text-primary)}
  .fig .measure .gap{flex:1}
  .fig .measure .hatch{flex:1;height:7px;background-image:repeating-linear-gradient(-45deg,var(--text-body) 0,var(--text-body) 1px,transparent 1px,transparent 5px);opacity:0.85}
  .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
  .stk{padding:24px;border:1px solid var(--border-default);background:var(--surface-page)}
  .stk .nm{font-family:"Spline Sans Mono",monospace;font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:var(--text-secondary)}
  .stk .h{font-size:30px;font-weight:700;color:var(--text-primary);margin:12px 0 6px}
  .stk .b{font-size:18px;color:var(--text-body);margin:0 0 4px}
  .stk .s{font-size:16px;color:var(--text-secondary);margin:0 0 16px}
  .row{display:flex;gap:20px;align-items:center;flex-wrap:wrap}
  .swrow{display:flex;gap:14px;flex-wrap:wrap;margin:14px 0}
  .sw{width:150px}
  .sw .chip{height:88px;border:1px solid var(--border-default)}
  .sw code{font-family:"Spline Sans Mono",monospace;font-size:14px;color:var(--text-secondary);display:block;margin-top:6px}
  .center{display:flex;align-items:center;justify-content:center;height:760px}
  .center img{max-width:100%;max-height:100%}
  .pageframe{background:var(--surface-raised);border:1px solid var(--border-default);box-shadow:16px 16px 0 0 var(--border-strong);padding:0;height:720px}
  .pageframe img{height:100%;width:auto;display:block}
</style></head><body>`;

const STOCKS = [
  ['paper', 'Paper', 'light, default'],
  ['ink', 'Ink', 'warm dark'],
  ['bone', 'Bone', 'cool light'],
  ['indigo', 'Indigo', 'cool dark'],
];
const stockCard = ([id, name, sub]) => `
  <div class="stk" data-theme="${id}">
    <div class="nm">${name} · ${sub}</div>
    <p class="h">Headline</p>
    <p class="b">Body text clears AA.</p>
    <p class="s">Secondary</p>
    <div class="row"><button class="lk-btn lk-btn-primary">Action</button><span class="lk-tag lk-tag-pigment">Tag</span><span class="lk-status lk-status-done">Done</span></div>
  </div>`;

const tok = JSON.parse(await readFile(join(root, 'tokens/lokta.tokens.json'), 'utf8'));
const pig = tok.primitives.pigment;
const pigSw = Object.entries(pig)
  .filter(([k]) => !k.endsWith('-ink'))
  .map(
    ([k, v]) =>
      `<figure class="sw"><div class="chip" style="background:${v.$value}"></div><code>${k}</code><code>${v.$value}</code></figure>`,
  )
  .join('');

const cards = {
  '1-cover': `<div class="fig lk-sheet">
    <div class="rh"><span>映画の料理 · LOKTA</span><span>WCAG 2.2 AA</span></div>
    <p class="kick">An editorial UI kit</p>
    <h1>Lokta</h1>
    <p class="lede">One cookbook's page system, ported to the screen. Cream stock, hatched rules, pigment grounds, held to AA on every role.</p>
    <div class="measure"><span class="ln"></span><span class="gap"></span><span class="hatch"></span></div>
    <div class="folio">001</div>
  </div>`,

  '2-stocks': `<div class="fig lk-sheet">
    <div class="rh"><span>映画の料理 · LOKTA</span><span>Stocks</span></div>
    <h2>Four stocks, AA on every role</h2>
    <div class="grid4">${STOCKS.map(stockCard).join('')}</div>
    <p class="lede" style="margin-top:40px;max-width:60ch;font-size:26px">Each stock is a Figma variable mode. One component re-themes by switching mode. Slate, Steel, and Onyx ship too.</p>
    <div class="folio">002</div>
  </div>`,

  '3-components': `<div class="fig lk-sheet">
    <div class="rh"><span>映画の料理 · LOKTA</span><span>Components</span></div>
    <h2>Components, on the semantic layer</h2>
    <div class="row" style="gap:16px;margin-bottom:28px">
      <button class="lk-btn">Default</button><button class="lk-btn lk-btn-primary">Primary</button><button class="lk-btn lk-btn-lg">Large</button>
      <span class="lk-tag">Outline</span><span class="lk-tag lk-tag-filled">Filled</span><span class="lk-tag lk-tag-pigment">Pigment</span>
      <span class="lk-status lk-status-done">Done</span><span class="lk-status lk-status-alert">Alert</span>
    </div>
    <div class="row" style="align-items:flex-start;gap:32px">
      <div style="width:360px"><label class="lk-label">Field</label><input class="lk-input" value="Placeholder" style="margin-top:6px"></div>
      <div class="lk-note lk-note-success" style="width:420px"><div><span class="lk-note-title">Saved</span><div>The page was written to the press.</div></div></div>
      <div class="lk-tabs" style="align-self:center"><button class="lk-tab" aria-selected="true">Overview</button><button class="lk-tab">Detail</button></div>
    </div>
    <div class="folio">003</div>
  </div>`,

  '4-colour': `<div class="fig lk-sheet">
    <div class="rh"><span>映画の料理 · LOKTA</span><span>Colour</span></div>
    <h2>Pigment is a ground, not a tint</h2>
    <div class="swrow">${pigSw}</div>
    <p class="lede" style="max-width:60ch;font-size:26px">Warm paper surfaces, warm-tinted ink text, saturated pigment grounds. Marigold is the hero. Every value is AA-tuned and checked on every commit.</p>
    <div class="folio">004</div>
  </div>`,

  '5-diagram': `<div class="fig lk-sheet">
    <div class="rh"><span>映画の料理 · LOKTA</span><span>Diagrams</span></div>
    <h2>Diagrams have a house style</h2>
    <div class="center"><img src="diagram-demo.svg" alt="flowchart"></div>
    <div class="folio">005</div>
  </div>`,

  '6-document': `<div class="fig lk-sheet" style="background:var(--surface-sunken)">
    <div class="rh"><span>映画の料理 · LOKTA</span><span>Documents</span></div>
    <h2>The same system, in print</h2>
    <div class="center"><div class="pageframe"><img src="example-recipe.png" alt="Typst recipe"></div></div>
    <div class="folio">006</div>
  </div>`,

  '7-verify': `<div class="fig" data-theme="ink">
    <div class="rh"><span>映画の料理 · LOKTA</span><span>Verification</span></div>
    <p class="kick">Deterministic by default</p>
    <h2 style="font-size:88px;margin-top:24px">202 checks, every commit</h2>
    <p class="lede" style="max-width:46ch;font-size:32px">WCAG AA contrast for every text role on every surface in every stock. Cross-surface parity. The 8px grid. The build fails if a value drifts.</p>
    <div class="folio">007</div>
  </div>`,
};

// Recipe PNG for card 6, if available.
const recipePng = join(site, 'example-recipe.png');
if (
  !(await access(recipePng).then(
    () => true,
    () => false,
  ))
) {
  const src = join(root, 'packages/typst/dist/example-recipe.pdf');
  if (
    await access(src).then(
      () => true,
      () => false,
    )
  ) {
    spawnSync(
      'typst',
      [
        'compile',
        '--font-path',
        'fonts',
        '--ignore-system-fonts',
        'example-recipe.typ',
        join(site, 'example-recipe.png'),
        '--ppi',
        '150',
      ],
      {
        cwd: join(root, 'packages/typst'),
      },
    );
  }
}

for (const [name, html] of Object.entries(cards)) {
  const tmp = join(site, `_fig-${name}.html`);
  await writeFile(tmp, head + html + '</body></html>');
  const big = join(out, `${name}@2x.png`);
  spawnSync(
    CHROME,
    [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=2',
      '--window-size=1920,1080',
      `--screenshot=${big}`,
      '--virtual-time-budget=4000',
      `file://${tmp}`,
    ],
    { stdio: 'ignore' },
  );
  spawnSync('sips', ['-z', '1080', '1920', big, '--out', join(out, `${name}.png`)], { stdio: 'ignore' });
  spawnSync('rm', ['-f', tmp, big]);
  console.log('rendered', `${name}.png`);
}
console.log('Figma media in docs/figma/media (1920x1080).');
