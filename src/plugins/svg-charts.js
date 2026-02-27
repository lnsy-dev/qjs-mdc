/**
 * @fileoverview SVG Chart Plugin - Converts code blocks to inline SVG charts
 */

import * as bar from '../../plugins/svg/src/renderers/bar.js';
import * as scatter from '../../plugins/svg/src/renderers/scatter.js';
import * as line from '../../plugins/svg/src/renderers/line.js';
import * as donut from '../../plugins/svg/src/renderers/donut.js';
import * as heikinAshi from '../../plugins/svg/src/renderers/heikin-ashi.js';
import * as map from '../../plugins/svg/src/renderers/map.js';
import { createSVGContainer, closeSVGContainer } from '../../plugins/svg/src/utils/svg.js';
import { generatePatternDefs } from '../../plugins/svg/src/utils/patterns.js';

const RENDERERS = {
  'bar': bar,
  'scatter': scatter,
  'line': line,
  'donut': donut,
  'heikin-ashi': heikinAshi,
  'map': map,
  'chart': bar  // alias
};

function decodeHtmlEntities(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

// Local implementations to avoid std.exit() calls
function parseYAMLFrontMatter(input) {
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

function parseData(rawData) {
  const trimmed = rawData.trim();
  const isJSON = trimmed.startsWith('[') || trimmed.startsWith('{');
  
  if (isJSON) {
    return JSON.parse(trimmed);
  }
  
  // Parse CSV
  const lines = trimmed.split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have header and at least one data row');
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

function applyFieldMappings(data, config) {
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

function parseMapConfig(data) {
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

/**
 * Process HTML and replace chart code blocks with inline SVG
 * @param {string} html - HTML content with code blocks
 * @returns {string} HTML with charts rendered as SVG
 */
export function processSVGCharts(html) {
  const regex = /<pre class="code" data-lang="([^"]*)">\s*<code>([\s\S]*?)<\/code>\s*<\/pre>/g;
  let chartCount = 0;
  
  return html.replace(regex, (match, lang, code) => {
    const renderer = RENDERERS[lang];
    if (!renderer) {
      return match; // Not a chart type, pass through
    }
    
    try {
      // Decode HTML entities
      const rawData = decodeHtmlEntities(code);
      
      // Parse YAML front matter if present
      const yamlResult = parseYAMLFrontMatter(rawData);
      let dataContent = rawData;
      let config = {};
      
      if (yamlResult) {
        config = yamlResult.config;
        dataContent = yamlResult.content;
      }
      
      // Set default dimensions
      const width = config.width || 600;
      const height = config.height || 400;
      
      // Build options object
      const options = {
        width,
        height,
        orientation: config.orientation,
        externallyStyled: true,
        nwLat: config.nwLat || config.northWestLat || null,
        nwLon: config.nwLon || config.northWestLon || null,
        seLat: config.seLat || config.southEastLat || null,
        seLon: config.seLon || config.southEastLon || null,
        iconList: config.iconList,
        backgroundSvg: config.backgroundSvg,
        name: config.name,
        description: config.description
      };
      
      // Parse data
      let data = parseData(dataContent);
      
      // Check for map config wrapper
      const mapConfig = parseMapConfig(data);
      if (mapConfig) {
        data = mapConfig.geojson;
        if (mapConfig.northWestBounds && options.nwLat === null) {
          options.nwLat = mapConfig.northWestBounds[0];
          options.nwLon = mapConfig.northWestBounds[1];
        }
        if (mapConfig.southEastBounds && options.seLat === null) {
          options.seLat = mapConfig.southEastBounds[0];
          options.seLon = mapConfig.southEastBounds[1];
        }
        if (mapConfig.iconList) options.iconList = mapConfig.iconList;
        if (mapConfig.backgroundSvg) options.backgroundSvg = mapConfig.backgroundSvg;
        if (mapConfig.name) options.name = mapConfig.name;
        if (mapConfig.description) options.description = mapConfig.description;
      }
      
      // Apply field mappings
      const mappedData = applyFieldMappings(data, config);
      
      // Generate SVG with unique pattern IDs per chart
      const chartId = chartCount++;
      options.chartId = chartId;
      let svg = createSVGContainer(width, height, options.name, options.description);
      svg += generatePatternDefs(chartId);
      svg += renderer.render(mappedData, width, height, options);
      svg += closeSVGContainer();
      
      return `<figure class="chart-figure">${svg}<figcaption class="chart-figcaption"></figcaption></figure>`;
    } catch (e) {
      return `<div class="chart-error" style="border: 2px solid #d00; padding: 10px; margin: 10px 0; background: #fee;">
        <strong>Error generating ${lang} chart:</strong> ${e.message}
      </div>`;
    }
  });
}
