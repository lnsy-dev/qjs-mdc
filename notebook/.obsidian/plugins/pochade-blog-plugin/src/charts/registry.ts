import { bar, lineChart, scatter, donut, heikinAshi, map, ChartRenderer } from './renderers';
import { ErrorCode, throwError } from './utils';

export const RENDERERS: Record<string, ChartRenderer> = {
  'bar': bar,
  'line': lineChart,
  'scatter': scatter,
  'donut': donut,
  'heikin-ashi': heikinAshi,
  'map': map,
  'chart': bar  // alias
};

export function detectChartType(data: any): string {
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
  
  // Check each renderer's detect fields
  const rendererList = [map, heikinAshi, lineChart, scatter, bar, donut];
  
  for (const renderer of rendererList) {
    const fields = renderer.metadata.detectFields;
    const hasAllFields = fields.every(field => field in first);
    
    if (hasAllFields) {
      return renderer.metadata.name;
    }
  }
  
  throwError(ErrorCode.INVALID_FORMAT, 'Cannot detect chart type. Data must have either {x,y}, {label,value}, or {open,high,low,close} fields');
}

export function getRenderer(type: string): ChartRenderer {
  const renderer = RENDERERS[type];
  
  if (!renderer) {
    throwError(ErrorCode.INVALID_CHART_TYPE, `Unknown chart type: ${type}`);
  }
  
  return renderer;
}