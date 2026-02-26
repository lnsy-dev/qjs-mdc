# SVG Map Generator - User Guide

## Overview

The map renderer converts GeoJSON data into SVG maps with support for all geometry types, custom icons, and extensive data attributes for interactivity.

## Quick Start

### Basic Usage

```bash
# From GeoJSON file with CLI bounds
./generate-svg.js map.geojson \
  --nw-lat=40.8 --nw-lon=-74.0 \
  --se-lat=40.7 --se-lon=-73.9 \
  > map.svg

# Auto-detect from GeoJSON structure
./generate-svg.js map.geojson --type=map > map.svg
```

### Config Wrapper Format

```json
{
  "northWestBounds": [40.8, -74.0],
  "southEastBounds": [40.7, -73.9],
  "name": "My Map",
  "description": "Map description",
  "iconList": {
    "city": "<svg width=\"20\" height=\"20\">...</svg>",
    "park": "<svg width=\"20\" height=\"20\">...</svg>"
  },
  "geojson": {
    "type": "FeatureCollection",
    "features": [...]
  }
}
```

## Input Formats

### 1. Raw GeoJSON

Standard GeoJSON FeatureCollection:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [-73.95, 40.75]
      },
      "properties": {
        "name": "Central Park",
        "type": "park"
      }
    }
  ]
}
```

**Usage:**
```bash
./generate-svg.js map.geojson \
  --nw-lat=40.8 --nw-lon=-74.0 \
  --se-lat=40.7 --se-lon=-73.9 \
  > map.svg
```

### 2. Config Wrapper

Wrapper object with bounds, icons, and GeoJSON:

```json
{
  "northWestBounds": [lat, lon],
  "southEastBounds": [lat, lon],
  "name": "Map Name",
  "description": "Map Description",
  "iconList": {
    "type-name": "<svg>...</svg>"
  },
  "backgroundSvg": "<svg>...</svg>",
  "geojson": { ... }
}
```

**Usage:**
```bash
./generate-svg.js map-config.json > map.svg
```

### 3. YAML Front Matter

Combine YAML configuration with GeoJSON:

```yaml
---
type: map
width: 800
height: 600
nwLat: 40.8
nwLon: -74.0
seLat: 40.7
seLon: -73.9
name: NYC Map
description: Map of New York City
---
{
  "type": "FeatureCollection",
  "features": [...]
}
```

**Usage:**
```bash
./generate-svg.js map.md > map.svg
```

## Supported Geometry Types

### Point
```json
{
  "type": "Point",
  "coordinates": [lon, lat]
}
```
Rendered as circles or custom icons.

### LineString
```json
{
  "type": "LineString",
  "coordinates": [[lon, lat], [lon, lat], ...]
}
```
Rendered as SVG paths with stroke.

### Polygon
```json
{
  "type": "Polygon",
  "coordinates": [
    [[lon, lat], [lon, lat], ...],  // Outer ring
    [[lon, lat], [lon, lat], ...]   // Holes (optional)
  ]
}
```
Rendered as filled SVG paths with pattern fills.

### MultiPoint, MultiLineString, MultiPolygon
Arrays of their respective base types.

### GeometryCollection
```json
{
  "type": "GeometryCollection",
  "geometries": [
    {"type": "Point", "coordinates": [...]},
    {"type": "LineString", "coordinates": [...]}
  ]
}
```
Renders all contained geometries.

## Icon Mapping

Icons are mapped using the `feature.properties.type` field:

```json
{
  "iconList": {
    "city": "<svg width=\"20\" height=\"20\"><circle cx=\"10\" cy=\"10\" r=\"8\" fill=\"blue\"/></svg>",
    "park": "<svg width=\"20\" height=\"20\"><rect x=\"2\" y=\"2\" width=\"16\" height=\"16\" fill=\"green\"/></svg>"
  }
}
```

**Behavior:**
- If `feature.properties.type` matches an iconList key → render custom icon
- If no match → fallback to pattern-filled circle
- Icons are centered at the point coordinate

## Background SVG

Add a background map or illustration:

```json
{
  "backgroundSvg": "<svg width=\"100\" height=\"100\"><rect width=\"100\" height=\"100\" fill=\"#f0f0f0\"/></svg>"
}
```

The background is:
- Rendered first (z-index 0)
- Scaled to fit the map viewport
- Wrapped in a `<g class="background">` element

## Data Attributes

All GeoJSON properties become SVG data attributes:

**GeoJSON:**
```json
{
  "properties": {
    "name": "Central Park",
    "city": "New York",
    "population": 8000000
  }
}
```

**SVG Output:**
```html
<circle ... 
  data-name="Central Park" 
  data-city="New York" 
  data-population="8000000"
  data-geometry-type="Point"
  data-lon="-73.95"
  data-lat="40.75"
/>
```

**Automatic attributes:**
- `data-geometry-type` - GeoJSON geometry type
- `data-lon`, `data-lat` - Coordinates (for Point geometries)
- All custom properties from `feature.properties`

## CLI Options

```bash
--width=N          # Map width in pixels (default: 600)
--height=N         # Map height in pixels (default: 400)
--type=map         # Force map renderer (auto-detected)
--nw-lat=N         # Northwest corner latitude
--nw-lon=N         # Northwest corner longitude
--se-lat=N         # Southeast corner latitude
--se-lon=N         # Southeast corner longitude
--externally-styled # Remove inline colors, use CSS classes
```

## Coordinate System

- **Input:** WGS84 (EPSG:4326) - longitude, latitude in decimal degrees
- **Projection:** Simple linear scaling from lat/lon bounds to SVG viewport
- **Coordinate order:** GeoJSON standard `[longitude, latitude]`

## Bounds and Clipping

**Bounds specification:**
- Via CLI flags: `--nw-lat`, `--nw-lon`, `--se-lat`, `--se-lon`
- Via config wrapper: `northWestBounds`, `southEastBounds`
- Via YAML front matter: `nwLat`, `nwLon`, `seLat`, `seLon`

**Clipping behavior:**
- Features partially outside bounds are clipped at boundaries
- LineStrings and Polygons are rendered partially if any segment is within bounds
- Points outside bounds are not rendered

## Styling

### Default (Inline Styles)

```bash
./generate-svg.js map.geojson --nw-lat=40.8 ... > map.svg
```

Includes inline colors and pattern fills.

### External CSS

```bash
./generate-svg.js map.geojson --nw-lat=40.8 ... --externally-styled > map.svg
```

Generates CSS classes:
- `.data-element` - All map features
- `.data-index-N` - Specific feature by index
- `.background` - Background SVG group
- `.axis` - Not used in maps (for consistency with other charts)

**Generate CSS template:**
```bash
./tests/generate-css.js > map-styles.css
```

## Examples

### Example 1: Simple Point Map

```bash
cat << EOF | ./generate-svg.js --nw-lat=40.8 --nw-lon=-74.0 --se-lat=40.7 --se-lon=-73.9 > map.svg
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {"type": "Point", "coordinates": [-73.95, 40.75]},
      "properties": {"name": "Central Park"}
    }
  ]
}
EOF
```

### Example 2: Map with Icons

```bash
cat << EOF | ./generate-svg.js > map.svg
{
  "northWestBounds": [40.8, -74.0],
  "southEastBounds": [40.7, -73.9],
  "iconList": {
    "park": "<svg width=\"16\" height=\"16\"><circle cx=\"8\" cy=\"8\" r=\"6\" fill=\"green\"/></svg>"
  },
  "geojson": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [-73.95, 40.75]},
        "properties": {"name": "Central Park", "type": "park"}
      }
    ]
  }
}
EOF
```

### Example 3: Mixed Geometries

```bash
./generate-svg.js tests/maps/california.geojson \
  --nw-lat=38.0 --nw-lon=-123.0 \
  --se-lat=34.0 --se-lon=-118.0 \
  --width=800 --height=600 \
  > california.svg
```

### Example 4: YAML Configuration

```bash
cat << EOF | ./generate-svg.js > map.svg
---
type: map
width: 800
height: 600
nwLat: 40.8
nwLon: -74.0
seLat: 40.7
seLon: -73.9
name: NYC Map
---
{
  "type": "FeatureCollection",
  "features": [...]
}
EOF
```

## Layering

Features are rendered in this order (back to front):
1. Background SVG (if provided)
2. Polygons
3. LineStrings
4. Points/Icons

This ensures proper z-ordering for typical map visualizations.

## Limitations

- **Projection:** Simple linear scaling only (not suitable for large areas or polar regions)
- **Clipping:** Basic Cohen-Sutherland line clipping (may not handle complex polygon clipping perfectly)
- **Icon scaling:** Icons use their original size (no automatic scaling based on zoom level)

## Tips

- **Small areas:** Linear projection works well for city-scale maps
- **Large areas:** Consider pre-projecting your GeoJSON data
- **Performance:** Large GeoJSON files with many features may be slow
- **Interactivity:** Use data attributes with JavaScript for interactive maps
- **Print-friendly:** Pattern fills ensure maps are readable in black and white

## See Also

- [GeoJSON Specification](https://geojson.org/)
- [SVG Path Commands](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths)
- [qjs-svg README](../README.md)
