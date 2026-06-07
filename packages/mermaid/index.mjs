// @lokta/mermaid web entry. Initializes Mermaid with the Lokta theme and injects
// the hard-edge CSS that themeVariables cannot reach. Mermaid is a peer
// dependency: you pass your own instance in.
//
//   import mermaid from "mermaid";
//   import { initLoktaMermaid } from "@lokta/mermaid";
//   initLoktaMermaid(mermaid);   // then mermaid.run() or startOnLoad handles it
//
// The JSON is imported with an import attribute (Node 20+ and current browsers).
import config from "./lokta-mermaid.json" with { type: "json" };

const { _comment, _classDefs, ...base } = config;

// The mermaid.initialize() config (themeVariables, flowchart, sequence).
export const loktaMermaidConfig = base;

// Reusable node classes for `classDef` in a flowchart (hero / store / dec / danger / muted).
export const loktaClassDefs = _classDefs
  ? Object.fromEntries(Object.entries(_classDefs).filter(([k]) => !k.startsWith("_")))
  : {};

// Same rules as packages/mermaid/lokta-mermaid.css and the .mermaid block in lokta.marp.css.
export const loktaMermaidCSS = `
.mermaid .node rect, .mermaid .node polygon, .mermaid .cluster rect,
.mermaid rect.actor, .mermaid .labelBox, .mermaid .note { rx: 0 !important; ry: 0 !important; }
.mermaid .nodeLabel, .mermaid .actor, .mermaid .stateLabel { font-family: "Archivo", sans-serif !important; font-weight: 600; }
.mermaid .edgeLabel, .mermaid .edgeLabel *, .mermaid .messageText, .mermaid .noteText {
  font-family: "Spline Sans Mono", monospace !important; font-size: 11px !important; }
.mermaid .edgeLabel { background: var(--paper-01, #F4F1DF) !important; }
.mermaid .flowchart-link, .mermaid .messageLine0, .mermaid .messageLine1, .mermaid .transition { stroke-width: 1.5px !important; }
.mermaid .marker, .mermaid marker path { fill: var(--ink-80, #2A2620) !important; stroke: var(--ink-80, #2A2620) !important; }
`;

export function injectLoktaMermaidCSS() {
  if (typeof document === "undefined") return;
  if (document.head.querySelector("style[data-lokta-mermaid]")) return;
  const style = document.createElement("style");
  style.setAttribute("data-lokta-mermaid", "");
  style.textContent = loktaMermaidCSS;
  document.head.appendChild(style);
}

export function initLoktaMermaid(mermaid, overrides = {}) {
  mermaid.initialize({ ...loktaMermaidConfig, ...overrides });
  injectLoktaMermaidCSS();
  return mermaid;
}

export default initLoktaMermaid;
