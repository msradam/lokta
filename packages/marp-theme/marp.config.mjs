// Marp config to enable Lokta-themed Mermaid in decks. Transforms ```mermaid
// fences into <div class="mermaid"> blocks; the theme's .mermaid rules style
// them. For live rendering in an HTML deck, include mermaid and initialize it
// with @lokta/mermaid (see this package's README). The example deck embeds a
// pre-rendered SVG instead, so it also renders correctly to PDF.
export default {
  html: true,
  allowLocalFiles: true,
  engine: ({ marp }) =>
    marp.use((md) => {
      const fence = md.renderer.rules.fence?.bind(md.renderer.rules);
      md.renderer.rules.fence = (tokens, idx, opts, env, self) => {
        const t = tokens[idx];
        if ((t.info || '').trim() === 'mermaid') return `<div class="mermaid">${t.content}</div>`;
        return fence(tokens, idx, opts, env, self);
      };
    }),
};
