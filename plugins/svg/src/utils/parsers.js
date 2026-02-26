import { ErrorCode, throwError } from './errors.js';

export function validateInput(data) {
  if (!data || data.trim() === '') {
    throwError(ErrorCode.INVALID_DATA, 'Input data is empty');
  }
}

export function parseYAMLFrontMatter(input) {
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
  
  const config = {};
  for (let i = 1; i < endIndex; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;
    
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();
    
    if (!isNaN(value)) {
      config[key] = parseFloat(value);
    } else {
      config[key] = value;
    }
  }
  
  const content = lines.slice(endIndex + 1).join('\n').trim();
  return { config, content };
}

export function applyFieldMappings(data, config) {
  if (!Array.isArray(data) || data.length === 0) return data;
  
  const mappings = {};
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
    const newRow = {};
    for (const [oldKey, value] of Object.entries(row)) {
      const newKey = mappings[oldKey] || oldKey;
      newRow[newKey] = value;
    }
    return newRow;
  });
}

export function detectFormat(data) {
  const trimmed = data.trim();
  return (trimmed.startsWith('[') || trimmed.startsWith('{')) ? 'json' : 'csv';
}

export function parseJSON(data) {
  try {
    return JSON.parse(data);
  } catch (e) {
    throwError(ErrorCode.PARSE_ERROR, `Invalid JSON: ${e.message}`);
  }
}

export function parseCSV(data) {
  const lines = data.trim().split('\n');
  if (lines.length < 2) {
    throwError(ErrorCode.INVALID_DATA, 'CSV must have header and at least one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row = {};
    
    for (let j = 0; j < headers.length; j++) {
      const value = values[j];
      row[headers[j]] = isNaN(value) ? value : parseFloat(value);
    }
    
    result.push(row);
  }

  return result;
}

export function parseData(rawData) {
  const format = detectFormat(rawData);
  return format === 'json' ? parseJSON(rawData) : parseCSV(rawData);
}

export function isMapConfigWrapper(data) {
  return data && typeof data === 'object' && 
         (data.northWestBounds || data.southEastBounds || data.geojson || data.iconList);
}

export function parseMapConfig(data) {
  if (!isMapConfigWrapper(data)) return null;
  
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
