import { circle, line, path } from '../utils/svg.js';
import { getPattern } from '../utils/patterns.js';

export const metadata = {
  name: 'line',
  detectFields: ['x', 'y', 'c']
};

export function render(data, width, height, options = {}) {
  const externallyStyled = options.externallyStyled || false;
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;
  
  const xValues = data.map(d => d.x);
  const yValues = data.map(d => d.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  
  const xScale = (x) => margin.left + ((x - minX) / (maxX - minX)) * chartWidth;
  const yScale = (y) => margin.top + chartHeight - ((y - minY) / (maxY - minY)) * chartHeight;
  
  const categories = {};
  data.forEach(d => {
    const cat = d.c || 'default';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(d);
  });
  
  const catList = Object.keys(categories);
  const chartId = options.chartId;
  let svg = '';
  
  const sanitize = (str) => String(str).replace(/[^a-zA-Z0-9-_]/g, '-');
  
  catList.forEach((cat, catIndex) => {
    const points = categories[cat].sort((a, b) => a.x - b.x);
    
    let pathData = '';
    points.forEach((d, i) => {
      const x = xScale(d.x);
      const y = yScale(d.y);
      pathData += (i === 0 ? `M${x},${y}` : ` L${x},${y}`);
    });
    
    svg += path(pathData, 'none', 'black', 2, { c: cat }, `data-element data-category-${sanitize(cat)}`, externallyStyled);
    
    points.forEach(d => {
      const r = d.r || 4;
      svg += circle(xScale(d.x), yScale(d.y), r, getPattern(catIndex, chartId), 'black', 1, { x: d.x, y: d.y, c: cat, r }, `data-element data-category-${sanitize(cat)}`, externallyStyled);
    });
  });
  
  svg += line(margin.left, margin.top, margin.left, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
  svg += line(margin.left, height - margin.bottom, width - margin.right, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
  
  return svg;
}
