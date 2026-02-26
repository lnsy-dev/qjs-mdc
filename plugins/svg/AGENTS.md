# AGENTS.md - Using the QuickJS SVG Chart Generator

## Quick Start

Generate SVG charts from JSON or CSV data:

```bash
# From JSON string
echo '[{"label":"A","value":30}]' | ./generate-svg.js > chart.svg

# From file
./generate-svg.js data.json > chart.svg

# From CSV
cat data.csv | ./generate-svg.js > chart.svg
```

## Chart Types

### Bar Chart
```bash
echo '[{"label":"Q1","value":45},{"label":"Q2","value":67}]' | ./generate-svg.js > bar.svg
```

Horizontal orientation:
```bash
./generate-svg.js data.json --orientation=horizontal > bar-h.svg
```

### Scatter Plot
```bash
echo '[{"x":1,"y":10},{"x":2,"y":20},{"x":3,"y":15}]' | ./generate-svg.js --type=scatter > scatter.svg
```

With categories (different patterns):
```bash
echo '[{"x":1,"y":10,"c":"A"},{"x":2,"y":20,"c":"B"}]' | ./generate-svg.js --type=scatter > scatter.svg
```

### Line Graph
```bash
echo '[{"x":1,"y":10,"c":"Series A"},{"x":2,"y":15,"c":"Series A"}]' | ./generate-svg.js --type=line > line.svg
```

### Donut Chart
```bash
echo '[{"label":"A","value":30},{"label":"B","value":50},{"label":"C","value":20}]' | ./generate-svg.js --type=donut > donut.svg
```

### Heikin-Ashi Chart
```bash
echo '[{"date":"2025-12-08","open":182.64,"high":188,"low":182.4,"close":185.55}]' | ./generate-svg.js > heikin.svg
```

## Options

```bash
--width=N          # Chart width (default: 600)
--height=N         # Chart height (default: 400)
--type=TYPE        # Chart type (auto-detected if omitted)
--orientation=O    # Bar chart: vertical or horizontal
--externally-styled # Remove inline colors, add CSS classes
--help             # Show help
```

## CSS Styling

Generate charts with CSS classes for external styling:

```bash
./generate-svg.js data.json --externally-styled > chart.svg
```

Generate CSS template:

```bash
./tests/generate-css.js > styles.css
```

The template includes CSS variables and class styles:
- `.data-element` - bars, circles, paths, etc.
- `.axis` - chart axes
- `.label` - text labels
- `.data-index-N` - specific data elements by index
- `.data-category-{name}` - elements grouped by category

Customize colors via CSS variables:

```css
:root {
  --pattern-fill: #f0f0f0;
  --pattern-stroke: #333;
  --data-element-stroke: #0066cc;
  --axis-stroke: #666;
  --label-fill: #333;
}
```

## Input Formats

### JSON
```json
[{"label":"A","value":30}]
```

### CSV
```csv
label,value
A,30
B,50
```

### YAML Front Matter + CSV
```yaml
---
type: bar
width: 800
height: 400
---
label,value
A,30
B,50
```

## Data Field Requirements

| Chart Type | Required Fields | Optional Fields |
|------------|----------------|-----------------|
| Bar | `label`, `value` | - |
| Scatter | `x`, `y` | `c` (category), `r` (radius) |
| Line | `x`, `y`, `c` | `r` (radius) |
| Donut | `label`, `value` | - |
| Heikin-Ashi | `open`, `high`, `low`, `close` | `date` |

## Examples

### Custom dimensions
```bash
./generate-svg.js data.json --width=800 --height=600 > chart.svg
```

### Pipe from command
```bash
curl https://api.example.com/data.json | ./generate-svg.js > chart.svg
```

### Multiple series line graph
```bash
cat << EOF | ./generate-svg.js > multi-line.svg
[
  {"x":1,"y":10,"c":"Series A"},
  {"x":2,"y":15,"c":"Series A"},
  {"x":1,"y":5,"c":"Series B"},
  {"x":2,"y":8,"c":"Series B"}
]
EOF
```

### YAML configuration
```bash
cat << EOF | ./generate-svg.js > chart.svg
---
type: bar
width: 800
orientation: horizontal
---
label,value
Product A,45
Product B,67
EOF
```

## Output

SVG is written to stdout. Errors are JSON to stderr:

```json
{"error": "Input data is empty", "code": "INVALID_DATA"}
```

## Compilation

Compile to standalone binary:

```bash
make compile
# or
./compile.sh
```

Run compiled binary:
```bash
./generate-svg data.json > chart.svg
```

## Architecture

The tool uses a modular architecture:

- **generate-svg.js** - Main orchestrator
- **src/cli.js** - CLI parsing
- **src/registry.js** - Renderer discovery
- **src/renderers/** - Chart type implementations
- **src/utils/** - Shared utilities (SVG, patterns, parsers)

See [ADDING-RENDERERS.md](ADDING-RENDERERS.md) for extending with new chart types.

## Patterns

Charts use 4 monochrome SVG patterns for print-friendly output:
1. Diagonal stripes
2. Dots
3. Horizontal stripes
4. Vertical stripes

Patterns cycle through data series automatically.

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_DATA` | Empty or malformed data |
| `INVALID_FORMAT` | Data structure doesn't match expected format |
| `FILE_NOT_FOUND` | Input file not found |
| `PARSE_ERROR` | JSON parsing failed |
| `INVALID_CHART_TYPE` | Unknown chart type specified |
| `MISSING_COLUMNS` | CSV missing required columns |

## Tips

- **Auto-detection:** Omit `--type` to auto-detect chart type from data fields
- **Piping:** Tool reads from stdin if no file/data argument provided
- **YAML config:** Use YAML front matter for complex configurations
- **Field mapping:** Map custom CSV columns using YAML (see [YAML-FORMAT.md](YAML-FORMAT.md))
- **Testing:** Use `echo` with JSON for quick testing

## Common Patterns

### Generate from database query
```bash
psql -t -A -F"," -c "SELECT label, value FROM data" | ./generate-svg.js > chart.svg
```

### Batch processing
```bash
for file in data/*.json; do
  ./generate-svg.js "$file" > "charts/$(basename "$file" .json).svg"
done
```

### Web service integration
```bash
curl -s https://api.example.com/metrics | \
  jq '[.[] | {label: .name, value: .count}]' | \
  ./generate-svg.js --width=1200 > dashboard.svg
```
