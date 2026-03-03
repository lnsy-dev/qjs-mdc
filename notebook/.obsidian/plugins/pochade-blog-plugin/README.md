# Pochade Blog Plugin

Obsidian.md tools for reasoning about and generating blog posts for a Pochade Blog.

## Features

### SVG Chart Rendering

This plugin renders inline SVG charts from code blocks in your notes. Supports 6 chart types with full compatibility with qjs-md syntax.

**Supported Chart Types:**
- `bar` - Bar charts (vertical/horizontal)
- `line` - Line charts with multiple series
- `scatter` - Scatter plots
- `donut` - Donut/pie charts
- `heikin-ashi` - Candlestick charts
- `map` - GeoJSON maps

**Basic Usage:**

````markdown
```bar
[
  {"label": "Product A", "value": 45},
  {"label": "Product B", "value": 67}
]
```
````

**With YAML Configuration:**

````markdown
```bar
---
width: 800
height: 400
orientation: horizontal
---
[
  {"label": "Q1", "value": 1200},
  {"label": "Q2", "value": 1450}
]
```
````

**CSV Data with Field Mapping:**

````markdown
```bar
---
labelField: city
valueField: population
---
city,population
Los Angeles,3900000
San Diego,1420000
```
````

See `obsidian-chart-test.md` for comprehensive examples of all chart types.

## Installation

1. Copy this plugin folder to your vault's `.obsidian/plugins/` directory
2. Reload Obsidian
3. Enable "Pochade Blog Plugin" in Settings → Community plugins

## Development

```bash
# Install dependencies
npm install

# Build for development (watch mode)
npm run dev

# Build for production
npm run build
```

## License

MIT
