import { circle, path, createDataLabelGroup } from '../utils/svg.js';
import { getPattern } from '../utils/patterns.js';
import { createProjection } from '../utils/geo.js';

export const metadata = {
  name: 'map',
  detectFields: ['type', 'features']
};

function buildDataAttrs(properties, geometry, coords) {
  const data = { ...properties, 'geometry-type': geometry.type };
  if (coords) {
    data.lon = coords[0];
    data.lat = coords[1];
  }
  return data;
}

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

function embedBackgroundSvg(backgroundSvg) {
  if (!backgroundSvg) return '';
  
  const parsed = parseIconSvg(backgroundSvg);
  if (!parsed) return '';
  
  return `  <g class="background">\n    ${parsed.content}\n  </g>\n`;
}

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

function renderGeometryCollection(feature, project, externallyStyled, index, iconList, chartId, linkIdBase) {
  let svg = '';
  feature.geometry.geometries.forEach((geom, i) => {
    const subFeature = { geometry: geom, properties: feature.properties };
    const linkId = linkIdBase ? `${linkIdBase}-${i}` : null;
    svg += renderGeometry(subFeature, project, externallyStyled, `${index}-${i}`, iconList, chartId, linkId);
  });
  return svg;
}

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
    const data = buildDataAttrs(feature.properties || {}, feature.geometry);
    svg += createDataLabelGroup(linkId, width / 2, height + 40, data, width);
    svg += `  </g>\n`;
  });
  
  lines.forEach(({ feature, index }) => {
    const linkId = `map-${chartId}-${index}`;
    svg += `  <g class="chart-item">\n`;
    svg += renderGeometry(feature, project, externallyStyled, index, iconList, chartId, linkId);
    const data = buildDataAttrs(feature.properties || {}, feature.geometry);
    svg += createDataLabelGroup(linkId, width / 2, height + 40, data, width);
    svg += `  </g>\n`;
  });
  
  points.forEach(({ feature, index }) => {
    const linkId = `map-${chartId}-${index}`;
    svg += `  <g class="chart-item">\n`;
    svg += renderGeometry(feature, project, externallyStyled, index, iconList, chartId, linkId);
    const coords = feature.geometry.coordinates;
    const data = buildDataAttrs(feature.properties || {}, feature.geometry, coords);
    svg += createDataLabelGroup(linkId, width / 2, height + 40, data, width);
    svg += `  </g>\n`;
  });
  
  return svg;
}

export function getBackgroundDimensions(backgroundSvg) {
  const parsed = parseIconSvg(backgroundSvg);
  return parsed ? { width: parsed.width, height: parsed.height } : null;
}
