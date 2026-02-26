# Usage Examples

## Quick Start

```bash
# Show help
./generate-svg.js --help

# Generate a bar chart from JSON file
./generate-svg.js charts/data.json > output.svg

# Generate from stdin
cat data.json | ./generate-svg.js > output.svg

# Generate from string
./generate-svg.js '[{"label":"A","value":30}]' > output.svg
```

## Bar Charts

### Vertical Bar Chart
```bash
./generate-svg.js charts/data.json > bar-vertical.svg
```

### Horizontal Bar Chart
```bash
./generate-svg.js charts/data.json --orientation=horizontal > bar-horizontal.svg
```

### Custom Dimensions
```bash
./generate-svg.js charts/data.json --width=800 --height=600 > bar-large.svg
```

### From CSV
```bash
cat << EOF | ./generate-svg.js > bar-csv.svg
label,value
Product A,45
Product B,67
Product C,23
