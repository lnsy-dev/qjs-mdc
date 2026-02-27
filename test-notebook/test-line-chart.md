---
publish: true
title: "SVG Debug: Line Charts"
date: 2026-02-27
tags:
  - debug
  - svg
  - line
---

# Line Charts

Testing line chart rendering with single and multiple series.

## Multi-Series Line Chart

Three data series showing temperature trends across Southern California locations.

```line
[
  {"x": 1, "y": 58, "c": "LA Coast"},
  {"x": 2, "y": 60, "c": "LA Coast"},
  {"x": 3, "y": 62, "c": "LA Coast"},
  {"x": 4, "y": 65, "c": "LA Coast"},
  {"x": 5, "y": 69, "c": "LA Coast"},
  {"x": 6, "y": 73, "c": "LA Coast"},
  {"x": 7, "y": 76, "c": "LA Coast"},
  {"x": 8, "y": 77, "c": "LA Coast"},
  {"x": 9, "y": 75, "c": "LA Coast"},
  {"x": 10, "y": 70, "c": "LA Coast"},
  {"x": 11, "y": 63, "c": "LA Coast"},
  {"x": 12, "y": 58, "c": "LA Coast"},
  {"x": 1, "y": 56, "c": "San Diego"},
  {"x": 2, "y": 58, "c": "San Diego"},
  {"x": 3, "y": 60, "c": "San Diego"},
  {"x": 4, "y": 63, "c": "San Diego"},
  {"x": 5, "y": 66, "c": "San Diego"},
  {"x": 6, "y": 70, "c": "San Diego"},
  {"x": 7, "y": 74, "c": "San Diego"},
  {"x": 8, "y": 75, "c": "San Diego"},
  {"x": 9, "y": 73, "c": "San Diego"},
  {"x": 10, "y": 67, "c": "San Diego"},
  {"x": 11, "y": 61, "c": "San Diego"},
  {"x": 12, "y": 56, "c": "San Diego"},
  {"x": 1, "y": 48, "c": "Palm Springs"},
  {"x": 2, "y": 52, "c": "Palm Springs"},
  {"x": 3, "y": 58, "c": "Palm Springs"},
  {"x": 4, "y": 66, "c": "Palm Springs"},
  {"x": 5, "y": 75, "c": "Palm Springs"},
  {"x": 6, "y": 84, "c": "Palm Springs"},
  {"x": 7, "y": 92, "c": "Palm Springs"},
  {"x": 8, "y": 91, "c": "Palm Springs"},
  {"x": 9, "y": 84, "c": "Palm Springs"},
  {"x": 10, "y": 72, "c": "Palm Springs"},
  {"x": 11, "y": 58, "c": "Palm Springs"},
  {"x": 12, "y": 48, "c": "Palm Springs"}
]
```

Monthly average high temperatures (°F) by month number (1-12). Each series gets a distinct line style through pattern differentiation.

## Single Series

A line chart without the `c` category field renders as a single line.

```line
[
  {"x": 0, "y": 10},
  {"x": 1, "y": 25},
  {"x": 2, "y": 18},
  {"x": 3, "y": 42},
  {"x": 4, "y": 35},
  {"x": 5, "y": 55},
  {"x": 6, "y": 48},
  {"x": 7, "y": 62}
]
```

## Custom Dimensions

Testing width/height override via YAML front matter in the code block.

```line
---
width: 800
height: 300
---
[
  {"x": 1, "y": 100, "c": "Actual"},
  {"x": 2, "y": 120, "c": "Actual"},
  {"x": 3, "y": 115, "c": "Actual"},
  {"x": 4, "y": 140, "c": "Actual"},
  {"x": 5, "y": 160, "c": "Actual"},
  {"x": 6, "y": 155, "c": "Actual"},
  {"x": 1, "y": 105, "c": "Forecast"},
  {"x": 2, "y": 115, "c": "Forecast"},
  {"x": 3, "y": 125, "c": "Forecast"},
  {"x": 4, "y": 135, "c": "Forecast"},
  {"x": 5, "y": 145, "c": "Forecast"},
  {"x": 6, "y": 155, "c": "Forecast"}
]
```

Wide-format chart at 800x300 comparing actual vs forecast data.
