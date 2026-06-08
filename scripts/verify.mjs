// verify.mjs, Lokta CI gate. Pure Node, no deps. Run: node scripts/verify.mjs
// Asserts: (1) WCAG AA contrast for every text role on every surface, every stock;
// (2) cross-surface parity (Typst + Mermaid literals == the primitive they mirror);
// (3) the 8px spacing grid. Exits non-zero on any failure. Mirrors Lokta Verification.html.

// ── Source of truth ──────────────────────────────────────────────────────────
const PRIM = {
  'paper-00': '#FAF8EA',
  'paper-01': '#F4F1DF',
  'paper-02': '#EAE6D2',
  'paper-03': '#DBD3BB',
  'paper-04': '#C2B89C',
  'ink-100': '#16140E',
  'ink-90': '#1F1C13',
  'ink-80': '#2A2620',
  'ink-60': '#5C564B',
  'ink-50': '#615A4C',
  'ink-40': '#8E867A',
  'ink-20': '#B8B0A1',
  marigold: '#FBBC0E',
  peach: '#E7A079',
  lavender: '#A99CB3',
  aubergine: '#6B4E8E',
  night: '#070D0E',
  cinnabar: '#C23A26',
  celadon: '#6E8B6F',
  indigo: '#2E3E5C',
  'celadon-ink': '#4F6B50',
};
const STOCKS = {
  paper: {
    surfaces: { page: '#F4F1DF', raised: '#FAF8EA', sunken: '#EAE6D2', inset: '#DBD3BB' },
    text: { primary: '#1F1C13', body: '#2A2620', secondary: '#5C564B', muted: '#615A4C' },
  },
  ink: {
    surfaces: { page: '#1F1C13', raised: '#2A2620', sunken: '#16140E', inset: '#26221A' },
    text: { primary: '#FAF8EA', body: '#F4F1DF', secondary: '#C2B89C', muted: '#B8B0A1' },
  },
  bone: {
    surfaces: { page: '#EFEEE7', raised: '#F7F6F1', sunken: '#E4E3DB', inset: '#D8D7CE' },
    text: { primary: '#1F1C13', body: '#2A2620', secondary: '#5C564B', muted: '#615A4C' },
  },
  indigo: {
    surfaces: { page: '#1B2230', raised: '#232C3D', sunken: '#141A25', inset: '#2B3547' },
    text: { primary: '#EDECE3', body: '#E2E1D6', secondary: '#AEB4C2', muted: '#9BA3B4' },
  },
};

Object.assign(STOCKS, {
  slate: {
    surfaces: { page: '#21252C', raised: '#2A2F38', sunken: '#181C22', inset: '#2B313A' },
    text: { primary: '#ECEEF1', body: '#DDE0E4', secondary: '#B4B9C2', muted: '#9DA4AF' },
  },
  steel: {
    surfaces: { page: '#16282B', raised: '#1F3438', sunken: '#0F1D20', inset: '#21383C' },
    text: { primary: '#E9EEED', body: '#D8E2E1', secondary: '#ABC0C0', muted: '#95ABAB' },
  },
  onyx: {
    surfaces: { page: '#1E1F22', raised: '#27282C', sunken: '#161719', inset: '#2A2B30' },
    text: { primary: '#ECECEE', body: '#DEDEE0', secondary: '#B2B2B7', muted: '#9C9CA2' },
  },
  'slate-light': {
    surfaces: { page: '#EDEEF1', raised: '#F6F7F9', sunken: '#E2E4E9', inset: '#D8DAE0' },
    text: { primary: '#1A1D23', body: '#272A30', secondary: '#515761', muted: '#555A63' },
  },
  'steel-light': {
    surfaces: { page: '#E7EEED', raised: '#F2F7F6', sunken: '#DBE6E4', inset: '#D0DEDC' },
    text: { primary: '#14201F', body: '#232E2D', secondary: '#4B5958', muted: '#4F5B5A' },
  },
  'onyx-light': {
    surfaces: { page: '#ECECEE', raised: '#F6F6F7', sunken: '#E1E1E4', inset: '#D6D6DA' },
    text: { primary: '#1A1A1D', body: '#28282B', secondary: '#515156', muted: '#5D5D63' },
  },
  manuscript: {
    surfaces: { page: '#EDE4D1', raised: '#F5EEDD', sunken: '#E2D8C0', inset: '#D5CAAF' },
    text: { primary: '#1F1C13', body: '#2A2620', secondary: '#524D43', muted: '#564F42' },
  },
  highland: {
    surfaces: { page: '#232A2E', raised: '#2C3438', sunken: '#181D20', inset: '#323B40' },
    text: { primary: '#ECEAE0', body: '#DEDBCE', secondary: '#ADB2AE', muted: '#A2A7A3' },
  },
});
const SPACE = [4, 8, 12, 16, 24, 32, 48, 64, 96];
const TYPST = [
  ['ink', '#16140E', 'ink-100'],
  ['primary', '#1F1C13', 'ink-90'],
  ['body', '#2A2620', 'ink-80'],
  ['mut', '#5C564B', 'ink-60'],
  ['muted', '#615A4C', 'ink-50'],
  ['faint', '#8E867A', 'ink-40'],
  ['hairline', '#B8B0A1', 'ink-20'],
  ['paper0', '#FAF8EA', 'paper-00'],
  ['paper', '#F4F1DF', 'paper-01'],
  ['paper2', '#EAE6D2', 'paper-02'],
  ['paper3', '#DBD3BB', 'paper-03'],
  ['paper4', '#C2B89C', 'paper-04'],
  ['marigold', '#FBBC0E', 'marigold'],
  ['peach', '#E7A079', 'peach'],
  ['lavender', '#A99CB3', 'lavender'],
  ['aubergine', '#6B4E8E', 'aubergine'],
  ['indigo', '#2E3E5C', 'indigo'],
  ['celadon', '#6E8B6F', 'celadon'],
  ['celadon-ink', '#4F6B50', 'celadon-ink'],
  ['cinnabar', '#C23A26', 'cinnabar'],
  ['night', '#070D0E', 'night'],
];
const MERMAID = [
  ['background', '#F4F1DF', 'paper-01'],
  ['primaryColor', '#FAF8EA', 'paper-00'],
  ['primaryTextColor', '#1F1C13', 'ink-90'],
  ['primaryBorderColor', '#2A2620', 'ink-80'],
  ['lineColor', '#2A2620', 'ink-80'],
  ['secondaryColor', '#EAE6D2', 'paper-02'],
  ['noteBkgColor', '#FBBC0E', 'marigold'],
  ['classDef hero', '#FBBC0E', 'marigold'],
  ['classDef store', '#6E8B6F', 'celadon'],
  ['classDef dec', '#2E3E5C', 'indigo'],
  ['classDef danger', '#C23A26', 'cinnabar'],
  ['classDef muted', '#EAE6D2', 'paper-02'],
];

// ── WCAG math ────────────────────────────────────────────────────────────────
const rgb = (h) => {
  h = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16));
};
const lin = (c) => {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const lum = (h) => {
  const [r, g, b] = rgb(h);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const ratio = (a, b) => {
  const x = lum(a),
    y = lum(b),
    hi = Math.max(x, y),
    lo = Math.min(x, y);
  return (hi + 0.05) / (lo + 0.05);
};

let fails = 0,
  total = 0;
const ok = (cond, msg) => {
  total++;
  if (!cond) {
    fails++;
    console.log('  ✗ ' + msg);
  }
};

console.log('CONTRAST · AA small-text (4.5:1), every role × surface × stock');
for (const [sn, st] of Object.entries(STOCKS))
  for (const [role, fg] of Object.entries(st.text))
    for (const [su, bg] of Object.entries(st.surfaces)) {
      const r = ratio(fg, bg);
      ok(r >= 4.5, `${sn} · ${role} on ${su}: ${r.toFixed(2)} < 4.5`);
    }

console.log('PARITY · Typst + Mermaid literals == primitive');
for (const [label, actual, expName] of [...TYPST, ...MERMAID])
  ok(
    actual.toUpperCase() === PRIM[expName].toUpperCase(),
    `${label} ${actual} != ${expName} ${PRIM[expName]}`,
  );

console.log('GRID · spacing divisible by 4');
for (const v of SPACE) ok(v % 4 === 0, `space ${v} not divisible by 4`);

// APCA advisory (WCAG 3 draft). Reported beside the WCAG numbers, never gates:
// the algorithm is undecided (APCA was pulled from the WCAG 3 working draft).
const apcaY = (h) => { const c = (n) => Math.pow(parseInt(n, 16) / 255, 2.4); return 0.2126729 * c(h.slice(1, 3)) + 0.7151522 * c(h.slice(3, 5)) + 0.072175 * c(h.slice(5, 7)); };
const apca = (txt, bg) => {
  const clamp = (y) => (y < 0.022 ? y + Math.pow(0.022 - y, 1.414) : y);
  const Yt = clamp(apcaY(txt)), Yb = clamp(apcaY(bg));
  if (Math.abs(Yt - Yb) < 0.0005) return 0;
  let o;
  if (Yb > Yt) { o = (Math.pow(Yb, 0.56) - Math.pow(Yt, 0.57)) * 1.14; o = o < 0.1 ? 0 : (o - 0.027) * 100; }
  else { o = (Math.pow(Yb, 0.65) - Math.pow(Yt, 0.62)) * 1.14; o = o > -0.1 ? 0 : (o + 0.027) * 100; }
  return Math.round(o);
};
console.log('APCA · advisory Lc, body text on the page surface (not gated)');
for (const [sn, st] of Object.entries(STOCKS))
  console.log(`    ${sn}: Lc ${apca(st.text.body, st.surfaces.page)} (primary ${apca(st.text.primary, st.surfaces.page)})`);

console.log(`\n${total - fails}/${total} checks passing.`);
if (fails) {
  console.error(`FAILED: ${fails} check(s).`);
  process.exit(1);
}
console.log('All checks passing.');
