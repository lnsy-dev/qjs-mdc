import * as bar from './renderers/bar.js';
import * as scatter from './renderers/scatter.js';
import * as line from './renderers/line.js';
import * as donut from './renderers/donut.js';
import * as heikinAshi from './renderers/heikin-ashi.js';
import * as map from './renderers/map.js';
import { ErrorCode, throwError } from './utils/errors.js';

export const renderers = [
  map,
  heikinAshi,
  line,
  scatter,
  bar,
  donut
];

export function detectChartType(data) {
  // Check for map config wrapper first
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    if (data.type === 'FeatureCollection' || data.features) {
      return 'map';
    }
    if (data.geojson || data.northWestBounds || data.southEastBounds) {
      return 'map';
    }
  }
  
  if (!Array.isArray(data) || data.length === 0) {
    throwError(ErrorCode.INVALID_DATA, 'Data must be a non-empty array');
  }

  const first = data[0];
  
  for (const renderer of renderers) {
    const fields = renderer.metadata.detectFields;
    const hasAllFields = fields.every(field => field in first);
    
    if (hasAllFields) {
      return renderer.metadata.name;
    }
  }
  
  throwError(ErrorCode.INVALID_FORMAT, 'Cannot detect chart type. Data must have either {x,y}, {label,value}, or {open,high,low,close} fields');
}

export function getRenderer(type) {
  const renderer = renderers.find(r => r.metadata.name === type);
  
  if (!renderer) {
    throwError(ErrorCode.INVALID_CHART_TYPE, `Unknown chart type: ${type}`);
  }
  
  return renderer;
}
