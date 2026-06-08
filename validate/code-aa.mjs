// validate/code-aa.mjs. Deterministic gate for the syntax theme. Pure Node.
// Every code token role clears WCAG AA (4.5:1) on its code background (light and
// dark), and every category carries a non-colour cue (weight or italic) so meaning
// survives in greyscale (WCAG 1.4.1). Run: node validate/code-aa.mjs

const BG = { light: '#FAF8EA', dark: '#16140E' };
// role: [light, dark, cue]
const ROLES = {
  comment: ['#615A4C', '#9A9384', 'italic'],
  keyword: ['#8E2C49', '#D67A95', 'bold'],
  string: ['#4F6B50', '#8FB088', 'none'],
  number: ['#8A5A12', '#D9A642', 'none'],
  function: ['#1F5C92', '#6FA8D8', 'bold'],
  type: ['#5F4080', '#A98FC9', 'none'],
  variable: ['#2A2620', '#E2E1D6', 'none'],
  operator: ['#B23320', '#E2654F', 'none'],
  punctuation: ['#5C564B', '#ADB2AE', 'none'],
  keyword2: ['#2F6F6D', '#5FB0AD', 'italic'],
};
// Categories whose meaning must survive in greyscale need a weight/italic cue.
const CUE_REQUIRED = ['comment', 'keyword', 'function', 'keyword2'];

const hx = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); };
const ln = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = (h) => { const [r, g, b] = hx(h); return 0.2126 * ln(r) + 0.7152 * ln(g) + 0.0722 * ln(b); };
const cr = (a, b) => { const x = lum(a), y = lum(b), hi = Math.max(x, y), lo = Math.min(x, y); return (hi + 0.05) / (lo + 0.05); };

let fails = 0, checks = 0;
const ok = (cond, msg) => { checks++; if (!cond) { fails++; console.log('  x ' + msg); } };

console.log('CODE · per-token AA (4.5:1) on the code background');
for (const [role, [light, dark, cue]] of Object.entries(ROLES)) {
  ok(cr(light, BG.light) >= 4.5, `${role} light ${light} on ${BG.light}: ${cr(light, BG.light).toFixed(2)} < 4.5`);
  ok(cr(dark, BG.dark) >= 4.5, `${role} dark ${dark} on ${BG.dark}: ${cr(dark, BG.dark).toFixed(2)} < 4.5`);
  if (CUE_REQUIRED.includes(role)) ok(cue === 'bold' || cue === 'italic', `${role} needs a weight/italic cue, got "${cue}"`);
}

// Diff lines: the text sits on the wash composite (add-bg/del-bg over code-bg),
// which is darker than bare bg, so check there. [textColour, washColour, alpha]
const over = (fg, a, bg) => { const F = hx(fg), B = hx(bg); return '#' + [0, 1, 2].map((i) => Math.round(a * F[i] + (1 - a) * B[i]).toString(16).padStart(2, '0')).join(''); };
const DIFF = {
  light: { bg: '#FAF8EA', add: ['#43603C', '#4F6B50', 0.16], del: ['#B23320', '#B23320', 0.13] },
  dark: { bg: '#16140E', add: ['#8FB088', '#8FB088', 0.16], del: ['#E2654F', '#E2654F', 0.15] },
};
console.log('CODE · diff text AA on the wash composite');
for (const [mode, d] of Object.entries(DIFF))
  for (const role of ['add', 'del']) {
    const [text, wash, a] = d[role];
    const comp = over(wash, a, d.bg);
    ok(cr(text, comp) >= 4.5, `${mode} diff-${role} ${text} on ${comp}: ${cr(text, comp).toFixed(2)} < 4.5`);
  }

console.log(`\nCODE · ${checks - fails}/${checks} checks passing.`);
if (fails) { console.error(`FAILED: ${fails} code-theme violation(s).`); process.exit(1); }
console.log('All code-theme checks passing.');
