---
publish: true
title: "Simple Map Test"
date: 2026-02-27T00:00:00
tags: [test, map]
---

# Simple Map Test

Testing map with a simple colored background instead of huge image.

```map
{
  "northWestBounds": [34.3, -118.8],
  "southEastBounds": [33.5, -117.5],
  "backgroundSvg": "<rect width='640' height='640' fill='#e0e0e0'/>",
  "geojson": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-118.24, 34.05]},
        "properties": {"name": "LA", "type": "city"}
      }
    ]
  }
}
```
