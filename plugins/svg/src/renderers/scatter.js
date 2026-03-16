/**
 * @fileoverview Scatter plot renderer for the SVG chart system.
 * Plots one circle per data point, coloured by category (`c` field) using
 * the CSS color palette or the SVG pattern library. X and Y axis lines and
 * axis labels are drawn automatically. Interactive data-label popups are
 * attached to each point.
 */

import { circle, line, text, createDataLabelGroup } from '../utils/svg.js';
import { getPattern, getColor } from '../utils/patterns.js';
import { createLinearScale, calculateMargins, sanitizeClassName, groupByCategory } from '../utils/chart.js';

/**
 * Renderer metadata used by the chart type auto-detection registry.
 * @type {{ name: string, detectFields: string[] }}
 */
export const metadata = {
  name: 'scatter',
  detectFields: ['x', 'y']
};

/**
 * Renders a scatter plot as an SVG string.
 * @param {Array<{ x: number, y: number, c?: string, r?: number }>} data - Data
 *   rows; `x` and `y` are required numeric coordinates, `c` is an optional
 *   category name used to assign fill colors, `r` is an optional point radius
 *   (defaults to 5)
 * @param {number} width - Total SVG canvas width in pixels
 * @param {number} height - Total SVG canvas height in pixels
 * @param {Object} [options={}] - Rendering options
 * @param {boolean} [options.externallyStyled=false] - Omit inline style attrs
 * @param {string} [options.chartId] - Unique ID prefix for element IDs
 * @param {string[]} [options.cssColors] - CSS custom property declarations for
 *   theme colors applied per category
 * @returns {string} SVG fragment string (no outer `<svg>` wrapper)
 */
export function render(data, width, height, options = {}) {
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
    categories[cat].forEach(d => {
      const r = d.r || 5;
      const color = getColor(catIndex, cssColors);
      const fill = color || getPattern(catIndex, chartId);
      const linkId = `scatter-${chartId}-${pointIndex}`;
      
      svg += `  <g class="chart-item">\n`;
      svg += circle(xScale(d.x), yScale(d.y), r, fill, 'black', 1, { x: d.x, y: d.y, c: d.c || 'default', r }, `data-element data-category-${sanitizeClassName(cat)}`, externallyStyled, linkId);
      svg += createDataLabelGroup(linkId, width / 2, height + 40, { x: d.x, y: d.y, category: cat }, width);
      svg += `  </g>\n`;
      pointIndex++;
    });
  });
  
  svg += line(margin.left, margin.top, margin.left, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
  svg += line(margin.left, height - margin.bottom, width - margin.right, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
  
  svg += text(margin.left + chartWidth / 2, height - 5, 'X', 10, 'middle', 'axis-label', externallyStyled);
  svg += text(10, margin.top + chartHeight / 2, 'Y', 10, 'middle', 'axis-label', externallyStyled, -90);
  
  return svg;
}
