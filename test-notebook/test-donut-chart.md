---
publish: true
title: "SVG Debug: Donut Chart"
date: 2026-02-27T00:00:00
tags:
  - debug
  - svg
  - donut
---

# Donut Charts

Testing donut chart rendering with various datasets.

## Regional Market Share

```donut
[
  {"label": "Southern California", "value": 42},
  {"label": "Northern California", "value": 28},
  {"label": "Central Valley", "value": 18},
  {"label": "Inland Empire", "value": 12}
]
```

Four-segment donut chart. Each segment gets a distinct monochrome pattern for print-friendly differentiation.

## Binary Split

Edge case with only two segments.

```donut
[
  {"label": "Urban", "value": 65},
  {"label": "Rural", "value": 35}
]
```

## Five Segments

Testing pattern cycling with five data elements (wraps back to pattern 0 on the 5th).

```donut
---
width: 500
height: 500
---
[
  {"label": "Tech", "value": 31},
  {"label": "Healthcare", "value": 22},
  {"label": "Finance", "value": 19},
  {"label": "Manufacturing", "value": 16},
  {"label": "Retail", "value": 12}
]
```

Employment distribution by sector. The fifth segment reuses the first pattern (diagonal stripes).

## Single Segment

Edge case: a donut with just one category should render as a full circle.

```donut
[
  {"label": "Complete", "value": 100}
]
```
