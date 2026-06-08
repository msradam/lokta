// lokta-hitec, a Lokta rendering of the HITEC technical-document template.
// 1:1 with hitec's public API (ShabbyGayBar/hitec): `documentclass()` returns a
// destructurable dictionary (metadata + `doc` / `title-block` / `title-page`),
// applied via `#show: doc`. Swap the import and an existing hitec document compiles,
// now wearing Lokta's tokens and furniture (Archivo + Spline Sans Mono, ink/indigo/
// marigold, measured rule + hatch, mono labels) in place of hitec's Heros/teal.
//
//   #import "lib.typ": *
//   #let (title, author, company, confidential, date, double-sided, print,
//         doc, title-page, title-block) = documentclass(
//     title: [Ingestion Pipeline], author: "K. Adeyemi",
//     company: [Folio Analytics], confidential: [#sym.bar.h Internal #sym.bar.h],
//   )
//   #show: doc
//   #title-block()
//
// Targets Typst >= 0.12.

// ── LOKTA TOKENS ──────────────────────────────────────────────────────────────
#let lk = (
  ink:      rgb("#1F1C13"),
  body:     rgb("#2A2620"),
  mut:      rgb("#5C564B"),
  faint:    rgb("#8E867A"),
  hair:     rgb("#DAD7CF"),
  paper:    rgb("#FAF8EA"),
  paper2:   rgb("#EAE6D2"),
  indigo:   rgb("#2E3E5C"),   // structural accent (hitec teal -> Lokta indigo)
  marigold: rgb("#FBBC0E"),   // hero highlight (hitec used teal rules; Lokta marks them gold)
  celadon:  rgb("#4F6B50"),
  cinnabar: rgb("#C23A26"),
)
#let lk-sans  = "Archivo"
#let lk-mono  = "Spline Sans Mono"
#let lk-serif = "Source Serif 4"
#let accent = lk.indigo

// ── FURNITURE (Lokta elements) ─────────────────────────────────────────────────
#let lk-label(s, fill: lk.mut) = text(font: lk-mono, size: 8pt, tracking: 1.3pt, fill: fill)[#upper(s)]

// Measured rule: short line + gap + hatched end-mark. Lokta's signature divider.
#let lk-measure(len: 38%) = box(width: 100%, height: 8pt)[
  #place(left + horizon, line(length: len, stroke: 1pt + lk.ink))
  #place(right + horizon, box(width: 56pt, height: 6pt, fill: tiling(size: (4pt, 4pt),
    place(line(start: (0pt, 4pt), end: (4pt, 0pt), stroke: 1pt + lk.body)))))
]

// Band rule: full-measure hairline with a hatched band on the right (used in the title block).
#let lk-band(stroke-w: 0.7pt) = box(width: 100%, height: 9pt)[
  #place(left + horizon, line(length: 100%, stroke: stroke-w + lk.ink))
  #place(right + horizon, box(width: 42%, height: 9pt, fill: tiling(size: (4pt, 4pt),
    place(line(start: (0pt, 4pt), end: (4pt, 0pt), stroke: 1pt + lk.ink)))))
]

#let lk-note(title: "Note", accent: accent, body) = block(
  width: 100%, inset: (x: 13pt, y: 11pt), above: 12pt, below: 12pt,
  fill: lk.paper, stroke: (left: 3pt + accent),
)[
  #lk-label(title, fill: accent) #v(3pt, weak: true)
  #set text(font: lk-sans, size: 9.5pt, fill: lk.body)
  #body
]

// normalise author (string | array) -> array
#let _authors(a) = if type(a) == array { a } else { (a,) }

// ── LAYOUT · doc (applied via #show: doc) ──────────────────────────────────────
#let _doc(
  body,
  title: [], author: "", company: [], confidential: [],
  date: datetime.today(), double-sided: true, print: true,
) = {
  let auth = _authors(author)
  set document(title: title, author: auth.map(a => if type(a) == content { "" } else { a }))

  // Two margin profiles: print + double-sided gives a larger binding (inside) margin.
  let m = if print and double-sided { (inside: 3cm, outside: 2cm, y: 2.4cm) }
          else { (x: 2.2cm, y: 2.4cm) }
  set page(
    paper: "a4",
    margin: m,
    binding: if double-sided { left } else { auto },
    header: context {
      if counter(page).get().first() > 1 {
        grid(columns: (1fr, auto, 1fr),
          align(left, lk-label(company)),
          align(center, lk-label(confidential, fill: accent)),
          align(right, lk-label(title)),
        )
        v(3pt, weak: true)
        line(length: 100%, stroke: 0.6pt + lk.ink)
      }
    },
    footer: context {
      if counter(page).get().first() > 1 {
        line(length: 100%, stroke: 0.5pt + lk.hair)
        v(3pt, weak: true)
        grid(columns: (1fr, 1fr),
          align(left, lk-label(auth.join(", "))),
          align(right, lk-label(counter(page).display("01 / 1", both: true))),
        )
      }
    },
  )

  set text(font: lk-sans, size: 10.5pt, fill: lk.body, lang: "en")
  set par(leading: 0.72em, spacing: 1.05em, justify: true)
  set list(marker: text(fill: lk.faint, [‣]))
  show link: it => text(fill: accent, it)

  // Numbered, sans headings with accent mono numerals (hitec/Lokta hallmark).
  set heading(numbering: "1.1")
  show heading: it => {
    let lvl = it.level
    v(if lvl == 1 { 1.4em } else { 0.9em }, weak: true)
    block(below: 0.55em, grid(
      columns: (auto, 1fr), column-gutter: 0.7em, align: bottom,
      text(font: lk-mono, weight: "medium", fill: accent,
        size: if lvl == 1 { 13pt } else { 11pt },
        if it.numbering != none { counter(heading).display(it.numbering) } else { "" }),
      text(font: lk-sans, weight: if lvl == 1 { 800 } else { 700 },
        size: if lvl == 1 { 16pt } else if lvl == 2 { 13pt } else { 11.5pt },
        fill: lk.ink, it.body),
    ))
    if lvl == 1 { v(2pt, weak: true); line(length: 100%, stroke: 0.5pt + lk.hair); v(3pt, weak: true) }
  }

  show raw.where(block: true): it => block(
    width: 100%, fill: rgb("#F4F4F1"), stroke: 0.5pt + lk.hair, inset: 12pt, radius: 0pt,
    text(font: lk-mono, size: 9pt, fill: lk.ink, it),
  )
  show raw.where(block: false): it => box(
    fill: lk.paper2, inset: (x: 3pt), outset: (y: 2pt),
    text(font: lk-mono, size: 0.88em, fill: lk.ink, it),
  )
  show figure.caption: it => text(font: lk-mono, size: 8.5pt, fill: lk.mut)[
    #lk-label([#it.supplement #context it.counter.display()]) #h(6pt) #it.body
  ]

  body
}

// ── TITLE BLOCK (inline, no page break) ────────────────────────────────────────
#let _title-block(
  title: [], author: "", company: [], confidential: [],
  date: datetime.today(), print: true,
  date-format: "[day] [month repr:long] [year]",
) = {
  let auth = _authors(author)
  // thick opening rule (the HITEC signature)
  block(width: 100%, height: 3pt, fill: lk.ink, below: 0pt)
  v(14pt, weak: true)

  // marigold hero tab + title
  box(width: 44pt, height: 7pt, fill: lk.marigold)
  v(9pt)
  text(font: lk-sans, weight: 800, size: 30pt, fill: lk.ink, hyphenate: false)[#title]
  v(12pt)

  // author / company / date row
  grid(columns: (1fr, 1fr, auto), column-gutter: 16pt,
    [#lk-label("Author") #v(3pt, weak: true) #text(weight: 600, fill: lk.ink, size: 11pt)[#auth.join(", ")]],
    [#lk-label("Company") #v(3pt, weak: true) #text(weight: 600, fill: lk.ink, size: 11pt)[#company]],
    [#lk-label("Date") #v(3pt, weak: true) #text(weight: 600, fill: lk.ink, size: 11pt)[#if type(date) == datetime { date.display(date-format) } else { date }]],
  )
  v(14pt)
  lk-band()
  v(8pt)

  // confidentiality banner, centered
  if confidential != [] {
    align(center, text(font: lk-mono, size: 9pt, tracking: 1.5pt, fill: accent)[#confidential])
    v(10pt)
  }
}

// ── TITLE PAGE (full cover with page break) ────────────────────────────────────
#let _title-page(
  body,
  title: [], author: "", company: [], confidential: [],
  date: datetime.today(), double-sided: true,
) = {
  let auth = _authors(author)
  page(header: none, footer: none)[
    #set par(justify: false)
    #block(width: 100%, height: 3pt, fill: lk.ink)
    #v(2.4cm)
    #box(width: 56pt, height: 8pt, fill: lk.marigold)
    #v(16pt)
    #text(font: lk-sans, weight: 800, size: 44pt, fill: lk.ink, hyphenate: false)[#title]
    #v(1fr)
    #lk-band()
    #v(14pt)
    #grid(columns: (1fr, 1fr), row-gutter: 14pt,
      [#lk-label("Author") #v(3pt, weak: true) #text(weight: 600, size: 13pt, fill: lk.ink)[#auth.join(", ")]],
      [#lk-label("Company") #v(3pt, weak: true) #text(weight: 600, size: 13pt, fill: lk.ink)[#company]],
      [#lk-label("Date") #v(3pt, weak: true) #text(weight: 600, size: 13pt, fill: lk.ink)[#if type(date) == datetime { date.display("[day] [month repr:long] [year]") } else { date }]],
      [#lk-label("Classification") #v(3pt, weak: true) #text(weight: 600, size: 13pt, fill: accent)[#confidential]],
    )
    #v(20pt)
    #if body != none { text(font: lk-mono, size: 8pt, fill: lk.mut)[#body]; v(8pt) }
    #block(width: 100%, height: 3pt, fill: lk.ink)
  ]
}

// ── FACTORY · documentclass (the hitec public API, 1:1) ────────────────────────
#let documentclass(
  title: [],
  author: "",
  company: [],
  confidential: [],
  date: datetime.today(),
  double-sided: true,
  print: true,
) = {
  return (
    // Metadata
    title: title,
    author: author,
    company: company,
    confidential: confidential,
    date: date,
    double-sided: double-sided,
    print: print,
    // Layouts
    doc: (..args) => _doc(..args, title: title, author: author, company: company,
      confidential: confidential, date: date, double-sided: double-sided, print: print),
    // Pages
    title-block: (..args) => _title-block(..args, title: title, author: author,
      company: company, confidential: confidential, date: date, print: print),
    title-page: (..args) => _title-page(..args, title: title, author: author,
      company: company, confidential: confidential, date: date, double-sided: double-sided),
  )
}

// Re-exported Lokta helpers for document authors.
#let hitec-note = lk-note
#let hitec-measure = lk-measure
#let hitec-label = lk-label
