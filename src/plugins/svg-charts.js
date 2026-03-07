/**
 * @fileoverview SVG Chart Plugin - Converts code blocks to inline SVG charts
 */

import * as std from 'std';
import * as bar from '../../plugins/svg/src/renderers/bar.js';
import * as scatter from '../../plugins/svg/src/renderers/scatter.js';
import * as line from '../../plugins/svg/src/renderers/line.js';
import * as donut from '../../plugins/svg/src/renderers/donut.js';
import * as heikinAshi from '../../plugins/svg/src/renderers/heikin-ashi.js';
import * as map from '../../plugins/svg/src/renderers/map.js';
import { createSVGContainer, closeSVGContainer } from '../../plugins/svg/src/utils/svg.js';
import { generatePatternDefs } from '../../plugins/svg/src/utils/patterns.js';
import { findFileRecursive } from '../utils/file-ops.js';
import { parseMatter } from '../../lib/md-yaml.js';

/** @type {Object.<string, Object>} */
const RENDERERS = {
  'bar': bar,
  'scatter': scatter,
  'line': line,
  'donut': donut,
  'heikin-ashi': heikinAshi,
  'map': map,
  'chart': bar  // alias
};

/**
 * Decodes HTML entities encoded by the markdown parser inside code blocks.
 * @param {string} text - Text with HTML entities
 * @returns {string} Decoded text
 */
function decodeHtmlEntities(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Loads an SVG file from a path or bare filename, searching recursively if needed.
 * Inline SVG strings (starting with `<`) are returned as-is.
 * @param {string} pathOrName - Relative path, bare filename, or inline SVG string
 * @param {string} sourceDir - Source directory for resolving paths
 * @returns {string} SVG file content
 * @throws {Error} If the file cannot be found or loaded
 */
function loadSVGFile(pathOrName, sourceDir) {
  if (pathOrName.trim().startsWith('<')) {
    return pathOrName;
  }

  let svgPath;
  if (pathOrName.startsWith('./') || pathOrName.startsWith('../')) {
    svgPath = `${sourceDir}/${pathOrName}`;
  } else {
    svgPath = findFileRecursive(sourceDir, pathOrName);
  }

  if (!svgPath) {
    throw new Error(`Background SVG file not found: ${pathOrName}`);
  }

  try {
    return std.loadFile(svgPath);
  } catch (e) {
    throw new Error(`Failed to load background SVG from ${svgPath}: ${e.message}`);
  }
}

/**
 * Parses CSV data into an array of row objects.
 * @param {string} rawData - CSV string with header row
 * @returns {Array<Object>} Array of row objects keyed by header names
 * @throws {Error} If CSV has fewer than two lines
 */
function parseCSV(rawData) {
  const lines = rawData.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV must have header and at least one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      const value = values[j];
      row[headers[j]] = isNaN(value) ? value : parseFloat(value);
    }
    return row;
  });
}

/**
 * Parses chart data from a JSON or CSV string.
 * @param {string} rawData - JSON array/object string or CSV string
 * @returns {Array<Object>|Object} Parsed data
 */
function parseData(rawData) {
  const trimmed = rawData.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }
  return parseCSV(trimmed);
}

/**
 * Remaps data field names based on config field mapping keys (e.g., dateField -> date).
 * @param {Array<Object>} data - Array of data rows
 * @param {Object} config - Chart config that may contain field mapping keys
 * @returns {Array<Object>} Data with fields renamed according to mappings
 */
function applyFieldMappings(data, config) {
  if (!Array.isArray(data) || data.length === 0) return data;

  const mappings = {};
  const fieldKeys = ['dateField', 'openField', 'highField', 'lowField', 'closeField',
                     'xField', 'yField', 'labelField', 'valueField', 'categoryField', 'radiusField'];

  for (const key of fieldKeys) {
    if (config[key]) {
      mappings[config[key]] = key.replace('Field', '');
    }
  }

  if (Object.keys(mappings).length === 0) return data;

  return data.map(row => {
    const newRow = {};
    for (const [oldKey, value] of Object.entries(row)) {
      newRow[mappings[oldKey] || oldKey] = value;
    }
    return newRow;
  });
}

/**
 * Detects if parsed data is a map config wrapper object and normalizes it.
 * @param {*} data - Parsed chart data
 * @returns {Object|null} Normalized map config or null if not a map config
 */
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
 * Processes HTML and replaces chart code blocks with inline SVG.
 * @param {string} html - HTML content with code blocks
 * @param {string} sourceDir - Source directory for loading external files
 * @param {Object|null} cssColors - CSS custom properties for chart colors
 * @returns {string} HTML with charts rendered as inline SVG
 */
export function processSVGCharts(html, sourceDir = '.', cssColors = null) {
  const regex = /<pre class="code" data-lang="([^"]*)">\s*<code>([\s\S]*?)<\/code>\s*<\/pre>/g;
  let chartCount = 0;

  return html.replace(regex, (match, lang, code) => {
    const renderer = RENDERERS[lang];
    if (!renderer) return match;

    try {
      const rawData = decodeHtmlEntities(code);

      // Parse optional YAML front matter for chart config
      const parsed = parseMatter(rawData);
      const config = parsed.data;
      const dataContent = parsed.content || rawData;

      const width = config.width || 600;
      const height = config.height || 400;

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
        backgroundSvg: config.backgroundSvg ? loadSVGFile(config.backgroundSvg, sourceDir) : undefined,
        name: config.name,
        description: config.description
      };

      let data = parseData(dataContent);

      // Merge map config wrapper if present
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
        if (mapConfig.backgroundSvg) options.backgroundSvg = loadSVGFile(mapConfig.backgroundSvg, sourceDir);
        if (mapConfig.name) options.name = mapConfig.name;
        if (mapConfig.description) options.description = mapConfig.description;
      }

      const mappedData = applyFieldMappings(data, config);

      const chartId = chartCount++;
      options.chartId = chartId;
      options.cssColors = cssColors;

      let svg = createSVGContainer(width, height, options.name, options.description);
      svg += generatePatternDefs(chartId);
      svg += renderer.render(mappedData, width, height, options);
      svg += closeSVGContainer();

      return svg;
    } catch (e) {
      return `<div class="chart-error" style="border: 2px solid #d00; padding: 10px; margin: 10px 0; background: #fee;">
        <strong>Error generating ${lang} chart:</strong> ${e.message}
      </div>`;
    }
  });
}
