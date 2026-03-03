// Error handling
export enum ErrorCode {
  INVALID_DATA = 'INVALID_DATA',
  PARSE_ERROR = 'PARSE_ERROR',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_CHART_TYPE = 'INVALID_CHART_TYPE'
}

export function throwError(code: ErrorCode, message: string): never {
  throw new Error(`[${code}] ${message}`);
}

// YAML and data parsing
export function parseYAMLFrontMatter(input: string): { config: Record<string, any>; content: string } | null {
  const trimmed = input.trim();
  if (!trimmed.startsWith('---')) return null;
  
  const lines = trimmed.split('\n');
  let endIndex = -1;
  
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex === -1) return null;
  
  const config: Record<string, any> = {};
  for (let i = 1; i < endIndex; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;
    
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    
    config[key] = !isNaN(Number(value)) ? parseFloat(value) : value;
  }
  
  const content = lines.slice(endIndex + 1).join('\n').trim();
  return { config, content };
}

export function parseJSON(data: string): any {
  try {
    return JSON.parse(data);
  } catch (e) {
    throwError(ErrorCode.PARSE_ERROR, `Invalid JSON: ${(e as Error).message}`);
  }
}

export function parseCSV(data: string): any[] {
  const lines = data.trim().split('\n');
  if (lines.length < 2) {
    throwError(ErrorCode.INVALID_DATA, 'CSV must have header and at least one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const result: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: Record<string, any> = {};
    
    for (let j = 0; j < headers.length; j++) {
      const value = values[j];
      row[headers[j]] = isNaN(Number(value)) ? value : parseFloat(value);
    }
    
    result.push(row);
  }

  return result;
}

export function parseData(rawData: string): any {
  const trimmed = rawData.trim();
  const isJSON = trimmed.startsWith('[') || trimmed.startsWith('{');
  return isJSON ? parseJSON(trimmed) : parseCSV(trimmed);
}

export function applyFieldMappings(data: any[], config: Record<string, any>): any[] {
  if (!Array.isArray(data) || data.length === 0) return data;
  
  const mappings: Record<string, string> = {};
  const fieldKeys = ['dateField', 'openField', 'highField', 'lowField', 'closeField', 
                     'xField', 'yField', 'labelField', 'valueField', 'categoryField', 'radiusField'];
  
  fieldKeys.forEach(key => {
    if (config[key]) {
      const targetField = key.replace('Field', '');
      mappings[config[key]] = targetField;
    }
  });
  
  if (Object.keys(mappings).length === 0) return data;
  
  return data.map(row => {
    const newRow: Record<string, any> = {};
    for (const [oldKey, value] of Object.entries(row)) {
      const newKey = mappings[oldKey] || oldKey;
      newRow[newKey] = value;
    }
    return newRow;
  });
}

export function parseMapConfig(data: any): any | null {
  if (!data || typeof data !== 'object' || 
      !(data.northWestBounds || data.southEastBounds || data.geojson || data.iconList)) {
    return null;
  }
  
  return {
    northWestBounds: data.northWestBounds || data.nwBounds,
    southEastBounds: data.southEastBounds || data.seBounds,
    name: data.name,
    description: data.description,
    geojson: typeof data.geojson === 'string' ? JSON.parse(data.geojson) : data.geojson,
    iconList: data.iconList,
    backgroundSvg: data.backgroundSvg
  };
}

// Chart utilities
export function createLinearScale(domain: [number, number], range: [number, number]): (value: number) => number {
  const [dMin, dMax] = domain;
  const [rMin, rMax] = range;
  const scale = (rMax - rMin) / (dMax - dMin);
  return (value: number) => rMin + (value - dMin) * scale;
}

export function calculateMargins(type: string, data: any[], options: any): { top: number; right: number; bottom: number; left: number } {
  const defaults: Record<string, any> = {
    bar: { top: 20, right: 20, bottom: 60, left: 60 },
    line: { top: 20, right: 20, bottom: 40, left: 40 },
    scatter: { top: 20, right: 20, bottom: 40, left: 40 },
    'heikin-ashi': { top: 20, right: 20, bottom: 60, left: 60 },
    donut: { top: 20, right: 20, bottom: 20, left: 20 }
  };
  
  const margin = defaults[type] || { top: 20, right: 20, bottom: 40, left: 40 };
  
  if (type === 'bar' && options.orientation === 'horizontal' && data.length > 0) {
    const maxLabelLength = Math.max(...data.map((d: any) => (d.label || '').length));
    margin.left = Math.max(60, maxLabelLength * 6 + 20);
  }
  
  return margin;
}

export function sanitizeClassName(str: string): string {
  return String(str).replace(/[^a-zA-Z0-9-_]/g, '-');
}

export function groupByCategory(data: any[], categoryField = 'category'): Record<string, any[]> {
  const groups: Record<string, any[]> = {};
  data.forEach(d => {
    const cat = d[categoryField] || 'default';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(d);
  });
  return groups;
}

// Geo utilities
export function createProjection(nwBounds: [number, number], seBounds: [number, number], width: number, height: number): (coords: [number, number]) => [number, number] {
  const [nwLat, nwLon] = nwBounds;
  const [seLat, seLon] = seBounds;
  
  const lonRange = seLon - nwLon;
  const latRange = nwLat - seLat;
  
  return function project([lon, lat]: [number, number]): [number, number] {
    const x = ((lon - nwLon) / lonRange) * width;
    const y = ((nwLat - lat) / latRange) * height;
    return [x, y];
  };
}

// Pattern utilities
const SPACING = 4;
const STROKE_WIDTH = 1;

function diagonalPattern(id: string): string {
  const size = SPACING * 2;
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="var(--pattern-fill, white)"/>
    <path d="M-1,1 l2,-2 M0,${size} l${size},-${size} M${size-1},${size+1} l2,-2" stroke="var(--pattern-stroke, black)" stroke-width="${STROKE_WIDTH}"/>
  </pattern>`;
}

function dotsPattern(id: string): string {
  const size = SPACING * 2;
  const r = STROKE_WIDTH;
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="var(--pattern-fill, white)"/>
    <circle cx="${SPACING}" cy="${SPACING}" r="${r}" fill="var(--pattern-stroke, black)"/>
  </pattern>`;
}

function horizontalPattern(id: string): string {
  const size = SPACING * 2;
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="var(--pattern-fill, white)"/>
    <line x1="0" y1="${SPACING}" x2="${size}" y2="${SPACING}" stroke="var(--pattern-stroke, black)" stroke-width="${STROKE_WIDTH}"/>
  </pattern>`;
}

function verticalPattern(id: string): string {
  const size = SPACING * 2;
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="var(--pattern-fill, white)"/>
    <line x1="${SPACING}" y1="0" x2="${SPACING}" y2="${size}" stroke="var(--pattern-stroke, black)" stroke-width="${STROKE_WIDTH}"/>
  </pattern>`;
}

export function generatePatternDefs(chartId: number): string {
  const prefix = `pattern-${chartId}`;
  return `<defs>
  ${diagonalPattern(`${prefix}-0`)}
  ${dotsPattern(`${prefix}-1`)}
  ${horizontalPattern(`${prefix}-2`)}
  ${verticalPattern(`${prefix}-3`)}
</defs>
`;
}

export function getPattern(index: number, chartId: number): string {
  const prefix = `pattern-${chartId}`;
  return `url(#${prefix}-${index % 4})`;
}

export function getColor(index: number, cssColors: Record<string, string> | null): string | null {
  if (!cssColors) return null;
  
  const colorKeys = ['--color-primary', '--color-secondary', '--color-tertiary', '--color-quaternary'];
  const key = colorKeys[index % 4];
  return cssColors[key] || null;
}

// SVG utilities
export function escapeXML(text: any): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function createSVGContainer(width: number, height: number, name?: string, description?: string, captionHeight = 80): string {
  const totalHeight = height + captionHeight;
  let attrs = `xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 ${width} ${totalHeight}" role="img"`;
  
  if (name) {
    attrs += ` aria-labelledby="chart-title"`;
    if (description) attrs += ` aria-describedby="chart-desc"`;
  } else if (description) {
    attrs += ` aria-label="${escapeXML(description)}"`;
  }
  
  let svg = `<svg ${attrs}>\n`;
  svg += `  <style>\n`;
  svg += `    .label-group { opacity: 0; pointer-events: none; }\n`;
  svg += `    .chart-item:focus-within .label-group { opacity: 1; }\n`;
  svg += `    text { font-family: inherit; fill: currentColor; }\n`;
  svg += `    a { cursor: pointer; outline: none; }\n`;
  svg += `  </style>\n`;
  
  if (name) {
    svg += `  <title id="chart-title">${escapeXML(name)}</title>\n`;
  }
  if (description) {
    svg += `  <desc id="chart-desc">${escapeXML(description)}</desc>\n`;
  }
  
  return svg;
}

export function closeSVGContainer(): string {
  return '</svg>';
}

export function createDataLabelGroup(id: string, x: number, y: number, data: Record<string, any> | null, width = 400): string {
  if (!data || Object.keys(data).length === 0) return '';
  
  let svg = `  <g class="label-group" data-for="${id}">\n`;
  const parts: string[] = [];
  for (const key in data) {
    if (data[key] !== undefined && data[key] !== null) {
      parts.push(`${key}: ${data[key]}`);
    }
  }
  const text = parts.join(', ');
  svg += `    <text x="${x}" y="${y}" text-anchor="middle" font-size="14" font-weight="bold">${escapeXML(text)}</text>\n`;
  svg += `  </g>\n`;
  return svg;
}

function dataAttrs(data: Record<string, any> | null): string {
  if (!data) return '';
  return ' ' + Object.keys(data).map(k => `data-${k}="${escapeXML(data[k])}"`).join(' ');
}

function classAttr(className: string | null): string {
  if (!className) return '';
  return ` class="${className}"`;
}

function ariaLabel(data: Record<string, any> | null): string {
  if (!data) return '';
  const parts = Object.entries(data).map(([k, v]) => `${k}: ${v}`);
  return ` aria-label="${escapeXML(parts.join(', '))}"`;
}

export function rect(x: number, y: number, width: number, height: number, fill: string, stroke = 'black', strokeWidth = 1, data: Record<string, any> | null = null, className: string | null = null, externallyStyled = false, linkId: string | null = null): string {
  const strokeAttr = externallyStyled ? '' : ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
  const rectEl = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"${strokeAttr}${classAttr(className)}${dataAttrs(data)}${ariaLabel(data)}/>`;
  if (linkId) {
    return `  <a class="chart-link" data-label="${linkId}" tabindex="0">\n    ${rectEl}\n  </a>\n`;
  }
  return rectEl;
}

export function circle(cx: number, cy: number, r: number, fill: string, stroke = 'black', strokeWidth = 1, data: Record<string, any> | null = null, className: string | null = null, externallyStyled = false, linkId: string | null = null): string {
  const strokeAttr = externallyStyled ? '' : ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
  const circleEl = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${strokeAttr}${classAttr(className)}${dataAttrs(data)}${ariaLabel(data)}/>`;
  if (linkId) {
    return `  <a class="chart-link" data-label="${linkId}" tabindex="0">\n    ${circleEl}\n  </a>\n`;
  }
  return circleEl;
}

export function line(x1: number, y1: number, x2: number, y2: number, stroke = 'black', strokeWidth = 1, data: Record<string, any> | null = null, className: string | null = null, externallyStyled = false): string {
  const strokeAttr = externallyStyled ? '' : ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${strokeAttr}${classAttr(className)}${dataAttrs(data)}/>`;
}

export function text(x: number, y: number, content: string, fontSize = 12, textAnchor = 'start', className: string | null = null, externallyStyled = false): string {
  return `<text x="${x}" y="${y}" font-size="${fontSize}" text-anchor="${textAnchor}"${classAttr(className)}>${escapeXML(content)}</text>`;
}

export function path(d: string, fill = 'none', stroke = 'black', strokeWidth = 1, data: Record<string, any> | null = null, className: string | null = null, externallyStyled = false, linkId: string | null = null): string {
  const strokeAttr = externallyStyled ? '' : ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
  const pathEl = `<path d="${d}" fill="${fill}"${strokeAttr}${classAttr(className)}${dataAttrs(data)}${ariaLabel(data)}/>`;
  if (linkId) {
    return `  <a class="chart-link" data-label="${linkId}" tabindex="0">\n    ${pathEl}\n  </a>\n`;
  }
  return pathEl;
}