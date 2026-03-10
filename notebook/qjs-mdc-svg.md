---
publish: true
title: QJS-MDC SVG without JS!
date: 2026-02-28T00:00:00
tags:
  - test
  - charts
  - obsidian
---
# Interactive SVG Charts (with no Javascript!)

In addition to rendering code blocks, mdc will render SVG charts from JSON or CSV data inside fenced code blocks.[^svg-inline] See [[Getting Started]] for the basic project setup before working with charts.

*[SVG]: Scalable Vector Graphics
*[JSON]: JavaScript Object Notation
*[CSV]: Comma-Separated Values

## Bar Chart (Vertical)

Vertical bar charts accept a JSON array with `label` and `value` fields.[^bar-defaults]

```bar
[
  {"label": "Product A", "value": 45},
  {"label": "Product B", "value": 67},
  {"label": "Product C", "value": 32},
  {"label": "Product D", "value": 89}
]
```

## Bar Chart (Horizontal)

Pass a YAML front matter block inside the code fence to configure chart dimensions and orientation:

```bar
---
orientation: horizontal
width: 650
height: 300
---
[
  {"label": "Q1 2026", "value": 1200},
  {"label": "Q2 2026", "value": 1450},
  {"label": "Q3 2026", "value": 1380},
  {"label": "Q4 2026", "value": 1620}
]
```

## Line Chart

Line charts support multiple series via the `category` field:

```line
[
  {"x": 1, "y": 10, "category": "Series A"},
  {"x": 2, "y": 15, "category": "Series A"},
  {"x": 3, "y": 13, "category": "Series A"},
  {"x": 4, "y": 18, "category": "Series A"},
  {"x": 1, "y": 8, "category": "Series B"},
  {"x": 2, "y": 12, "category": "Series B"},
  {"x": 3, "y": 14, "category": "Series B"},
  {"x": 4, "y": 11, "category": "Series B"}
]
```

## Scatter Plot

```scatter
[
  {"x": 10, "y": 20, "category": "Group A"},
  {"x": 15, "y": 25, "category": "Group A"},
  {"x": 20, "y": 18, "category": "Group A"},
  {"x": 12, "y": 30, "category": "Group B"},
  {"x": 18, "y": 22, "category": "Group B"},
  {"x": 25, "y": 28, "category": "Group B"}
]
```

## Donut Chart

```donut
[
  {"label": "Category A", "value": 30},
  {"label": "Category B", "value": 45},
  {"label": "Category C", "value": 25},
  {"label": "Category D", "value": 15}
]
```

## Heikin-Ashi Chart

The Heikin-Ashi chart type uses modified OHLC candlestick calculations to smooth out price noise.[^heikin-ashi]

```heikin-ashi
[
  {"date": "2026-01-01", "open": 100, "high": 110, "low": 95, "close": 105},
  {"date": "2026-01-02", "open": 105, "high": 115, "low": 100, "close": 112},
  {"date": "2026-01-03", "open": 112, "high": 120, "low": 108, "close": 118},
  {"date": "2026-01-04", "open": 118, "high": 125, "low": 115, "close": 120},
  {"date": "2026-01-05", "open": 120, "high": 122, "low": 110, "close": 115}
]
```

## CSV Data with Field Mapping

For CSV data, use `labelField` and `valueField` to map columns:

```bar
---
labelField: city
valueField: population
---
city,population
Los Angeles,3900000
San Diego,1420000
San Jose,1010000
San Francisco,870000
```


## Test Complete

All chart types should render above. Check for:
- ✅ Bar charts (vertical and horizontal)
- ✅ Line chart with multiple series
- ✅ Scatter plot with categories
- ✅ Donut chart with percentages
- ✅ Heikin-Ashi candlestick chart
- ✅ CSV data with field mapping
- ✅ Map with GeoJSON points

[^svg-inline]: All SVG is rendered at compile time and embedded directly in the output HTML. No JavaScript is required for display — the charts are fully static.
[^bar-defaults]: Default chart dimensions are 600×400 px for vertical bar charts. Override with `width` and `height` in the in-fence front matter block.
[^heikin-ashi]: Heikin-Ashi (平均足) is a Japanese candlestick technique. Each candle's open is the average of the previous candle's open and close; the close is the average of the current candle's OHLC values.
