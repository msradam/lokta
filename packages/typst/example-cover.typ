// Cover variant. Compile: typst compile --font-path fonts example-cover.typ
#import "lokta.typ": *

#show: lokta-cover.with(
  title: "Lokta",
  subtitle: "One cookbook's page system, in print.",
  label: "Specimen · Cover",
  ground: lk-lavender,
  spine: "光の写本",
)

#text(font: "Spline Sans Mono", size: 9pt, fill: lk-primary, tracking: 1pt)[LOKTA · v0.1 · MMXXVI]
