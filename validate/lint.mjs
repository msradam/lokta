// validate/lint.mjs. Lokta static design-rule lint. Pure Node, no deps, no browser.
// Parses the CSS sources as text and asserts the locked rules mechanically.
// Run: node validate/lint.mjs   (exits non-zero on any violation)
//
// Rules enforced:
//  1. No stray / raw hex in the component layer (must go through tokens).
//  2. No border-radius except var(--lk-radius) / 0 / 50% on components.
//  3. No box-shadow with blur anywhere (only the modal's hard offset is allowed).
//  4. Every interactive component class has a :focus-visible rule.
//
// Scoped to this repo: the component layer is packages/css/lokta-components.css.
// Stock and reference files legitimately carry raw hex (they define surfaces),
// so they are not treated as the component layer. Built output (dist, site) and
// handoff scratch are skipped.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, basename } from "node:path";

const ROOT = process.argv[2] || ".";
const PRIMITIVES = new Set([
  "#faf8ea", "#f4f1df", "#eae6d2", "#dbd3bb", "#c2b89c",
  "#16140e", "#1f1c13", "#2a2620", "#5c564b", "#615a4c", "#8e867a", "#b8b0a1",
  "#fbbc0e", "#e7a079", "#a99cb3", "#6b4e8e", "#c23a26", "#6e8b6f", "#2e3e5c", "#070d0e", "#4f6b50",
]);
// Interactive classes that must show a visible focus ring (present in the component CSS).
const FOCUS_REQUIRED = ["lk-btn", "lk-input", "lk-select", "lk-tab", "lk-page", "lk-check", "lk-radio", "lk-slider"];
const HEX = /#[0-9a-fA-F]{6}\b/g;
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "site"]);

let errors = 0, checks = 0;
const fail = (msg) => { errors++; console.log("  x " + msg); };

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || name.startsWith("Lokta_") || name === "assets") continue;
    const p = join(dir, name);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if ([".css"].includes(extname(p))) out.push(p);
  }
  return out;
}

// The token-pure component layer (raw hex and stray radius are violations here).
const isComponentCSS = (p) => basename(p) === "lokta-components.css";

const files = walk(ROOT);

// 1. Stray / raw hex in the component layer
for (const f of files.filter(isComponentCSS)) {
  const css = readFileSync(f, "utf8");
  let m;
  while ((m = HEX.exec(css))) {
    checks++;
    const hex = m[0].toLowerCase();
    if (!PRIMITIVES.has(hex)) fail(`${f}: stray hex ${m[0]} (use a token, not a raw value)`);
  }
}

// 2. border-radius discipline (component layer)
for (const f of files.filter(isComponentCSS)) {
  const css = readFileSync(f, "utf8");
  for (const r of css.match(/border-radius:\s*([^;]+);/g) || []) {
    checks++;
    if (!/var\(--lk-radius\)|:\s*0(px)?\s*;|50%/.test(r)) fail(`${f}: border-radius not via --lk-radius -> ${r.trim()}`);
  }
}

// 3. box-shadow discipline (no blur anywhere; only a hard offset is allowed)
for (const f of files) {
  const css = readFileSync(f, "utf8");
  for (const s of css.match(/box-shadow:\s*([^;]+);/g) || []) {
    checks++;
    const val = s.replace(/box-shadow:\s*/, "");
    const nums = val.match(/-?\d+px/g) || [];
    const blur = nums[2];
    if (blur && blur !== "0px") fail(`${f}: box-shadow has blur (${blur}); only a hard offset is allowed -> ${val.trim()}`);
  }
}

// 4. focus-visible present for interactive classes
const allCSS = files.map((p) => readFileSync(p, "utf8")).join("\n");
for (const cls of FOCUS_REQUIRED) {
  checks++;
  if (!new RegExp(`\\.${cls}[^{]*:focus-visible`).test(allCSS)) fail(`no :focus-visible rule found for .${cls}`);
}

console.log(`\nLINT · ${checks - errors}/${checks} checks passing.`);
if (errors) { console.error(`FAILED: ${errors} design-rule violation(s).`); process.exit(1); }
console.log("All design-rule checks passing.");
