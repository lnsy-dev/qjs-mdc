---
publish: true
title: "SVG Debug: Bar Charts"
date: 2026-02-27
tags:
  - debug
  - svg
  - bar
---

# Bar Charts

Testing bar chart rendering with vertical and horizontal orientations.

## Vertical Bar Chart (Default)

Standard vertical bar chart with labeled categories and values.

```bar
[
  {"label": "Los Angeles", "value": 3900000},
  {"label": "San Diego", "value": 1420000},
  {"label": "San Jose", "value": 1010000},
  {"label": "San Francisco", "value": 870000},
  {"label": "Fresno", "value": 540000},
  {"label": "Sacramento", "value": 520000}
]
```

Population figures for major California cities. The bar chart uses monochrome patterns (diagonal, dots, horizontal, vertical stripes) cycling through each data element.

## Horizontal Bar Chart

Same data rendered with horizontal orientation via the `chart` alias and YAML front matter config.

```chart
---
orientation: horizontal
width: 700
height: 350
---
[
  {"label": "Los Angeles", "value": 3900000},
  {"label": "San Diego", "value": 1420000},
  {"label": "San Jose", "value": 1010000},
  {"label": "San Francisco", "value": 870000},
  {"label": "Fresno", "value": 540000},
  {"label": "Sacramento", "value": 520000}
]
```

The horizontal orientation can be more readable when category labels are long.

## Small Dataset

Minimal two-item bar chart for edge-case testing.

```bar
[
  {"label": "Yes", "value": 73},
  {"label": "No", "value": 27}
]
```

## Large Dataset

Testing with many categories to verify label rendering and spacing.

```bar
---
width: 800
height: 400
---
[
  {"label": "Jan", "value": 42},
  {"label": "Feb", "value": 38},
  {"label": "Mar", "value": 55},
  {"label": "Apr", "value": 61},
  {"label": "May", "value": 74},
  {"label": "Jun", "value": 89},
  {"label": "Jul", "value": 95},
  {"label": "Aug", "value": 91},
  {"label": "Sep", "value": 78},
  {"label": "Oct", "value": 62},
  {"label": "Nov", "value": 48},
  {"label": "Dec", "value": 40}
]
```

Monthly average temperatures (°F) for Los Angeles demonstrating pattern cycling across 12 bars.
