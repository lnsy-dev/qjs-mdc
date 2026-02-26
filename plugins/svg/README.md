# QuickJS SVG Chart Generator

A standalone QuickJS CLI tool that generates monochrome SVG charts and maps from JSON, CSV, or GeoJSON data. Supports bar charts, scatter plots, line graphs, donut charts, heikin-ashi charts, and geographic maps with pattern-based fills for print-friendly output.

## Features

- **Multiple chart types**: Bar, scatter, line, donut, heikin-ashi, and map charts
- **GeoJSON support**: Render geographic maps from GeoJSON with all geometry types
- **Custom icons**: Map feature types to custom SVG icons
- **Flexible input**: Read from file, stdin, or direct string argument
- **YAML front matter**: Optional YAML configuration with CSV/GeoJSON data for easy customization
- **Field mapping**: Map custom CSV column names to chart fields
- **Auto-detection**: Automatically detects data format (JSON/CSV/GeoJSON) and chart type
- **Monochrome patterns**: Uses 4 distinct SVG patterns (diagonal, dots, horizontal, vertical)
- **Configurable**: Command-line flags for dimensions and chart options
- **Pipeable**: Outputs SVG to stdout for easy piping
- **Error handling**: JSON-formatted error messages to stderr
- **Compilable**: Can be compiled to a standalone binary with qjsc

## Installation

### Prerequisites

- QuickJS (qjs and qjsc for compilation)
- For compilation: gcc, wget, tar (headers are downloaded automatically)

### Build

The script can be used directly without compilation:

```bash
./generate-svg.js --help
```

To compile to a standalone binary:

```bash
# Using make
make compile

# Or using the compile script
./compile.sh

# The script will automatically:
# - Download QuickJS source (if needed)
# - Build the QuickJS library
# - Compile generate-svg to a native binary (~1MB)
```

The compiled binary is a standalone executable with no external dependencies (except libc).

## Usage

```bash
generate-svg [OPTIONS] [DATA]
```

### Input Methods

**From file:**
```bash
./generate-svg.js data.json > chart.svg
./generate-svg.js data.csv > chart.svg
```

**From stdin:**
```bash
cat data.json | ./generate-svg.js > chart.svg
echo '[{"label":"A","value":30}]' | ./generate-svg.js > chart.svg
```

**Direct string:**
```bash
./generate-svg.js '[{"label":"A","value":30},{"label":"B","value":50}]' > chart.svg
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--width=N` | Chart width in pixels | 600 |
| `--height=N` | Chart height in pixels | 400 |
| `--type=TYPE` | Chart type: bar, scatter, line, donut, heikin-ashi, map | Auto-detect |
| `--orientation=O` | Bar chart orientation: vertical, horizontal | vertical |
| `--nw-lat=N` | Map: Northwest corner latitude | - |
| `--nw-lon=N` | Map: Northwest corner longitude | - |
| `--se-lat=N` | Map: Southeast corner latitude | - |
| `--se-lon=N` | Map: Southeast corner longitude | - |
| `--externally-styled` | Remove inline colors, add CSS classes for external styling | false |
| `--help` | Show help message | - |

### CSS Styling

By default, charts include inline colors for immediate use. Use `--externally-styled` to generate charts with CSS classes instead:

```bash
./generate-svg.js data.json --externally-styled > chart.svg
```

Generate a CSS template with default styles:

```bash
./tests/generate-css.js > styles.css
```

The CSS template includes:
- `:root` variables for pattern colors (`--pattern-fill`, `--pattern-stroke`)
- Class styles for `.data-element`, `.axis`, `.label`
- Data-specific classes: `.data-index-N` or `.data-category-{name}`

**Example: Custom styling**

```css
:root {
  --pattern-fill: #f0f0f0;
  --pattern-stroke: #333;
}

.data-element {
  stroke: #0066cc;
  stroke-width: 2;
}

.axis {
  stroke: #666;
}

.label {
  fill: #333;
  font-size: 14px;
}
```

Link the CSS to your SVG:

```html
<?xml-stylesheet type="text/css" href="styles.css"?>
<svg xmlns="http://www.w3.org/2000/svg" ...>
```

Or embed styles directly:

```xml
<svg xmlns="http://www.w3.org/2000/svg" ...>
  <style>
    /* Your CSS here */
  </style>
  ...
</svg>
```

### Data Formats

#### JSON

**Bar/Donut charts:**
```json
[
  {"label": "Category A", "value": 30},
  {"label": "Category B", "value": 50}
]
```

**Scatter plots:**
```json
[
  {"x": 1, "y": 10, "r": 5, "c": "Group A"},
  {"x": 2, "y": 20, "r": 8, "c": "Group B"}
]
```
- `r` (radius) is optional, defaults to 5
- `c` (category) is optional for grouping

**Line graphs:**
```json
[
  {"x": 1, "y": 10, "c": "Series A"},
  {"x": 2, "y": 15, "c": "Series A"},
  {"x": 1, "y": 5, "c": "Series B"}
]
```
- `c` (category) groups points into separate lines
- `r` (radius) is optional for point size

**Heikin-Ashi charts:**
```json
[
  {"date": "2025-12-08", "open": 182.64, "high": 188, "low": 182.4, "close": 185.55},
  {"date": "2025-12-09", "open": 185.56, "high": 185.72, "low": 183.32, "close": 184.97}
]
```
- Requires `open`, `high`, `low`, `close` fields
- `date` field is optional for x-axis labels
- User provides pre-calculated heikin-ashi values

#### CSV

**Bar/Donut charts:**
```csv
label,value
Product A,45
Product B,67
```

**Scatter/Line charts:**
```csv
x,y,c,r
1,10,GroupA,5
2,20,GroupA,8
```

**Heikin-Ashi charts:**
```csv
date,open,high,low,close
2025-12-08,182.64,188,182.4,185.55
2025-12-09,185.56,185.72,183.32,184.97
```

Column names must match exactly: `label,value` or `x,y,c,r` or `date,open,high,low,close`

#### GeoJSON

**Map charts:**
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

Supports all GeoJSON geometry types: Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon, GeometryCollection.

**Map config wrapper:**
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

See [docs/MAP-RENDERER.md](docs/MAP-RENDERER.md) for complete map documentation.

#### YAML Front Matter + CSV

You can combine YAML configuration with CSV data for flexible field mapping:

```
---
type: heikin-ashi
width: 800
height: 400
dateField: date
openField: open
highField: high
lowField: low
closeField: close
---
date,open,high,low,close
2025-12-08,182.64,188,182.4,185.55
2025-12-09,185.56,185.72,183.32,184.97
```

See [YAML-FORMAT.md](YAML-FORMAT.md) for complete documentation.

### Chart Type Auto-Detection

The tool automatically detects chart type based on data structure:
- Data with `type: "FeatureCollection"` or `features` field → Map
- Data with `open`, `high`, `low`, `close` fields → Heikin-Ashi chart
- Data with `x` and `y` fields → Scatter plot (or line graph if `c` field present)
- Data with `label` and `value` fields → Bar chart

Override with `--type` flag if needed.

## Examples

### Bar Chart (Vertical)
```bash
./generate-svg.js charts/data.json > bar-chart.svg
```

### Bar Chart (Horizontal)
```bash
./generate-svg.js charts/data.json --orientation=horizontal > bar-horizontal.svg
```

### Scatter Plot
```bash
echo '[{"x":1,"y":10},{"x":2,"y":20},{"x":3,"y":15}]' | \
  ./generate-svg.js --type=scatter --width=800 --height=400 > scatter.svg
```

### Line Graph with Multiple Series
```bash
cat << EOF | ./generate-svg.js > line-graph.svg
[
  {"x":1,"y":10,"c":"Series A"},
  {"x":2,"y":15,"c":"Series A"},
  {"x":3,"y":12,"c":"Series A"},
  {"x":1,"y":5,"c":"Series B"},
  {"x":2,"y":8,"c":"Series B"},
  {"x":3,"y":11,"c":"Series B"}
]
EOF
```

### Donut Chart
```bash
./generate-svg.js '[{"label":"A","value":30},{"label":"B","value":50},{"label":"C","value":20}]' \
  --type=donut > donut.svg
```

### Map from GeoJSON
```bash
./generate-svg.js map.geojson \
  --nw-lat=40.8 --nw-lon=-74.0 \
  --se-lat=40.7 --se-lon=-73.9 \
  --width=800 --height=600 \
  > map.svg
```

### Map with Icons (Config Wrapper)
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

### CSV Input
```bash
cat data.csv | ./generate-svg.js --width=800 > chart.svg
```

### Piping to File
```bash
./generate-svg.js data.json > output.svg
```

## Error Handling

Errors are output as JSON to stderr with appropriate exit codes:

```json
{"error": "Input data is empty", "code": "INVALID_DATA"}
```

Error codes:
- `INVALID_DATA` - Empty or malformed data
- `INVALID_FORMAT` - Data structure doesn't match expected format
- `FILE_NOT_FOUND` - Input file not found
- `PARSE_ERROR` - JSON parsing failed
- `INVALID_CHART_TYPE` - Unknown chart type specified
- `MISSING_COLUMNS` - CSV missing required columns

## Patterns

The tool uses 4 monochrome SVG patterns that cycle through data series:
1. **Diagonal stripes** - Pattern 0
2. **Dots** - Pattern 1
3. **Horizontal stripes** - Pattern 2
4. **Vertical stripes** - Pattern 3

These patterns ensure charts are readable when printed in black and white.

## Development

### Project Structure

```
qjs-svg/
├── generate-svg.js       # Main entry point (orchestrator)
├── src/
│   ├── cli.js           # CLI argument parsing
│   ├── registry.js      # Renderer registry and detection
│   ├── utils/
│   │   ├── errors.js    # Error handling
│   │   ├── parsers.js   # JSON/CSV/YAML parsing
│   │   ├── patterns.js  # SVG pattern definitions
│   │   └── svg.js       # SVG primitive functions
│   └── renderers/
│       ├── bar.js       # Bar chart renderer
│       ├── scatter.js   # Scatter plot renderer
│       ├── line.js      # Line graph renderer
│       ├── donut.js     # Donut chart renderer
│       └── heikin-ashi.js  # Heikin-Ashi renderer
├── compile.sh           # Compilation script
├── Makefile            # Build and test automation
├── README.md           # This file
├── ADDING-RENDERERS.md # Guide for adding new chart types
└── charts/             # Example HTML charts (reference)
```

### Testing

```bash
# Run all tests
make test

# Manual testing
./generate-svg.js --help
./generate-svg.js charts/data.json > test.svg
```

### Compilation

The script can be compiled to a standalone binary:

```bash
make compile
# or
qjsc -o generate-svg -m generate-svg.js
```

The compiled binary has no external dependencies (except libc).

## Compatibility

- **Platforms**: Linux, macOS
- **QuickJS**: Tested with version 2021-03-27
- **Module support**: Requires `-m` flag for ES6 modules

## License

See LICENSE file in the charts/ directory for reference implementation license.

## Related

This tool is inspired by the HTML/D3.js chart implementation in the `charts/` directory, adapted for command-line use with QuickJS.
