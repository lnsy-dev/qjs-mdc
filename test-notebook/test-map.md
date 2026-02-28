---
publish: true
title: "SVG Debug: Map with Background"
date: 2026-02-27
tags:
  - debug
  - svg
  - map
---

# Map Chart with Background SVG

Testing the map renderer with the socal-map.svg satellite image as background and GeoJSON feature overlays.

## Southern California Points of Interest

Map with custom icons for different feature types (city, beach, park, airport), a LineString route, and a Polygon zone overlay, all rendered on top of the satellite background image.

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
  "backgroundSvg": "./socal-map.svg",
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

Features demonstrated:
- **backgroundSvg**: Satellite image scaled to fill the map viewport
- **iconList**: Custom SVG icons mapped by feature type
- **Point geometry**: Individual locations with type-based icons
- **LineString geometry**: A route connecting Santa Monica to Laguna Beach
- **Polygon geometry**: A rectangular zone highlighting West LA
- **Data attributes**: All GeoJSON properties become SVG data attributes

## Simple Map (No Background, No Icons)

Testing map auto-detection with raw GeoJSON and YAML front matter bounds.

```map
---
nwLat: 34.2
nwLon: -118.6
seLat: 33.8
seLon: -117.8
width: 600
height: 600
backgroundSvg: ./socal-map.svg
---
{
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
        "name": "DTLA"
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
        "name": "Santa Monica"
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          -118.15,
          34.15
        ]
      },
      "properties": {
        "name": "Pasadena"
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
            -118.15,
            34.15
          ]
        ]
      },
      "properties": {
        "name": "West to East Route"
      }
    }
  ]
}
```

This simpler map uses YAML front matter for bounds and renders points as pattern-filled circles without custom icons.
