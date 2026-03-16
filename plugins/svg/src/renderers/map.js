/**
 * @fileoverview GeoJSON map renderer for the SVG chart system.
 * Projects WGS-84 GeoJSON features onto a rectangular SVG canvas using a
 * simple equirectangular projection bounded by configurable NW/SE corners.
 * Supports all GeoJSON geometry types: Point, LineString, Polygon,
 * MultiPoint, MultiLineString, MultiPolygon, and GeometryCollection.
 * Features are rendered in layer order (polygons → lines → points) for
 * correct visual stacking. An optional background SVG image can be composited
 * beneath the features (e.g. a hand-drawn map or satellite tile). Custom icon
 * SVGs can be assigned to point features by `type` property.
 */

import { circle, path, createMapDataLabelGroup, escapeXML } from '../utils/svg.js';
import { getPattern } from '../utils/patterns.js';
import { createProjection } from '../utils/geo.js';

/**
 * Renderer metadata used by the chart type auto-detection registry.
 * @type {{ name: string, detectFields: string[] }}
 */
export const metadata = {
  name: 'map',
  detectFields: ['type', 'features']
};

/**
 * Builds an SVG data-attribute object from a GeoJSON feature's properties and
 * geometry, optionally including the point coordinates as `lon`/`lat` fields.
 * @param {Object} properties - GeoJSON feature properties object
 * @param {{ type: string }} geometry - GeoJSON geometry object (for `geometry-type`)
 * @param {number[]|null} [coords] - `[lon, lat]` coordinate pair, or omitted
 * @returns {Object} Flat data-attribute map suitable for SVG element attributes
 */
function buildDataAttrs(properties, geometry, coords) {
  const data = { ...properties, 'geometry-type': geometry.type };
  if (coords) {
    data.lon = coords[0];
    data.lat = coords[1];
  }
  return data;
}

/**
 * Extracts the inner content, width, and height from an SVG string so the icon
 * can be inlined and repositioned via a `<g transform>` wrapper. Falls back to
 * `viewBox` dimensions when explicit `width`/`height` attributes are absent.
 * @param {string|null} iconSvg - Raw SVG markup string, or `null`/falsy
 * @returns {{ content: string, width: number, height: number }|null} Parsed icon
 *   data, or `null` if `iconSvg` is falsy
 */
function parseIconSvg(iconSvg) {
  if (!iconSvg) return null;
  
  // Extract content between <svg> tags
  const match = iconSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  if (!match) return { content: iconSvg, width: 20, height: 20 };
  
  const content = match[1];
  const svgTag = iconSvg.match(/<svg[^>]*>/i)[0];
  
  // Extract width and height
  const widthMatch = svgTag.match(/width=["']?(\d+(?:\.\d+)?)/i);
  const heightMatch = svgTag.match(/height=["']?(\d+(?:\.\d+)?)/i);
  
  // Extract viewBox if no width/height
  const viewBoxMatch = svgTag.match(/viewBox=["']?([^"']+)/i);
  let width = widthMatch ? parseFloat(widthMatch[1]) : 20;
  let height = heightMatch ? parseFloat(heightMatch[1]) : 20;
  
  if (!widthMatch && !heightMatch && viewBoxMatch) {
    const vb = viewBoxMatch[1].split(/[\s,]+/).map(parseFloat);
    if (vb.length === 4) {
      width = vb[2];
      height = vb[3];
    }
  }
  
  return { content, width, height };
}

/**
 * Inlines a parsed icon SVG at a given SVG canvas position, centred on the
 * point, wrapped in a `<g transform="translate(…)">` with data attributes.
 * @param {string} iconSvg - Raw SVG markup for the icon
 * @param {number} x - Target X position (centre of the icon)
 * @param {number} y - Target Y position (centre of the icon)
 * @param {Object|null} data - Data attributes to add to the wrapper `<g>`
 * @param {string} className - CSS class name for the wrapper `<g>`
 * @returns {string} SVG `<g>` element string, or empty string if parsing fails
 */
function embedIcon(iconSvg, x, y, data, className) {
  const parsed = parseIconSvg(iconSvg);
  if (!parsed) return '';
  
  const offsetX = x - parsed.width / 2;
  const offsetY = y - parsed.height / 2;
  
  let dataAttrs = '';
  if (data) {
    dataAttrs = ' ' + Object.keys(data).map(k => `data-${k}="${data[k]}"`).join(' ');
  }
  
  return `  <g transform="translate(${offsetX},${offsetY})" class="${className}"${dataAttrs}>\n    ${parsed.content}\n  </g>\n`;
}

/**
 * Wraps a background SVG's inner content in a `<g class="background">` group
 * so it renders beneath all chart features.
 * @param {string|null} backgroundSvg - Raw SVG markup, or falsy for no background
 * @returns {string} SVG `<g>` element string, or empty string if falsy/unparseable
 */
function embedBackgroundSvg(backgroundSvg) {
  if (!backgroundSvg) return '';
  
  const parsed = parseIconSvg(backgroundSvg);
  if (!parsed) return '';
  
  return `  <g class="background">\n    ${parsed.content}\n  </g>\n`;
}

/**
 * Renders a GeoJSON Point feature as a circle (or custom icon if `iconList`
 * maps the feature's `type` property to an SVG string).
 * @param {Object} feature - GeoJSON Feature with Point geometry
 * @param {function(number[]): number[]} project - Projection function
 * @param {boolean} externallyStyled - Omit inline style attrs when `true`
 * @param {number} index - Feature index for CSS class and element ID
 * @param {Object|null} iconList - Map of feature-type → SVG icon string
 * @param {string} chartId - Unique chart ID prefix
 * @param {string} linkId - Element ID for the data-label popup link
 * @returns {string} SVG fragment string
 */
function renderPoint(feature, project, externallyStyled, index, iconList, chartId, linkId) {
  const coords = feature.geometry.coordinates;
  const [x, y] = project(coords);
  const data = buildDataAttrs(feature.properties || {}, feature.geometry, coords);
  const className = `data-element data-index-${index}`;
  
  const featureType = feature.properties?.type;
  if (iconList && featureType && iconList[featureType]) {
    return embedIcon(iconList[featureType], x, y, data, className);
  }
  
  return circle(x, y, 5, getPattern(index, chartId), 'black', 1, data, className, externallyStyled, linkId);
}

/**
 * Renders a GeoJSON LineString feature as an SVG `<path>` element.
 * @param {Object} feature - GeoJSON Feature with LineString geometry
 * @param {function(number[]): number[]} project - Projection function
 * @param {boolean} externallyStyled - Omit inline style attrs when `true`
 * @param {number} index - Feature index for CSS class
 * @param {string} linkId - Element ID for the data-label popup link
 * @returns {string} SVG `<path>` fragment, or empty string if fewer than 2 coords
 */
function renderLineString(feature, project, externallyStyled, index, linkId) {
  const coords = feature.geometry.coordinates;
  const projected = coords.map(c => project(c));
  
  if (projected.length < 2) return '';
  
  let d = `M ${projected[0][0]} ${projected[0][1]}`;
  for (let i = 1; i < projected.length; i++) {
    d += ` L ${projected[i][0]} ${projected[i][1]}`;
  }
  
  const data = buildDataAttrs(feature.properties || {}, feature.geometry);
  const className = `data-element data-index-${index}`;
  return path(d, 'none', 'black', 2, data, className, externallyStyled, linkId);
}

/**
 * Renders a GeoJSON Polygon feature (including holes) as a single SVG `<path>`
 * using even-odd winding rules implied by the GeoJSON ring order.
 * @param {Object} feature - GeoJSON Feature with Polygon geometry
 * @param {function(number[]): number[]} project - Projection function
 * @param {boolean} externallyStyled - Omit inline style attrs when `true`
 * @param {number} index - Feature index for CSS class and pattern selection
 * @param {string} chartId - Unique chart ID prefix
 * @param {string} linkId - Element ID for the data-label popup link
 * @returns {string} SVG `<path>` fragment, or empty string if no valid rings
 */
function renderPolygon(feature, project, externallyStyled, index, chartId, linkId) {
  const coords = feature.geometry.coordinates;
  let d = '';
  
  coords.forEach((ring, ringIndex) => {
    const projected = ring.map(c => project(c));
    if (projected.length < 3) return;
    
    d += `M ${projected[0][0]} ${projected[0][1]}`;
    for (let i = 1; i < projected.length; i++) {
      d += ` L ${projected[i][0]} ${projected[i][1]}`;
    }
    d += ' Z ';
  });
  
  if (!d) return '';
  
  const data = buildDataAttrs(feature.properties || {}, feature.geometry);
  const className = `data-element data-index-${index}`;
  return path(d, getPattern(index, chartId), 'black', 1, data, className, externallyStyled, linkId);
}

/**
 * Renders a GeoJSON MultiPoint feature as multiple circles (or icons).
 * @param {Object} feature - GeoJSON Feature with MultiPoint geometry
 * @param {function(number[]): number[]} project - Projection function
 * @param {boolean} externallyStyled - Omit inline style attrs when `true`
 * @param {number} index - Feature index for CSS class and pattern selection
 * @param {Object|null} iconList - Map of feature-type → SVG icon string
 * @param {string} chartId - Unique chart ID prefix
 * @param {string|null} linkIdBase - Base ID prefix for data-label popup links
 * @returns {string} Concatenated SVG fragments for each coordinate
 */
function renderMultiPoint(feature, project, externallyStyled, index, iconList, chartId, linkIdBase) {
  const coords = feature.geometry.coordinates;
  let svg = '';
  coords.forEach((coord, i) => {
    const [x, y] = project(coord);
    const data = buildDataAttrs(feature.properties || {}, feature.geometry, coord);
    const className = `data-element data-index-${index}-${i}`;
    const linkId = linkIdBase ? `${linkIdBase}-${i}` : null;
    
    const featureType = feature.properties?.type;
    if (iconList && featureType && iconList[featureType]) {
      svg += embedIcon(iconList[featureType], x, y, data, className);
    } else {
      svg += circle(x, y, 5, getPattern(index, chartId), 'black', 1, data, className, externallyStyled, linkId);
    }
  });
  return svg;
}

/**
 * Renders a GeoJSON MultiLineString feature as multiple SVG `<path>` elements.
 * @param {Object} feature - GeoJSON Feature with MultiLineString geometry
 * @param {function(number[]): number[]} project - Projection function
 * @param {boolean} externallyStyled - Omit inline style attrs when `true`
 * @param {number} index - Feature index for CSS class
 * @param {string|null} linkIdBase - Base ID prefix for data-label popup links
 * @returns {string} Concatenated SVG `<path>` fragments
 */
function renderMultiLineString(feature, project, externallyStyled, index, linkIdBase) {
  const coords = feature.geometry.coordinates;
  let svg = '';
  coords.forEach((line, i) => {
    const projected = line.map(c => project(c));
    if (projected.length < 2) return;
    
    let d = `M ${projected[0][0]} ${projected[0][1]}`;
    for (let j = 1; j < projected.length; j++) {
      d += ` L ${projected[j][0]} ${projected[j][1]}`;
    }
    
    const data = buildDataAttrs(feature.properties || {}, feature.geometry);
    const className = `data-element data-index-${index}-${i}`;
    const linkId = linkIdBase ? `${linkIdBase}-${i}` : null;
    svg += path(d, 'none', 'black', 2, data, className, externallyStyled, linkId);
  });
  return svg;
}

/**
 * Renders a GeoJSON MultiPolygon feature as multiple SVG `<path>` elements,
 * one per polygon member.
 * @param {Object} feature - GeoJSON Feature with MultiPolygon geometry
 * @param {function(number[]): number[]} project - Projection function
 * @param {boolean} externallyStyled - Omit inline style attrs when `true`
 * @param {number} index - Feature index for CSS class and pattern selection
 * @param {string} chartId - Unique chart ID prefix
 * @param {string|null} linkIdBase - Base ID prefix for data-label popup links
 * @returns {string} Concatenated SVG `<path>` fragments
 */
function renderMultiPolygon(feature, project, externallyStyled, index, chartId, linkIdBase) {
  const coords = feature.geometry.coordinates;
  let svg = '';
  coords.forEach((poly, i) => {
    let d = '';
    poly.forEach(ring => {
      const projected = ring.map(c => project(c));
      if (projected.length < 3) return;
      
      d += `M ${projected[0][0]} ${projected[0][1]}`;
      for (let j = 1; j < projected.length; j++) {
        d += ` L ${projected[j][0]} ${projected[j][1]}`;
      }
      d += ' Z ';
    });
    
    if (d) {
      const data = buildDataAttrs(feature.properties || {}, feature.geometry);
      const className = `data-element data-index-${index}-${i}`;
      const linkId = linkIdBase ? `${linkIdBase}-${i}` : null;
      svg += path(d, getPattern(index + i, chartId), 'black', 1, data, className, externallyStyled, linkId);
    }
  });
  return svg;
}

/**
 * Renders a GeoJSON GeometryCollection feature by delegating each sub-geometry
 * to the appropriate typed renderer.
 * @param {Object} feature - GeoJSON Feature with GeometryCollection geometry
 * @param {function(number[]): number[]} project - Projection function
 * @param {boolean} externallyStyled - Omit inline style attrs when `true`
 * @param {number} index - Feature index for CSS class and pattern selection
 * @param {Object|null} iconList - Map of feature-type → SVG icon string
 * @param {string} chartId - Unique chart ID prefix
 * @param {string|null} linkIdBase - Base ID prefix for data-label popup links
 * @returns {string} Concatenated SVG fragments for each geometry member
 */
function renderGeometryCollection(feature, project, externallyStyled, index, iconList, chartId, linkIdBase) {
  let svg = '';
  feature.geometry.geometries.forEach((geom, i) => {
    const subFeature = { geometry: geom, properties: feature.properties };
    const linkId = linkIdBase ? `${linkIdBase}-${i}` : null;
    svg += renderGeometry(subFeature, project, externallyStyled, `${index}-${i}`, iconList, chartId, linkId);
  });
  return svg;
}

/**
 * Computes the best SVG canvas position for a feature's text label based on
 * geometry type: point centroid for points, midpoint for lines, ring centroid
 * for polygons.
 * @param {Object} feature - GeoJSON Feature
 * @param {function(number[]): number[]} project - Projection function
 * @returns {{ x: number, y: number, offsetY: number }|null} Label position with
 *   a Y offset to clear the geometry, or `null` for unsupported types
 */
function computeLabelPoint(feature, project) {
  const type = feature.geometry.type;
  const coords = feature.geometry.coordinates;

  switch (type) {
    case 'Point': {
      const [x, y] = project(coords);
      return { x, y, offsetY: -10 };
    }
    case 'MultiPoint': {
      const [x, y] = project(coords[0]);
      return { x, y, offsetY: -10 };
    }
    case 'LineString': {
      const [x, y] = project(coords[Math.floor(coords.length / 2)]);
      return { x, y, offsetY: -6 };
    }
    case 'MultiLineString': {
      const line = coords[0];
      const [x, y] = project(line[Math.floor(line.length / 2)]);
      return { x, y, offsetY: -6 };
    }
    case 'Polygon': {
      const ring = coords[0];
      let sx = 0, sy = 0;
      ring.forEach(c => { const [px, py] = project(c); sx += px; sy += py; });
      return { x: sx / ring.length, y: sy / ring.length, offsetY: 0 };
    }
    case 'MultiPolygon': {
      const ring = coords[0][0];
      let sx = 0, sy = 0;
      ring.forEach(c => { const [px, py] = project(c); sx += px; sy += py; });
      return { x: sx / ring.length, y: sy / ring.length, offsetY: 0 };
    }
    default: return null;
  }
}

/**
 * Renders the `label` property of a GeoJSON feature as a white-outlined SVG
 * `<text>` element positioned at the computed label point. Returns an empty
 * string if the feature has no `label` property or no computable label point.
 * @param {Object} feature - GeoJSON Feature with optional `properties.label`
 * @param {function(number[]): number[]} project - Projection function
 * @returns {string} SVG `<text>` element string, or empty string
 */
function renderFeatureLabel(feature, project) {
  const label = feature.properties?.label;
  if (!label) return '';
  const pt = computeLabelPoint(feature, project);
  if (!pt) return '';
  const style = [
    'font-family:inherit',
    'font-size:12px',
    'text-anchor:middle',
    'dominant-baseline:auto',
    'pointer-events:none',
    'paint-order:stroke',
    'stroke:white',
    'stroke-width:3',
    'stroke-linejoin:round',
  ].join(';');
  return `  <text x="${pt.x}" y="${pt.y + pt.offsetY}" style="${style}">${escapeXML(label)}</text>\n`;
}

/**
 * Dispatches a single GeoJSON feature to the appropriate geometry-type renderer.
 * @param {Object} feature - GeoJSON Feature
 * @param {function(number[]): number[]} project - Projection function
 * @param {boolean} externallyStyled - Omit inline style attrs when `true`
 * @param {number|string} index - Feature index for CSS class and pattern selection
 * @param {Object|null} iconList - Map of feature-type → SVG icon string
 * @param {string} chartId - Unique chart ID prefix
 * @param {string} linkId - Element ID for the data-label popup link
 * @returns {string} SVG fragment for the feature's geometry, or empty string
 */
function renderGeometry(feature, project, externallyStyled, index, iconList, chartId, linkId) {
  const type = feature.geometry.type;
  
  switch (type) {
    case 'Point': return renderPoint(feature, project, externallyStyled, index, iconList, chartId, linkId);
    case 'LineString': return renderLineString(feature, project, externallyStyled, index, linkId);
    case 'Polygon': return renderPolygon(feature, project, externallyStyled, index, chartId, linkId);
    case 'MultiPoint': return renderMultiPoint(feature, project, externallyStyled, index, iconList, chartId, linkId);
    case 'MultiLineString': return renderMultiLineString(feature, project, externallyStyled, index, linkId);
    case 'MultiPolygon': return renderMultiPolygon(feature, project, externallyStyled, index, chartId, linkId);
    case 'GeometryCollection': return renderGeometryCollection(feature, project, externallyStyled, index, iconList, chartId, linkId);
    default: return '';
  }
}

/**
 * Renders a GeoJSON FeatureCollection as an SVG map fragment.
 * Features are drawn in layer order: polygons first, then lines, then points,
 * so that point markers always appear on top.
 * @param {{ features: Object[] }} data - GeoJSON FeatureCollection
 * @param {number} width - Total SVG canvas width in pixels
 * @param {number} height - Total SVG canvas height in pixels
 * @param {Object} [options={}] - Rendering options
 * @param {boolean} [options.externallyStyled=false] - Omit inline style attrs
 * @param {string} [options.chartId] - Unique ID prefix for element IDs
 * @param {Object|null} [options.iconList] - Map of feature-type → SVG icon string
 * @param {string|null} [options.backgroundSvg] - Background SVG markup rendered
 *   beneath all features
 * @param {number} [options.nwLat] - North-west bounding latitude (overrides `nwBounds`)
 * @param {number} [options.nwLon] - North-west bounding longitude
 * @param {number} [options.seLat] - South-east bounding latitude (overrides `seBounds`)
 * @param {number} [options.seLon] - South-east bounding longitude
 * @param {number[]} [options.nwBounds=[90,-180]] - `[lat, lon]` NW corner default
 * @param {number[]} [options.seBounds=[-90,180]] - `[lat, lon]` SE corner default
 * @returns {string} SVG fragment string (no outer `<svg>` wrapper)
 */
export function render(data, width, height, options = {}) {
  const externallyStyled = options.externallyStyled || false;
  const chartId = options.chartId;
  const iconList = options.iconList;
  const backgroundSvg = options.backgroundSvg;
  
  // Extract bounds from options or calculate from data
  let nwBounds = options.nwBounds || [90, -180];
  let seBounds = options.seBounds || [-90, 180];
  
  if (options.nwLat !== undefined) nwBounds = [options.nwLat, options.nwLon];
  if (options.seLat !== undefined) seBounds = [options.seLat, options.seLon];
  
  const features = data.features || [];
  const project = createProjection(nwBounds, seBounds, width, height);
  
  let svg = '';

  // Render background first
  if (backgroundSvg) {
    svg += embedBackgroundSvg(backgroundSvg);
  }

  // Render by geometry type for proper layering
  const polygons = [], lines = [], points = [];

  features.forEach((feature, i) => {
    const type = feature.geometry?.type;
    if (type === 'Polygon' || type === 'MultiPolygon') {
      polygons.push({ feature, index: i });
    } else if (type === 'LineString' || type === 'MultiLineString') {
      lines.push({ feature, index: i });
    } else {
      points.push({ feature, index: i });
    }
  });

  polygons.forEach(({ feature, index }) => {
    const linkId = `map-${chartId}-${index}`;
    svg += `  <g class="chart-item">\n`;
    svg += renderGeometry(feature, project, externallyStyled, index, iconList, chartId, linkId);
    svg += renderFeatureLabel(feature, project);
    const data = buildDataAttrs(feature.properties || {}, feature.geometry);
    svg += createMapDataLabelGroup(linkId, data, height, width);
    svg += `  </g>\n`;
  });

  lines.forEach(({ feature, index }) => {
    const linkId = `map-${chartId}-${index}`;
    svg += `  <g class="chart-item">\n`;
    svg += renderGeometry(feature, project, externallyStyled, index, iconList, chartId, linkId);
    svg += renderFeatureLabel(feature, project);
    const data = buildDataAttrs(feature.properties || {}, feature.geometry);
    svg += createMapDataLabelGroup(linkId, data, height, width);
    svg += `  </g>\n`;
  });

  points.forEach(({ feature, index }) => {
    const linkId = `map-${chartId}-${index}`;
    svg += `  <g class="chart-item">\n`;
    svg += renderGeometry(feature, project, externallyStyled, index, iconList, chartId, linkId);
    svg += renderFeatureLabel(feature, project);
    const coords = feature.geometry.coordinates;
    const data = buildDataAttrs(feature.properties || {}, feature.geometry, coords);
    svg += createMapDataLabelGroup(linkId, data, height, width);
    svg += `  </g>\n`;
  });

  return svg;
}

/**
 * Extracts the pixel dimensions from a background SVG string so the chart
 * canvas can be sized to match it exactly.
 * @param {string} backgroundSvg - Raw SVG markup
 * @returns {{ width: number, height: number }|null} Dimensions, or `null` if
 *   the SVG cannot be parsed
 */
export function getBackgroundDimensions(backgroundSvg) {
  const parsed = parseIconSvg(backgroundSvg);
  return parsed ? { width: parsed.width, height: parsed.height } : null;
}
