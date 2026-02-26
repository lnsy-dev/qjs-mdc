# EXTENDING-QJS-SVG.md

## Writing a Chart Renderer Plugin

This guide shows how to extend the QuickJS SVG Chart Generator with new chart types.

## Plugin Architecture

Each chart renderer is a self-contained ES6 module that exports:
1. **metadata** - Chart name and field requirements for auto-detection
2. **render()** - Function that generates SVG from data

## Step-by-Step Guide

### 1. Create Your Renderer Module

Create a new file in `src/renderers/your-chart.js`:

```javascript
import { rect, circle, line, path, text } from '../utils/svg.js';
import { getPattern } from '../utils/patterns.js';

export const metadata = {
  name: 'your-chart',
  detectFields: ['field1', 'field2']  // Required fields for auto-detection
};

export function render(data, width, height, options = {}) {
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  let svg = '';
  
  // Your rendering logic here
  data.forEach((d, i) => {
    // Use SVG utilities to build your chart
    svg += rect(x, y, w, h, getPattern(i));
  });
  
  // Add axes
  svg += line(margin.left, margin.top, margin.left, height - margin.bottom);
  svg += line(margin.left, height - margin.bottom, width - margin.right, height - margin.bottom);
  
  return svg;
}
```

### 2. Register Your Renderer

Edit `src/registry.js` to import and register your renderer:

```javascript
import * as bar from './renderers/bar.js';
import * as scatter from './renderers/scatter.js';
import * as line from './renderers/line.js';
import * as donut from './renderers/donut.js';
import * as heikinAshi from './renderers/heikin-ashi.js';
import * as yourChart from './renderers/your-chart.js';  // Add this

export const renderers = [
  heikinAshi,
  line,
  scatter,
  bar,
  donut,
  yourChart  // Add this (order matters for auto-detection)
];
```

### 3. Test Your Renderer

```bash
# Test with explicit type
echo '[{"field1":"A","field2":30}]' | ./generate-svg.js --type=your-chart > test.svg

# Test auto-detection
echo '[{"field1":"A","field2":30}]' | ./generate-svg.js > test.svg
```

## Available Utilities

### SVG Primitives (`src/utils/svg.js`)

```javascript
import { rect, circle, line, path, text, escapeXML } from '../utils/svg.js';

// Rectangle
rect(x, y, width, height, fill, stroke = 'black', strokeWidth = 1)

// Circle
circle(cx, cy, r, fill, stroke = 'black', strokeWidth = 1)

// Line
line(x1, y1, x2, y2, stroke = 'black', strokeWidth = 1)

// Path
path(d, fill = 'none', stroke = 'black', strokeWidth = 2)

// Text
text(x, y, content, fontSize = 12, anchor = 'middle')

// Escape XML entities
escapeXML(text)
```

### Pattern Fills (`src/utils/patterns.js`)

```javascript
import { getPattern } from '../utils/patterns.js';

// Get pattern URL for index (cycles through 4 patterns)
const fill = getPattern(0);  // Returns 'url(#pattern-0)'
const fill = getPattern(1);  // Returns 'url(#pattern-1)'
// Patterns: 0=diagonal, 1=dots, 2=horizontal, 3=vertical
```

Patterns are automatically included in the SVG output by the main orchestrator.

## Renderer Interface

### metadata Object

```javascript
export const metadata = {
  name: 'chart-type',           // Used with --type=chart-type
  detectFields: ['field1', 'field2']  // Required fields for auto-detection
};
```

**Auto-detection:** The registry checks if data contains all `detectFields`. First match wins, so order in `renderers` array matters.

### render() Function

```javascript
export function render(data, width, height, options = {}) {
  // data: Array of objects with chart data
  // width: Chart width in pixels
  // height: Chart height in pixels
  // options: Object with CLI options (orientation, etc.)
  
  // Return: String containing SVG elements (no container)
  return '<rect .../><circle .../>';
}
```

**Important:** Don't include `<svg>` container or `<defs>` - the orchestrator handles those.

## Complete Example: Histogram Renderer

```javascript
import { rect, line, text } from '../utils/svg.js';
import { getPattern } from '../utils/patterns.js';

export const metadata = {
  name: 'histogram',
  detectFields: ['bin', 'frequency']
};

export function render(data, width, height, options = {}) {
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  const maxFreq = Math.max(...data.map(d => d.frequency));
  const binWidth = chartWidth / data.length;
  
  let svg = '';
  
  // Draw bars
  data.forEach((d, i) => {
    const barHeight = (d.frequency / maxFreq) * chartHeight;
    const x = margin.left + i * binWidth;
    const y = margin.top + chartHeight - barHeight;
    
    svg += rect(x, y, binWidth - 2, barHeight, getPattern(0));
    svg += text(x + binWidth / 2, height - margin.bottom + 15, d.bin, 9);
  });
  
  // Draw axes
  svg += line(margin.left, margin.top, margin.left, height - margin.bottom);
  svg += line(margin.left, height - margin.bottom, width - margin.right, height - margin.bottom);
  
  return svg;
}
```

Usage:
```bash
echo '[{"bin":"0-10","frequency":5},{"bin":"10-20","frequency":12}]' | \
  ./generate-svg.js --type=histogram > histogram.svg
```

## Advanced Patterns

### Multiple Categories with Different Patterns

```javascript
const categories = {};
data.forEach(d => {
  const cat = d.category || 'default';
  if (!categories[cat]) categories[cat] = [];
  categories[cat].push(d);
});

const catList = Object.keys(categories);
catList.forEach((cat, catIndex) => {
  categories[cat].forEach(d => {
    svg += circle(d.x, d.y, 5, getPattern(catIndex));
  });
});
```

### Scaling Functions

```javascript
const xValues = data.map(d => d.x);
const minX = Math.min(...xValues);
const maxX = Math.max(...xValues);

const xScale = (x) => margin.left + ((x - minX) / (maxX - minX)) * chartWidth;
const yScale = (y) => margin.top + chartHeight - ((y - minY) / (maxY - minY)) * chartHeight;
```

### Helper Functions

Keep helper functions private (don't export):

```javascript
function calculateAngle(value, total) {
  return (value / total) * 360;
}

export function render(data, width, height, options = {}) {
  const angle = calculateAngle(data[0].value, total);
  // ...
}
```

## Best Practices

### 1. Use Standard Margins
```javascript
const margin = { top: 20, right: 20, bottom: 40, left: 40 };
```
Adjust based on label requirements.

### 2. Handle Edge Cases
```javascript
if (!data || data.length === 0) return '';
const maxValue = Math.max(...data.map(d => d.value));
if (maxValue === 0) return '';  // Avoid division by zero
```

### 3. Respect Options
```javascript
export function render(data, width, height, options = {}) {
  const orientation = options.orientation || 'vertical';
  const showLabels = options.showLabels !== false;
  // ...
}
```

### 4. Use Patterns for Fill
Always use `getPattern(index)` instead of solid colors for print-friendly output.

### 5. Escape User Data
```javascript
import { escapeXML } from '../utils/svg.js';
svg += text(x, y, escapeXML(d.label));
```

### 6. Keep It Simple
Each renderer should be 50-100 lines. If larger, consider breaking into helper functions.

## Testing Your Renderer

### Unit Test Pattern
```bash
# Create test data
cat << EOF > test-data.json
[
  {"field1": "A", "field2": 30},
  {"field1": "B", "field2": 50}
]
EOF

# Test rendering
./generate-svg.js test-data.json --type=your-chart > output.svg

# Verify output
cat output.svg | grep '<rect'  # Should show rectangles
```

### Auto-detection Test
```bash
# Should auto-detect based on fields
echo '[{"field1":"A","field2":30}]' | ./generate-svg.js > auto.svg
```

### Edge Cases
```bash
# Empty data
echo '[]' | ./generate-svg.js --type=your-chart

# Single data point
echo '[{"field1":"A","field2":30}]' | ./generate-svg.js --type=your-chart

# Large dataset
# Generate 100 data points and test performance
```

## Debugging

### View Generated SVG
```bash
./generate-svg.js data.json --type=your-chart | less
```

### Check for Errors
```bash
./generate-svg.js data.json --type=your-chart 2>&1 | jq
```

### Validate SVG
```bash
./generate-svg.js data.json --type=your-chart > test.svg
xmllint --noout test.svg  # Requires libxml2
```

## Distribution

### Share Your Renderer

1. Document required fields in metadata
2. Add example data in comments
3. Include usage example
4. Submit as pull request or share as standalone file

### Standalone Distribution

Your renderer can be distributed as a single file. Users just need to:
1. Copy `your-chart.js` to `src/renderers/`
2. Add one line to `src/registry.js`
3. Done!

## Reference Implementations

Study existing renderers for patterns:

- **src/renderers/bar.js** - Simple bars with orientation
- **src/renderers/scatter.js** - Scaling and categories
- **src/renderers/line.js** - Connected points with paths
- **src/renderers/donut.js** - Arc calculations
- **src/renderers/heikin-ashi.js** - Complex candlestick rendering

## Getting Help

- Review existing renderers in `src/renderers/`
- Check SVG utilities in `src/utils/svg.js`
- See pattern utilities in `src/utils/patterns.js`
- Read main orchestrator in `generate-svg.js`

## Summary

To create a new chart renderer:

1. ✓ Create `src/renderers/your-chart.js`
2. ✓ Export `metadata` with name and detectFields
3. ✓ Export `render(data, width, height, options)`
4. ✓ Use SVG utilities and patterns
5. ✓ Register in `src/registry.js`
6. ✓ Test with sample data

Your renderer is now available via `--type=your-chart` and auto-detection!
