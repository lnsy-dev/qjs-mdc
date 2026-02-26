import { circle, line } from '../utils/svg.js';
import { getPattern } from '../utils/patterns.js';

export const metadata = {
  name: 'scatter',
  detectFields: ['x', 'y']
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
  let svg = '';
  
  const sanitize = (str) => String(str).replace(/[^a-zA-Z0-9-_]/g, '-');
  
  catList.forEach((cat, catIndex) => {
    categories[cat].forEach(d => {
      const r = d.r || 5;
      svg += circle(xScale(d.x), yScale(d.y), r, getPattern(catIndex), 'black', 1, { x: d.x, y: d.y, c: d.c || 'default', r }, `data-element data-category-${sanitize(cat)}`, externallyStyled);
    });
  });
  
  svg += line(margin.left, margin.top, margin.left, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
  svg += line(margin.left, height - margin.bottom, width - margin.right, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
  
  return svg;
}
