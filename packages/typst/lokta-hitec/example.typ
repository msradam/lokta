// example.typ, using the Lokta HITEC template (matches hitec's API 1:1).
// Compile: typst compile example.typ
#import "lib.typ": *

#let (
  // Metadata
  title, author, company, confidential, date, double-sided, print,
  // Layouts
  doc, title-page, title-block,
) = documentclass(
  title: [Ingestion Pipeline],
  author: ("K. Adeyemi", "M. Reyes"),
  company: [Folio Analytics, Ltd],
  confidential: [#sym.bar.h Internal Distribution #sym.bar.h],
  date: datetime(year: 2026, month: 4, day: 1),
  double-sided: true,
  print: true,
)

#show: doc

#title-block() // inline title block (no page break)
// Or a full cover page:
// #title-page()[Optional cover footnote]

= Overview

This document describes the design and operation of the ingestion pipeline that backs
Folio Analytics. It covers the intake path, the processing stages, and the operational
guarantees the service is expected to meet under load.

== Scope

The scope is limited to the server-side pipeline from the public intake endpoint to the
durable event store. Client SDKs are described elsewhere.

#hitec-note(title: "Note")[
  Throughput figures assume the default batch size of 500 events. Tuning guidance is
  given in @config below.
]

= Architecture

The pipeline is a sequence of four stages. Each stage is independently scalable and
communicates through a durable queue.

#figure(
  table(
    columns: (1fr, 2fr, auto),
    table.hline(stroke: 1.2pt + rgb("#2E3E5C")),
    table.header([Stage], [Responsibility], [p99]),
    table.hline(stroke: 0.5pt + rgb("#DAD7CF")),
    [Gateway], [Auth, rate-limit, enqueue], [20 ms],
    [Validate], [Schema + dedupe], [40 ms],
    [Enrich], [Geo, session stitch], [60 ms],
    [Commit], [Durable write + ack], [30 ms],
    table.hline(stroke: 0.5pt + rgb("#DAD7CF")),
  ),
  caption: [Pipeline stages and latency budgets.],
)

#hitec-measure()

== Configuration <config>

```yaml
ingest:
  batch_size: 500        # events per flush
  flush_interval: 200ms  # max wait before commit
```

The intake batch size and flush interval are set per environment.

= Summary

The pipeline holds its latency budget under load by applying backpressure rather than
dropping events. See the revision history for the change log.
