# Downtown Infrastructure Project

The city's new infrastructure initiative focuses on improving public spaces and transportation in the downtown core.

## Project Locations

```map
{
  "northWestBounds": [40.765, -73.990],
  "southEastBounds": [40.745, -73.970],
  "name": "Downtown Infrastructure Map",
  "iconList": {
    "park": "<svg width=\"16\" height=\"16\"><circle cx=\"8\" cy=\"8\" r=\"6\" fill=\"#2d5016\" stroke=\"#000\" stroke-width=\"1\"/></svg>",
    "transit": "<svg width=\"16\" height=\"16\"><rect x=\"2\" y=\"2\" width=\"12\" height=\"12\" fill=\"#1a5490\" stroke=\"#000\" stroke-width=\"1\"/></svg>",
    "construction": "<svg width=\"16\" height=\"16\"><polygon points=\"8,2 14,14 2,14\" fill=\"#f59e0b\" stroke=\"#000\" stroke-width=\"1\"/></svg>"
  },
  "geojson": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-73.985, 40.758]},
        "properties": {"name": "Central Park Renovation", "type": "park"}
      },
      {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-73.982, 40.755]},
        "properties": {"name": "Metro Station Upgrade", "type": "transit"}
      },
      {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-73.978, 40.752]},
        "properties": {"name": "Bridge Repair", "type": "construction"}
      },
      {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-73.975, 40.750]},
        "properties": {"name": "New Transit Hub", "type": "transit"}
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [-73.985, 40.760],
            [-73.980, 40.755],
            [-73.975, 40.750]
          ]
        },
        "properties": {"name": "New Bike Lane", "type": "path"}
      }
    ]
  }
}
```

The map shows key project sites across the downtown area, with parks, transit improvements, and active construction zones.

## Budget Allocation

```donut
[
  {"label": "Transit", "value": 45},
  {"label": "Parks", "value": 25},
  {"label": "Roads", "value": 20},
  {"label": "Utilities", "value": 10}
]
```

Transit improvements receive the largest share of the $180M budget, reflecting the city's commitment to sustainable transportation.
