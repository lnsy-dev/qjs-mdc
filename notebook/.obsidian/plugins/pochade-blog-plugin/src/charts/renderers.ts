import { rect, line, text, circle, path, createDataLabelGroup } from './utils';
import { getPattern, getColor, calculateMargins, createLinearScale, sanitizeClassName, groupByCategory, createProjection } from './utils';

export interface ChartMetadata {
  name: string;
  detectFields: string[];
}

export interface ChartRenderer {
  metadata: ChartMetadata;
  render: (data: any, width: number, height: number, options?: any) => string;
}

// Bar Chart
export const bar: ChartRenderer = {
  metadata: {
    name: 'bar',
    detectFields: ['label', 'value']
  },
  render(data: any[], width: number, height: number, options: any = {}) {
    const orientation = options.orientation || 'vertical';
    const externallyStyled = options.externallyStyled || false;
    const chartId = options.chartId;
    const cssColors = options.cssColors;
    const margin = calculateMargins('bar', data, options);
    
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const maxValue = Math.max(...data.map(d => d.value));
    const barCount = data.length;
    
    let svg = '';
    
    if (orientation === 'vertical') {
      const barWidth = chartWidth / barCount * 0.8;
      const barSpacing = chartWidth / barCount;
      
      data.forEach((d, i) => {
        const barHeight = (d.value / maxValue) * chartHeight;
        const x = margin.left + i * barSpacing + barSpacing * 0.1;
        const y = margin.top + chartHeight - barHeight;
        
        const color = getColor(i, cssColors);
        const fill = color || getPattern(i, chartId);
        const linkId = `bar-${chartId}-${i}`;
        
        svg += `  <g class="chart-item">\n`;
        svg += rect(x, y, barWidth, barHeight, fill, 'black', 1, { label: d.label, value: d.value }, `data-element data-index-${i}`, externallyStyled, linkId);
        svg += createDataLabelGroup(linkId, width / 2, height + 40, { label: d.label, value: d.value }, width);
        svg += `  </g>\n`;
        svg += text(x + barWidth / 2, height - margin.bottom + 20, d.label, 10, 'middle', 'label', externallyStyled);
      });
      
      svg += line(margin.left, margin.top, margin.left, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
      svg += line(margin.left, height - margin.bottom, width - margin.right, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
      
    } else {
      const barHeight = chartHeight / barCount * 0.8;
      const barSpacing = chartHeight / barCount;
      
      data.forEach((d, i) => {
        const barWidth = (d.value / maxValue) * chartWidth;
        const x = margin.left;
        const y = margin.top + i * barSpacing + barSpacing * 0.1;
        
        const color = getColor(i, cssColors);
        const fill = color || getPattern(i, chartId);
        const linkId = `bar-${chartId}-${i}`;
        
        svg += `  <g class="chart-item">\n`;
        svg += rect(x, y, barWidth, barHeight, fill, 'black', 1, { label: d.label, value: d.value }, `data-element data-index-${i}`, externallyStyled, linkId);
        svg += createDataLabelGroup(linkId, width / 2, height + 40, { label: d.label, value: d.value }, width);
        svg += `  </g>\n`;
        svg += text(margin.left - 10, y + barHeight / 2 + 4, d.label, 10, 'end', 'label', externallyStyled);
      });
      
      svg += line(margin.left, margin.top, margin.left, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
      svg += line(margin.left, height - margin.bottom, width - margin.right, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
    }
    
    return svg;
  }
};

// Line Chart
export const lineChart: ChartRenderer = {
  metadata: {
    name: 'line',
    detectFields: ['x', 'y', 'category']
  },
  render(data: any[], width: number, height: number, options: any = {}) {
    const externallyStyled = options.externallyStyled || false;
    const cssColors = options.cssColors;
    const margin = calculateMargins('line', data, options);
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const xValues = data.map(d => d.x);
    const yValues = data.map(d => d.y);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    
    const xScale = createLinearScale([minX, maxX], [margin.left, margin.left + chartWidth]);
    const yScale = createLinearScale([minY, maxY], [margin.top + chartHeight, margin.top]);
    
    const categories = groupByCategory(data);
    const catList = Object.keys(categories);
    const chartId = options.chartId;
    let svg = '';
    let pointIndex = 0;
    
    catList.forEach((cat, catIndex) => {
      const points = categories[cat].sort((a: any, b: any) => a.x - b.x);
      
      let pathData = '';
      points.forEach((d: any, i: number) => {
        const x = xScale(d.x);
        const y = yScale(d.y);
        pathData += (i === 0 ? `M${x},${y}` : ` L${x},${y}`);
      });
      
      svg += path(pathData, 'none', 'black', 2, { category: cat }, `data-element data-category-${sanitizeClassName(cat)}`, externallyStyled);
      
      points.forEach((d: any) => {
        const r = d.r || 4;
        const color = getColor(catIndex, cssColors);
        const fill = color || getPattern(catIndex, chartId);
        const linkId = `line-${chartId}-${pointIndex}`;
        
        svg += `  <g class="chart-item">\n`;
        svg += circle(xScale(d.x), yScale(d.y), r, fill, 'black', 1, { x: d.x, y: d.y, category: cat, r }, `data-element data-category-${sanitizeClassName(cat)}`, externallyStyled, linkId);
        svg += createDataLabelGroup(linkId, width / 2, height + 40, { x: d.x, y: d.y, category: cat }, width);
        svg += `  </g>\n`;
        pointIndex++;
      });
    });
    
    svg += line(margin.left, margin.top, margin.left, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
    svg += line(margin.left, height - margin.bottom, width - margin.right, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
    
    return svg;
  }
};

// Scatter Plot
export const scatter: ChartRenderer = {
  metadata: {
    name: 'scatter',
    detectFields: ['x', 'y']
  },
  render(data: any[], width: number, height: number, options: any = {}) {
    const externallyStyled = options.externallyStyled || false;
    const cssColors = options.cssColors;
    const margin = calculateMargins('scatter', data, options);
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const xValues = data.map(d => d.x);
    const yValues = data.map(d => d.y);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);
    
    const xScale = createLinearScale([minX, maxX], [margin.left, margin.left + chartWidth]);
    const yScale = createLinearScale([minY, maxY], [margin.top + chartHeight, margin.top]);
    
    const categories = groupByCategory(data);
    const catList = Object.keys(categories);
    const chartId = options.chartId;
    let svg = '';
    let pointIndex = 0;
    
    catList.forEach((cat, catIndex) => {
      categories[cat].forEach((d: any) => {
        const r = d.r || 5;
        const color = getColor(catIndex, cssColors);
        const fill = color || getPattern(catIndex, chartId);
        const linkId = `scatter-${chartId}-${pointIndex}`;
        
        svg += `  <g class="chart-item">\n`;
        svg += circle(xScale(d.x), yScale(d.y), r, fill, 'black', 1, { x: d.x, y: d.y, category: d.category || 'default', r }, `data-element data-category-${sanitizeClassName(cat)}`, externallyStyled, linkId);
        svg += createDataLabelGroup(linkId, width / 2, height + 40, { x: d.x, y: d.y, category: cat }, width);
        svg += `  </g>\n`;
        pointIndex++;
      });
    });
    
    svg += line(margin.left, margin.top, margin.left, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
    svg += line(margin.left, height - margin.bottom, width - margin.right, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
    
    return svg;
  }
};

// Donut Chart
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

export const donut: ChartRenderer = {
  metadata: {
    name: 'donut',
    detectFields: ['label', 'value']
  },
  render(data: any[], width: number, height: number, options: any = {}) {
    const externallyStyled = options.externallyStyled || false;
    const chartId = options.chartId;
    const cssColors = options.cssColors;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 80;
    const innerRadius = radius * 0.6;
    
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = 0;
    let svg = '';
    
    data.forEach((d, i) => {
      const sliceAngle = (d.value / total) * 360;
      const endAngle = currentAngle + sliceAngle;
      
      const outerStart = polarToCartesian(centerX, centerY, radius, endAngle);
      const outerEnd = polarToCartesian(centerX, centerY, radius, currentAngle);
      const innerStart = polarToCartesian(centerX, centerY, innerRadius, currentAngle);
      const innerEnd = polarToCartesian(centerX, centerY, innerRadius, endAngle);
      const largeArcFlag = sliceAngle > 180 ? "1" : "0";
      
      const pathData = `M ${outerStart.x} ${outerStart.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${outerEnd.x} ${outerEnd.y} L ${innerStart.x} ${innerStart.y} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerEnd.x} ${innerEnd.y} Z`;
      
      const color = getColor(i, cssColors);
      const fill = color || getPattern(i, chartId);
      const linkId = `donut-${chartId}-${i}`;
      const percentage = ((d.value / total) * 100).toFixed(1);
      
      svg += `  <g class="chart-item">\n`;
      svg += path(pathData, fill, 'black', 1, { label: d.label, value: d.value, percentage }, `data-element data-index-${i}`, externallyStyled, linkId);
      svg += createDataLabelGroup(linkId, width / 2, height + 40, { label: d.label, value: d.value, percentage: percentage + '%' }, width);
      svg += `  </g>\n`;
      
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelRadius = radius + 50;
      const labelPos = polarToCartesian(centerX, centerY, labelRadius, labelAngle);
      svg += text(labelPos.x, labelPos.y, d.label, 10, 'middle', 'label', externallyStyled);
      
      currentAngle = endAngle;
    });
    
    return svg;
  }
};

// Heikin-Ashi Chart
function renderCandlestick(x: number, open: number, high: number, low: number, close: number, width: number, yScale: (v: number) => number, isBullish: boolean, date: any, index: number, externallyStyled: boolean, chartId: number, cssColors: any, linkId: string) {
  const y1 = yScale(high);
  const y2 = yScale(low);
  const yOpen = yScale(open);
  const yClose = yScale(close);
  
  const bodyTop = Math.min(yOpen, yClose);
  const bodyHeight = Math.abs(yOpen - yClose);
  const bodyX = x - width / 2;
  
  const dataAttrs = { open, high, low, close, date: date || index };
  const className = `data-element data-index-${index}`;
  
  let svg = '';
  svg += line(x, y1, x, y2, 'black', 1, dataAttrs, className, externallyStyled);
  
  if (isBullish) {
    const color = getColor(0, cssColors);
    const fill = color || getPattern(0, chartId);
    svg += rect(bodyX, bodyTop, width, bodyHeight, fill, 'black', 1, dataAttrs, className, externallyStyled, linkId);
  } else {
    svg += rect(bodyX, bodyTop, width, bodyHeight, 'black', 'black', 1, dataAttrs, className, externallyStyled, linkId);
  }
  
  return svg;
}

export const heikinAshi: ChartRenderer = {
  metadata: {
    name: 'heikin-ashi',
    detectFields: ['open', 'high', 'low', 'close']
  },
  render(data: any[], width: number, height: number, options: any = {}) {
    const externallyStyled = options.externallyStyled || false;
    const chartId = options.chartId;
    const cssColors = options.cssColors;
    const margin = calculateMargins('heikin-ashi', data, options);
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const allHighs = data.map(d => d.high);
    const allLows = data.map(d => d.low);
    const minPrice = Math.min(...allLows);
    const maxPrice = Math.max(...allHighs);
    
    const yScale = createLinearScale([minPrice, maxPrice], [margin.top + chartHeight, margin.top]);
    
    const candleWidth = Math.min(chartWidth / data.length * 0.6, 10);
    const candleSpacing = chartWidth / data.length;
    
    let svg = '';
    
    data.forEach((d, i) => {
      const x = margin.left + i * candleSpacing + candleSpacing / 2;
      const isBullish = d.close >= d.open;
      const linkId = `heikin-${chartId}-${i}`;
      
      svg += `  <g class="chart-item">\n`;
      svg += renderCandlestick(x, d.open, d.high, d.low, d.close, candleWidth, yScale, isBullish, d.date, i, externallyStyled, chartId, cssColors, linkId);
      svg += createDataLabelGroup(linkId, width / 2, height + 40, { date: d.date || i, open: d.open, high: d.high, low: d.low, close: d.close }, width);
      svg += `  </g>\n`;
    });
    
    svg += line(margin.left, margin.top, margin.left, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
    svg += line(margin.left, height - margin.bottom, width - margin.right, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
    
    return svg;
  }
};

// Map Chart - Helper functions
function buildDataAttrs(properties: any, geometry: any, coords?: any) {
  const data: any = { ...properties, 'geometry-type': geometry.type };
  if (coords) {
    data.lon = coords[0];
    data.lat = coords[1];
  }
  return data;
}

function parseIconSvg(iconSvg: string) {
  if (!iconSvg) return null;
  
  const match = iconSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  if (!match) return { content: iconSvg, width: 20, height: 20 };
  
  const content = match[1];
  const svgTag = iconSvg.match(/<svg[^>]*>/i)![0];
  
  const widthMatch = svgTag.match(/width=["']?(\d+(?:\.\d+)?)/i);
  const heightMatch = svgTag.match(/height=["']?(\d+(?:\.\d+)?)/i);
  
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

function embedIcon(iconSvg: string, x: number, y: number, data: any, className: string) {
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

function embedBackgroundSvg(backgroundSvg: string): string {
  if (!backgroundSvg) return '';
  
  const parsed = parseIconSvg(backgroundSvg);
  if (!parsed) return '';
  
  return `  <g class="background">\n    ${parsed.content}\n  </g>\n`;
}

function renderMapGeometry(feature: any, project: any, externallyStyled: boolean, index: any, iconList: any, chartId: number, linkId: string | null): string {
  const type = feature.geometry.type;
  
  if (type === 'Point') {
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
  
  if (type === 'Polygon') {
    const coords = feature.geometry.coordinates;
    let d = '';
    
    coords.forEach((ring: any) => {
      const projected = ring.map((c: any) => project(c));
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
  
  if (type === 'LineString') {
    const coords = feature.geometry.coordinates;
    const projected = coords.map((c: any) => project(c));
    
    if (projected.length < 2) return '';
    
    let d = `M ${projected[0][0]} ${projected[0][1]}`;
    for (let i = 1; i < projected.length; i++) {
      d += ` L ${projected[i][0]} ${projected[i][1]}`;
    }
    
    const data = buildDataAttrs(feature.properties || {}, feature.geometry);
    const className = `data-element data-index-${index}`;
    return path(d, 'none', 'black', 2, data, className, externallyStyled, linkId);
  }
  
  return '';
}

export const map: ChartRenderer = {
  metadata: {
    name: 'map',
    detectFields: ['type', 'features']
  },
  render(data: any, width: number, height: number, options: any = {}) {
    const externallyStyled = options.externallyStyled || false;
    const chartId = options.chartId;
    const iconList = options.iconList;
    const backgroundSvg = options.backgroundSvg;
    
    let nwBounds: [number, number] = [90, -180];
    let seBounds: [number, number] = [-90, 180];
    
    if (options.nwLat !== undefined) nwBounds = [options.nwLat, options.nwLon];
    if (options.seLat !== undefined) seBounds = [options.seLat, options.seLon];
    
    const features = data.features || [];
    const mapHeight = height - 60;
    const project = createProjection(nwBounds, seBounds, width, mapHeight);
    
    let svg = '';
    
    // Render background first
    if (backgroundSvg) {
      svg += embedBackgroundSvg(backgroundSvg);
    }
    
    features.forEach((feature: any, i: number) => {
      const linkId = `map-${chartId}-${i}`;
      svg += `  <g class="chart-item">\n`;
      svg += renderMapGeometry(feature, project, externallyStyled, i, iconList, chartId, linkId);
      const coords = feature.geometry.type === 'Point' ? feature.geometry.coordinates : null;
      const data = buildDataAttrs(feature.properties || {}, feature.geometry, coords);
      svg += createDataLabelGroup(linkId, width / 2, height + 40, data, width);
      svg += `  </g>\n`;
    });
    
    return svg;
  }
};