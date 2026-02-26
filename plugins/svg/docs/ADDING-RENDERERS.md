# Adding a New Chart Renderer

The modular architecture makes it easy to add new chart types. Here's how:

## Step 1: Create a new renderer file

Create `src/renderers/your-chart.js`:

```javascript
import { rect, circle, line, text } from '../utils/svg.js';
import { getPattern } from '../utils/patterns.js';

export const metadata = {
  name: 'your-chart',
  detectFields: ['field1', 'field2']  // Fields required for auto-detection
};

export function render(data, width, height, options = {}) {
  // Your rendering logic here
  let svg = '';
  
  // Use SVG utilities: rect(), circle(), line(), path(), text()
  // Use patterns: getPattern(index)
  
  return svg;
}
```

## Step 2: Register the renderer

Edit `src/registry.js` and add your renderer:

```javascript
import * as yourChart from './renderers/your-chart.js';

export const renderers = [
  heikinAshi,
  line,
  scatter,
  bar,
  donut,
  yourChart  // Add your renderer here
];
```

## Step 3: Test it

```bash
echo '[{"field1":"A","field2":30}]' | ./generate-svg.js --type=your-chart > chart.svg
```

That's it! The registry will automatically:
- Detect your chart type based on data fields
- Make it available via `--type=your-chart`
- Include it in the help message

## Architecture Benefits

- **Isolated**: Each chart type is in its own file
- **Reusable**: Shared utilities (SVG, patterns, parsers) are centralized
- **Testable**: Each renderer can be tested independently
- **Extensible**: Add/remove renderers without touching core logic
- **Maintainable**: Small, focused modules instead of one large file
