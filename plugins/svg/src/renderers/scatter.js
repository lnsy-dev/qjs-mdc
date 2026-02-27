import { circle, line } from '../utils/svg.js';
import { getPattern } from '../utils/patterns.js';
import { createLinearScale, calculateMargins, sanitizeClassName, groupByCategory } from '../utils/chart.js';

export const metadata = {
  name: 'scatter',
  detectFields: ['x', 'y']
};

export function render(data, width, height, options = {}) {
  const externallyStyled = options.externallyStyled || false;
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
  
  catList.forEach((cat, catIndex) => {
    categories[cat].forEach(d => {
      const r = d.r || 5;
      svg += circle(xScale(d.x), yScale(d.y), r, getPattern(catIndex, chartId), 'black', 1, { x: d.x, y: d.y, c: d.c || 'default', r }, `data-element data-category-${sanitizeClassName(cat)}`, externallyStyled);
    });
  });
  
  svg += line(margin.left, margin.top, margin.left, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
  svg += line(margin.left, height - margin.bottom, width - margin.right, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
  
  return svg;
}
