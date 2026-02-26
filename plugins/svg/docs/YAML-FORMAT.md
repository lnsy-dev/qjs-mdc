# YAML Front Matter Format

The SVG chart generator now supports an optional YAML front matter format that allows you to configure chart generation directly in your data files.

## Format

```
---
key: value
---
CSV data here
```

## Supported YAML Fields

### Chart Configuration
- `type`: Chart type (bar, scatter, line, donut, heikin-ashi)
- `width`: Chart width in pixels (default: 600)
- `height`: Chart height in pixels (default: 400)
- `orientation`: Bar chart orientation (vertical, horizontal)

### Field Mappings
Map your CSV column names to the expected field names:

- `labelField`: Maps to `label` (for bar/donut charts)
- `valueField`: Maps to `value` (for bar/donut charts)
- `xField`: Maps to `x` (for scatter/line charts)
- `yField`: Maps to `y` (for scatter/line charts)
- `categoryField`: Maps to `c` (for line charts)
- `radiusField`: Maps to `r` (for scatter charts)
- `dateField`: Maps to `date` (for heikin-ashi charts)
- `openField`: Maps to `open` (for heikin-ashi charts)
- `highField`: Maps to `high` (for heikin-ashi charts)
- `lowField`: Maps to `low` (for heikin-ashi charts)
- `closeField`: Maps to `close` (for heikin-ashi charts)

## Examples

### Heikin-Ashi Chart

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
2025-12-09,185.56,185.7167,183.32,184.97
2025-12-10,184.965,185.48,182.035,183.78
```

### Bar Chart with Custom Field Names

```
---
type: bar
width: 700
height: 300
labelField: product
valueField: sales
---
product,sales
Product A,45
Product B,67
Product C,23
```

### Scatter Plot with Custom Fields

```
---
type: scatter
width: 600
height: 400
xField: time
yField: temperature
---
time,temperature
1,20.5
2,21.3
3,19.8
```

## CLI Override

Command-line arguments always take precedence over YAML configuration:

```bash
# YAML specifies width=800, but CLI overrides to 1000
./generate-svg.js --width=1000 data.md > chart.svg
```

## Backward Compatibility

Files without YAML front matter continue to work exactly as before:

```bash
# Pure JSON
./generate-svg.js data.json > chart.svg

# Pure CSV
./generate-svg.js data.csv > chart.svg

# Stdin
cat data.json | ./generate-svg.js > chart.svg
```
