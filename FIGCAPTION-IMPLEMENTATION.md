# Interactive SVG Figcaption Implementation

## Overview

This implementation adds CSS-only interactive figcaptions to SVG charts. When users click on chart elements (bars, circles, paths), the figcaption displays the data attributes associated with that element in a table format.

## Features

✅ **Pure CSS/HTML** - No JavaScript required  
✅ **Click-based interaction** - Uses checkbox hack for persistent state  
✅ **Table format** - Data displayed in two-column key-value tables  
✅ **Default metadata** - Shows chart name/description when nothing is clicked  
✅ **Multiple charts** - Supports multiple charts per page with unique IDs  

## Implementation Details

### Architecture

1. **Checkbox Hack**: Hidden checkboxes inside SVG elements capture click events
2. **Label Wrapping**: SVG shapes wrapped in `<label>` elements that toggle checkboxes
3. **Figure/Figcaption**: Each SVG wrapped in `<figure>` with `<figcaption>` below
4. **CSS :has() Selector**: Connects checkbox state to figcaption table visibility

### File Changes

#### `plugins/svg/src/utils/svg.js`
- Added `generateFigcaptionData()` - Converts data object to HTML table rows
- Added `generateFigcaptionContent()` - Generates complete figcaption HTML
- Modified `rect()`, `circle()`, `path()` - Added checkbox hack support with `chartId` and `elementId` parameters
- Modified `createSVGContainer()` - Added inline styles for checkbox hiding

#### `plugins/svg/src/renderers/bar.js`
- Collects element data during rendering
- Passes `chartId` and `elementId` to shape functions
- Stores figcaption data in `options.figcaptionData`

#### `plugins/svg/src/renderers/donut.js`
- Same pattern as bar.js for donut chart elements

#### `plugins/svg/src/renderers/line.js`
- Tracks element index across categories
- Generates figcaption data for each point

#### `plugins/svg/src/renderers/scatter.js`
- Similar to line.js for scatter plot points

#### `src/plugins/svg-charts.js`
- Imports `generateFigcaptionContent()`
- Wraps SVG in `<figure>` element
- Generates figcaption HTML from renderer data
- Injects figcaption content into `<figcaption>` element

#### `plugins/svg/src/utils/css.js`
- Added figure/figcaption layout styles
- Added table styling for data display
- Added checkbox hiding rules
- Added `:has()` pseudo-class rules to connect checkboxes to tables
- Pre-generated rules for charts 0-2 with elements 0-11

### HTML Structure

```html
<figure class="chart-figure">
  <svg>
    <defs>
      <style>.chart-checkbox { display: none; } label { cursor: pointer; }</style>
    </defs>
    <g>
      <input type="checkbox" id="chart-0-elem-0" class="chart-checkbox"/>
      <label for="chart-0-elem-0">
        <rect ... data-label="..." data-value="..."/>
      </label>
    </g>
    <!-- more elements -->
  </svg>
  <figcaption class="chart-figcaption" id="figcaption-0">
    <table class="figcaption-table figcaption-default" id="chart-0-default">
      <tr><td colspan="2">Click on a chart element to see details</td></tr>
    </table>
    <table class="figcaption-table figcaption-element" data-chart="0" data-elem="0">
      <tr><td>label</td><td>Los Angeles</td></tr>
      <tr><td>value</td><td>3900000</td></tr>
    </table>
    <!-- more element tables -->
  </figcaption>
</figure>
```

### CSS Logic

```css
/* Hide all tables by default */
.figcaption-table {
  display: none;
}

/* Show default table when no checkbox is checked */
.figcaption-default {
  display: table;
}

/* Hide default when any checkbox is checked */
figure:has(.chart-checkbox:checked) .figcaption-default {
  display: none;
}

/* Show specific table when its checkbox is checked */
figure:has(#chart-0-elem-0:checked) [data-chart="0"][data-elem="0"] {
  display: table;
}
```

## Browser Compatibility

The `:has()` pseudo-class is required for this implementation. Supported in:
- Chrome/Edge 105+
- Firefox 121+
- Safari 15.4+

For older browsers, the figcaption will show the default message but won't update on click.

## Limitations

1. **Fixed CSS rules**: Currently supports up to 3 charts with 12 elements each
2. **No multi-select**: Only one element can be selected at a time per chart
3. **Click-only**: No hover support (by design for mobile compatibility)

## Future Enhancements

1. **Dynamic CSS generation**: Generate CSS rules based on actual chart structure
2. **Radio buttons**: Use radio buttons instead of checkboxes to enforce single selection
3. **Uncheck behavior**: Add ability to uncheck and return to default view
4. **More renderers**: Add support for heikin-ashi and map renderers

## Testing

Build the test notebook and open in a browser:

```bash
./build-test.sh
open test-website/svg-debug-bar-charts.html
```

Click on any bar, donut slice, line point, or scatter point to see its data in the figcaption below the chart.
