# SVG Map Generator - Quick Reference

## Basic Usage

```bash
# Raw GeoJSON with CLI bounds
./generate-svg.js map.geojson \
  --nw-lat=40.8 --nw-lon=-74.0 \
  --se-lat=40.7 --se-lon=-73.9 \
  > map.svg

# Config wrapper (auto-detects bounds and icons)
./generate-svg.js map-config.json > map.svg

# YAML front matter
./generate-svg.js map.md > map.svg
```

## Input Formats

### Raw GeoJSON
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [-73.95, 40.75]},
      "properties": {"name": "Central Park", "type": "park"}
    }
  ]
}
```

### Config Wrapper
```json
{
  "northWestBounds": [40.8, -74.0],
  "southEastBounds": [40.7, -73.9],
  "name": "NYC Map",
  "iconList": {
    "park": "<svg width=\"16\" height=\"16\">...</svg>"
  },
  "geojson": { ... }
}
```

### YAML Front Matter
```yaml
---
type: map
nwLat: 40.8
nwLon: -74.0
seLat: 40.7
seLon: -73.9
---
{ "type": "FeatureCollection", ... }
```

## Geometry Types

| Type | Description | Rendered As |
|------|-------------|-------------|
| Point | Single coordinate | Circle or custom icon |
| LineString | Array of coordinates | SVG path (stroke) |
| Polygon | Array of rings | SVG path (filled with pattern) |
| MultiPoint | Array of Points | Multiple circles/icons |
| MultiLineString | Array of LineStrings | Multiple paths |
| MultiPolygon | Array of Polygons | Multiple filled paths |
| GeometryCollection | Mixed geometries | All contained types |

## CLI Options

```bash
--width=N          # Map width (default: 600)
--height=N         # Map height (default: 400)
--nw-lat=N         # Northwest corner latitude
--nw-lon=N         # Northwest corner longitude
--se-lat=N         # Southeast corner latitude
--se-lon=N         # Southeast corner longitude
--externally-styled # Use CSS classes instead of inline styles
--type=map         # Force map renderer (auto-detected)
```

## Icon Mapping

Icons are mapped via `feature.properties.type`:

```json
{
  "iconList": {
    "city": "<svg>...</svg>",
    "park": "<svg>...</svg>"
  }
}
```

If no icon matches, falls back to pattern-filled circle.

## Data Attributes

All GeoJSON properties become SVG data attributes:

**Input:**
```json
{
  "properties": {
    "name": "Central Park",
    "city": "New York"
  }
}
```

**Output:**
```html
<circle data-name="Central Park" 
        data-city="New York"
        data-geometry-type="Point"
        data-lon="-73.95"
        data-lat="40.75" />
```

## Examples

### Simple Point Map
```bash
echo '{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": {"type": "Point", "coordinates": [-73.95, 40.75]},
    "properties": {"name": "NYC"}
  }]
}' | ./generate-svg.js --nw-lat=41 --nw-lon=-74 --se-lat=40 --se-lon=-73 > map.svg
```

### Map with Icons
```bash
./generate-svg.js tests/maps/california-config.json > map.svg
```

### Externally Styled
```bash
./generate-svg.js map.geojson --externally-styled > map.svg
```

## Testing

```bash
# Run all map tests
./tests/maps/test-maps.sh

# Verify implementation
./tests/maps/verify-implementation.sh

# View demo
open tests/temp/map-demo.html
```

## Documentation

- **User Guide:** `docs/MAP-RENDERER.md`
- **Implementation:** `docs/MAP-IMPLEMENTATION-SUMMARY.md`
- **Main README:** `README.md`
- **CLI Help:** `./generate-svg.js --help`

## Tips

- Use small geographic areas for best results (linear projection)
- Icon types match `feature.properties.type` field
- All properties become data attributes for JavaScript interactivity
- Pattern fills ensure print-friendly output
- Bounds can be specified via CLI, config, or YAML
