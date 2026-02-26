# CSS Styling Quick Reference

## Generate Charts

### Default (with inline colors)
```bash
./generate-svg.js data.json > chart.svg
```

### Externally styled (CSS classes only)
```bash
./generate-svg.js data.json --externally-styled > chart.svg
```

## Generate CSS Template
```bash
./tests/generate-css.js > styles.css
```

## CSS Classes

| Class | Description | Used By |
|-------|-------------|---------|
| `.data-element` | All data visualization elements | All charts |
| `.data-index-N` | Specific element by index (0, 1, 2...) | All charts |
| `.data-category-{name}` | Elements grouped by category | Scatter, Line |
| `.axis` | Chart axes (x and y) | All charts |
| `.label` | Text labels | All charts |

## CSS Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `--pattern-fill` | Pattern background color | `white` |
| `--pattern-stroke` | Pattern stroke color | `black` |
| `--data-element-fill` | Data element fill | `url(#pattern-0)` |
| `--data-element-stroke` | Data element stroke color | `black` |
| `--data-element-stroke-width` | Data element stroke width | `1` |
| `--axis-stroke` | Axis stroke color | `black` |
| `--axis-stroke-width` | Axis stroke width | `1` |
| `--label-fill` | Label text color | `black` |
| `--label-font-size` | Label font size | `12px` |

## Example: Custom Blue Theme

```css
:root {
  --pattern-fill: #e3f2fd;
  --pattern-stroke: #1976d2;
  --data-element-stroke: #1976d2;
  --data-element-stroke-width: 2;
  --axis-stroke: #666;
  --label-fill: #333;
}
```

## Example: Highlight Specific Elements

```css
/* Highlight first bar in red */
.data-index-0 {
  stroke: #d32f2f;
  stroke-width: 3;
}

/* Style all elements in category A */
.data-category-A {
  stroke: #4caf50;
  stroke-width: 2;
}
```

## Linking CSS to SVG

### External stylesheet
```xml
<?xml-stylesheet type="text/css" href="styles.css"?>
<svg xmlns="http://www.w3.org/2000/svg" ...>
```

### Embedded styles
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

## Chart Type Examples

### Bar Chart
```bash
echo '[{"label":"Q1","value":45},{"label":"Q2","value":67}]' | \
  ./generate-svg.js --externally-styled > bar.svg
```
Classes: `.data-element`, `.data-index-0`, `.data-index-1`, `.axis`, `.label`

### Scatter Plot
```bash
echo '[{"x":1,"y":10,"c":"A"},{"x":2,"y":20,"c":"B"}]' | \
  ./generate-svg.js --type=scatter --externally-styled > scatter.svg
```
Classes: `.data-element`, `.data-category-A`, `.data-category-B`, `.axis`

### Line Graph
```bash
echo '[{"x":1,"y":10,"c":"Series A"},{"x":2,"y":15,"c":"Series A"}]' | \
  ./generate-svg.js --type=line --externally-styled > line.svg
```
Classes: `.data-element`, `.data-category-Series-A`, `.axis`

### Donut Chart
```bash
echo '[{"label":"A","value":30},{"label":"B","value":50}]' | \
  ./generate-svg.js --type=donut --externally-styled > donut.svg
```
Classes: `.data-element`, `.data-index-0`, `.data-index-1`, `.label`

### Heikin-Ashi Chart
```bash
echo '[{"open":100,"high":110,"low":95,"close":105}]' | \
  ./generate-svg.js --externally-styled > heikin.svg
```
Classes: `.data-element`, `.data-index-0`, `.axis`, `.label`

## Tips

1. **Start with the template**: Generate the CSS template first to see all available variables
2. **Use CSS variables**: They're easier to maintain than individual class styles
3. **Combine classes**: Target specific elements with `.data-element.data-index-0`
4. **Test in browser**: Open SVG in browser to see CSS changes in real-time
5. **Keep patterns**: Pattern fills work great for print-friendly charts
6. **Category sanitization**: Special characters in category names become hyphens (e.g., "Series A" → "Series-A")

## Backward Compatibility

By default (without `--externally-styled`), charts include:
- Inline colors (fill, stroke attributes)
- CSS classes (for future flexibility)
- Both work together seamlessly

This means existing charts continue to work without any changes!
