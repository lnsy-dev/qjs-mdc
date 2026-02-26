import * as std from "std";

export function showHelp() {
  std.out.puts(`Usage: generate-svg [OPTIONS] [DATA]

Generate monochrome SVG charts from JSON or CSV data.

DATA can be:
  - Path to a JSON/CSV file
  - JSON/CSV string
  - Read from stdin if omitted
  - File with YAML front matter + CSV data

OPTIONS:
  --width=N            Chart width in pixels (default: 600)
  --height=N           Chart height in pixels (default: 400)
  --type=TYPE          Chart type: bar, scatter, line, donut, heikin-ashi, map (auto-detect if omitted)
  --orientation=O      Bar chart orientation: vertical, horizontal (default: vertical)
  --externally-styled  Remove inline colors, add CSS classes for external styling
  --nw-lat=N           Map: Northwest corner latitude
  --nw-lon=N           Map: Northwest corner longitude
  --se-lat=N           Map: Southeast corner latitude
  --se-lon=N           Map: Southeast corner longitude
  --help               Show this help message

EXAMPLES:
  generate-svg data.json > chart.svg
  generate-svg '[{"label":"A","value":30}]' > chart.svg
  cat data.csv | generate-svg --type=bar > chart.svg
  echo '[{"x":1,"y":2}]' | generate-svg --type=scatter > chart.svg
  generate-svg heikin-ashi-test.md > chart.svg
  generate-svg data.json --externally-styled > chart.svg
  generate-svg map.geojson --nw-lat=40.8 --nw-lon=-74.0 --se-lat=40.7 --se-lon=-73.9 > map.svg
`);
  std.exit(0);
}

export function parseArgs(args) {
  const options = {
    width: null,
    height: null,
    type: null,
    orientation: 'vertical',
    externallyStyled: false,
    nwLat: null,
    nwLon: null,
    seLat: null,
    seLon: null,
    dataArg: null
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help') {
      showHelp();
    } else if (arg.startsWith('--width=')) {
      options.width = parseInt(arg.slice(8));
    } else if (arg.startsWith('--height=')) {
      options.height = parseInt(arg.slice(9));
    } else if (arg.startsWith('--type=')) {
      options.type = arg.slice(7);
    } else if (arg.startsWith('--orientation=')) {
      options.orientation = arg.slice(14);
    } else if (arg === '--externally-styled') {
      options.externallyStyled = true;
    } else if (arg.startsWith('--nw-lat=')) {
      options.nwLat = parseFloat(arg.slice(9));
    } else if (arg.startsWith('--nw-lon=')) {
      options.nwLon = parseFloat(arg.slice(9));
    } else if (arg.startsWith('--se-lat=')) {
      options.seLat = parseFloat(arg.slice(9));
    } else if (arg.startsWith('--se-lon=')) {
      options.seLon = parseFloat(arg.slice(9));
    } else if (!arg.startsWith('--')) {
      options.dataArg = arg;
    }
  }

  return options;
}

export function readInput(dataArg) {
  if (dataArg) {
    const file = std.open(dataArg, 'r');
    if (file) {
      const content = file.readAsString();
      file.close();
      return content;
    }
    return dataArg;
  }

  let input = '';
  let line;
  while ((line = std.in.getline()) !== null) {
    input += line + '\n';
  }
  return input.trim();
}
