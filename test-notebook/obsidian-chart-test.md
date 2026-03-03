---
publish: true
title: "Obsidian Chart Plugin Test"
date: 2026-02-28T00:00:00
tags:
  - test
  - charts
  - obsidian
---

# Obsidian Chart Plugin Test

This note tests all chart types in the Obsidian plugin.

## Bar Chart (Vertical)

```bar
[
  {"label": "Product A", "value": 45},
  {"label": "Product B", "value": 67},
  {"label": "Product C", "value": 32},
  {"label": "Product D", "value": 89}
]
```

## Bar Chart (Horizontal)

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

## Map Chart 
```map
{
  "northWestBounds": [
    34.3,
    -118.8
  ],
  "southEastBounds": [
    33.5,
    -117.5
  ],
  "name": "Southern California Points of Interest",
  "backgroundSvg": "socal-map.svg",
  "geojson": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [
            -118.24,
            34.05
          ]
        },
        "properties": {
          "name": "Downtown Los Angeles",
          "type": "city"
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [
            -118.49,
            34.01
          ]
        },
        "properties": {
          "name": "Santa Monica",
          "type": "beach"
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [
            -118.41,
            33.94
          ]
        },
        "properties": {
          "name": "LAX Airport",
          "type": "airport"
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [
            -118.3,
            34.13
          ]
        },
        "properties": {
          "name": "Griffith Park",
          "type": "park"
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [
            -117.92,
            33.81
          ]
        },
        "properties": {
          "name": "Anaheim",
          "type": "city"
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [
            -117.83,
            33.68
          ]
        },
        "properties": {
          "name": "Laguna Beach",
          "type": "beach"
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [
            -118.52,
            34.22
          ]
        },
        "properties": {
          "name": "Topanga State Park",
          "type": "park"
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": [
            -117.87,
            33.94
          ]
        },
        "properties": {
          "name": "Fullerton",
          "type": "city"
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [
              -118.49,
              34.01
            ],
            [
              -118.24,
              34.05
            ],
            [
              -117.92,
              33.81
            ],
            [
              -117.83,
              33.68
            ]
          ]
        },
        "properties": {
          "name": "Pacific Coast Route",
          "type": "route"
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [
                -118.55,
                34.1
              ],
              [
                -118.35,
                34.1
              ],
              [
                -118.35,
                33.95
              ],
              [
                -118.55,
                33.95
              ],
              [
                -118.55,
                34.1
              ]
            ]
          ]
        },
        "properties": {
          "name": "West LA Zone",
          "type": "zone"
        }
      }
    ]
  }
}
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
