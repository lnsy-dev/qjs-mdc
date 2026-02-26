# CSS Styling Implementation Summary

## Overview
Successfully implemented CSS-stylable SVG elements with backward compatibility. All SVG elements now support external CSS styling while maintaining the default monochrome pattern-based design.

## Changes Made

### 1. Core SVG Utilities (`src/utils/svg.js`)
- Added `className` parameter to all SVG primitive functions (rect, circle, line, path, text)
- Added `externallyStyled` boolean parameter to conditionally include/exclude inline styles
- Added `classAttr()` helper function to generate class attributes
- When `externallyStyled=true`: classes are added, inline fill/stroke attributes are omitted
- When `externallyStyled=false`: both classes and inline styles are included (backward compatible)

### 2. Pattern Generation (`src/utils/patterns.js`)
- Updated all pattern definitions to use CSS variables with fallbacks:
  - `fill="var(--pattern-fill, white)"`
  - `stroke="var(--pattern-stroke, black)"`
- Pattern URL references remain unchanged (`url(#pattern-N)`)

### 3. CSS Generation Utility (`src/utils/css.js`) - NEW FILE
- Created `generateDefaultCSS()` function that returns a complete CSS template
- Includes `:root` block with all CSS variables:
  - `--pattern-fill`, `--pattern-stroke` (pattern colors)
  - `--data-element-fill`, `--data-element-stroke`, `--data-element-stroke-width`
  - `--axis-stroke`, `--axis-stroke-width`
  - `--label-fill`, `--label-font-size`
- Includes default class styles for `.data-element`, `.axis`, `.label`

### 4. Chart Renderers
Updated all 5 renderers to support CSS classes:

#### Bar Chart (`src/renderers/bar.js`)
- Classes: `data-element data-index-{i}` for bars
- Classes: `axis` for axes, `label` for text
- Passes `externallyStyled` flag to all SVG functions

#### Scatter Plot (`src/renderers/scatter.js`)
- Classes: `data-element data-category-{cat}` for circles
- Classes: `axis` for axes
- Added `sanitize()` function to clean category names for CSS class names

#### Line Graph (`src/renderers/line.js`)
- Classes: `data-element data-category-{cat}` for paths and circles
- Classes: `axis` for axes
- Category names are sanitized for CSS compatibility

#### Donut Chart (`src/renderers/donut.js`)
- Classes: `data-element data-index-{i}` for path segments
- Classes: `label` for text labels

#### Heikin-Ashi Chart (`src/renderers/heikin-ashi.js`)
- Classes: `data-element data-index-{i}` for candlesticks
- Classes: `axis` for axes, `label` for text
- Updated `renderCandlestick()` helper function

### 5. CLI (`src/cli.js`)
- Added `externallyStyled` boolean to options (default: `false`)
- Added parsing for `--externally-styled` flag
- Updated help text with new flag and example

### 6. CSS Generation Script (`tests/generate-css.js`) - NEW FILE
- Standalone executable script to generate CSS template
- Uses QuickJS module system
- Outputs CSS to stdout for easy piping

### 7. Test Suite (`tests/run-tests.sh`)
- Added CSS template generation at start of test run
- Added 5 new test cases for externally styled charts:
  - bar-styled.svg
  - scatter-styled.svg
  - line-styled.svg
  - donut-styled.svg
  - heikin-ashi-styled.svg
- CSS template saved to `tests/temp/chart-styles.css`

### 8. Documentation
- Updated `README.md` with CSS Styling section
- Updated `AGENTS.md` with CSS generation examples
- Created demo HTML file (`tests/temp/demo.html`)

### 9. Compiled Binary
- Recompiled with `make compile`
- Binary size: 964K
- Fully supports new `--externally-styled` flag

## CSS Class Structure

### Semantic Classes
- `.data-element` - All data visualization elements (bars, circles, paths, segments)
- `.axis` - Chart axes (both x and y)
- `.label` - Text labels (data labels and axis labels)

### Data-Specific Classes
- `.data-index-N` - Specific data element by index (e.g., `.data-index-0`, `.data-index-1`)
- `.data-category-{name}` - Elements grouped by category (e.g., `.data-category-A`, `.data-category-Series-A`)

### Category Name Sanitization
Category names are sanitized for CSS compatibility:
- Non-alphanumeric characters (except `-` and `_`) are replaced with `-`
- Example: `"Series A"` becomes `"Series-A"`

## CSS Variables

### Pattern Colors
- `--pattern-fill` - Background color for SVG patterns (default: `white`)
- `--pattern-stroke` - Stroke color for SVG patterns (default: `black`)

### Data Element Styling
- `--data-element-fill` - Fill for data elements (default: `url(#pattern-0)`)
- `--data-element-stroke` - Stroke color for data elements (default: `black`)
- `--data-element-stroke-width` - Stroke width for data elements (default: `1`)

### Axis Styling
- `--axis-stroke` - Stroke color for axes (default: `black`)
- `--axis-stroke-width` - Stroke width for axes (default: `1`)

### Label Styling
- `--label-fill` - Text color for labels (default: `black`)
- `--label-font-size` - Font size for labels (default: `12px`)

## Usage Examples

### Generate Externally Styled Chart
```bash
./generate-svg.js data.json --externally-styled > chart.svg
```

### Generate CSS Template
```bash
./tests/generate-css.js > styles.css
```

### Customize CSS
```css
:root {
  --pattern-fill: #e3f2fd;
  --pattern-stroke: #1976d2;
}

.data-element {
  stroke: #1976d2;
  stroke-width: 2;
}

.data-index-0 {
  stroke: #d32f2f;  /* Highlight first element */
}
```

### Link CSS to SVG
```html
<?xml-stylesheet type="text/css" href="styles.css"?>
<svg xmlns="http://www.w3.org/2000/svg" ...>
```

### Embed CSS in SVG
```xml
<svg xmlns="http://www.w3.org/2000/svg" ...>
  <style>
    :root {
      --pattern-fill: #f0f0f0;
      --pattern-stroke: #333;
    }
  </style>
  ...
</svg>
```

## Backward Compatibility

### Default Behavior (externallyStyled=false)
- All inline styles are preserved (fill, stroke, stroke-width)
- CSS classes are also added for future flexibility
- Charts render identically to previous versions
- No breaking changes for existing users

### Example Output (Default)
```xml
<rect x="86" y="125" width="208" height="214" 
      fill="url(#pattern-0)" 
      stroke="black" 
      stroke-width="1" 
      class="data-element data-index-0" 
      data-label="Q1" 
      data-value="45"/>
```

### Example Output (Externally Styled)
```xml
<rect x="86" y="125" width="208" height="214" 
      class="data-element data-index-0" 
      data-label="Q1" 
      data-value="45"/>
```

## Testing

All tests pass successfully:
- ✓ Backward compatibility maintained (default behavior unchanged)
- ✓ CSS template generation works
- ✓ Externally styled charts have classes, no inline colors
- ✓ Regular charts have both classes and inline colors
- ✓ All 5 chart types support CSS styling
- ✓ Compiled binary works with new flag
- ✓ Help text updated and accurate

## Files Modified
1. `src/utils/svg.js` - SVG primitive functions
2. `src/utils/patterns.js` - Pattern definitions
3. `src/renderers/bar.js` - Bar chart renderer
4. `src/renderers/scatter.js` - Scatter plot renderer
5. `src/renderers/line.js` - Line graph renderer
6. `src/renderers/donut.js` - Donut chart renderer
7. `src/renderers/heikin-ashi.js` - Heikin-Ashi renderer
8. `src/cli.js` - CLI argument parsing
9. `tests/run-tests.sh` - Test suite
10. `README.md` - Documentation
11. `AGENTS.md` - Agent documentation

## Files Created
1. `src/utils/css.js` - CSS generation utility
2. `tests/generate-css.js` - CSS generation script
3. `tests/temp/demo.html` - Demo HTML file
4. `tests/temp/chart-styles.css` - Generated CSS template

## Binary
- Recompiled: ✓
- Size: 964K
- Supports all new features: ✓
