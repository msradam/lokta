# Trace example source

`still-life.jpg` is Paul Gauguin, *Still Life with Teapot and Fruit* (1896),
The Metropolitan Museum of Art, New York. Open Access, **CC0 1.0** (public
domain dedication). No rights reserved.

`still-life.svg` is a deterministic line-art tracing produced by
`scripts/build-trace.mjs`. Regenerate with:

```
TRACE_W=300 TRACE_PATHOMIT=48 TRACE_BLUR=5 \
  node scripts/build-trace.mjs docs/trace/still-life.jpg docs/trace/still-life.svg 4 "<alt text>"
```
