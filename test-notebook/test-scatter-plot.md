---
publish: true
title: "SVG Debug: Scatter Plots"
date: 2026-02-27
tags:
  - debug
  - svg
  - scatter
---

# Scatter Plots

Testing scatter plot rendering with categories, variable radius, and edge cases.

## Categorized Scatter with Variable Radius

Housing price vs square footage across SoCal neighborhoods, with bubble size representing lot size.

```scatter
[
  {"x": 1200, "y": 450, "r": 6, "c": "LA"},
  {"x": 1800, "y": 720, "r": 8, "c": "LA"},
  {"x": 2400, "y": 950, "r": 10, "c": "LA"},
  {"x": 3200, "y": 1400, "r": 14, "c": "LA"},
  {"x": 1000, "y": 380, "r": 7, "c": "San Diego"},
  {"x": 1600, "y": 580, "r": 9, "c": "San Diego"},
  {"x": 2200, "y": 780, "r": 11, "c": "San Diego"},
  {"x": 2800, "y": 1050, "r": 12, "c": "San Diego"},
  {"x": 1400, "y": 320, "r": 10, "c": "Inland"},
  {"x": 2000, "y": 420, "r": 13, "c": "Inland"},
  {"x": 2600, "y": 550, "r": 15, "c": "Inland"},
  {"x": 3400, "y": 680, "r": 18, "c": "Inland"}
]
```

X-axis: square footage. Y-axis: price ($K). Bubble radius: relative lot size. Each category gets a distinct pattern fill.

## Minimal Scatter (No Categories, No Radius)

Testing default circle size (r=5) and no category grouping.

```scatter
[
  {"x": 1, "y": 4},
  {"x": 2, "y": 7},
  {"x": 3, "y": 5},
  {"x": 4, "y": 9},
  {"x": 5, "y": 6},
  {"x": 6, "y": 11},
  {"x": 7, "y": 8}
]
```

## Large Custom Scatter

Wide-format scatter with many points across four categories.

```scatter
---
width: 800
height: 500
---
[
  {"x": 10, "y": 85, "r": 4, "c": "Spring"},
  {"x": 15, "y": 78, "r": 5, "c": "Spring"},
  {"x": 20, "y": 72, "r": 6, "c": "Spring"},
  {"x": 25, "y": 65, "r": 5, "c": "Spring"},
  {"x": 30, "y": 55, "r": 4, "c": "Summer"},
  {"x": 35, "y": 42, "r": 7, "c": "Summer"},
  {"x": 40, "y": 35, "r": 8, "c": "Summer"},
  {"x": 45, "y": 30, "r": 6, "c": "Summer"},
  {"x": 20, "y": 90, "r": 5, "c": "Fall"},
  {"x": 25, "y": 82, "r": 6, "c": "Fall"},
  {"x": 30, "y": 75, "r": 7, "c": "Fall"},
  {"x": 35, "y": 68, "r": 5, "c": "Fall"},
  {"x": 5, "y": 92, "r": 6, "c": "Winter"},
  {"x": 10, "y": 88, "r": 7, "c": "Winter"},
  {"x": 15, "y": 95, "r": 8, "c": "Winter"},
  {"x": 20, "y": 91, "r": 5, "c": "Winter"}
]
```

Temperature (x, °C) vs humidity (y, %) by season. Four categories exercise the full pattern set.
