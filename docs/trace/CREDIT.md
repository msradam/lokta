# Trace example source

`trace-sample.jpg` is Utagawa Hiroshige, *Blue Bird and Hibiscus* (Japan, Edo
period), color woodblock print. The Metropolitan Museum of Art, New York. Open
Access, **CC0 1.0** (public domain dedication). No rights reserved.
Object 56698: <https://www.metmuseum.org/art/collection/search/56698>

`trace-sample.svg` is a deterministic line-art tracing produced by
`scripts/build-trace.mjs`. A line-and-flat-region source (a woodblock print)
traces into far cleaner contours than a painterly one. Regenerate with:

```
TRACE_W=300 TRACE_CROP="0,0.42,1,0.58" TRACE_PATHOMIT=40 TRACE_BLUR=3 \
  TRACE_LTRES=2.5 TRACE_QTRES=3 \
  node scripts/build-trace.mjs docs/trace/trace-sample.jpg docs/trace/trace-sample.svg 4 "<alt text>"
```
