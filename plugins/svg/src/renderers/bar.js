/**
 * @fileoverview Bar chart renderer for the SVG chart system.
 * Supports both vertical (default) and horizontal orientations.
 * Each bar is coloured by index from the CSS color palette or the SVG pattern
 * library, and is wrapped in an interactive `<g class="chart-item">` element
 * with a linked data-label popup.
 */

import { rect, line, text, createDataLabelGroup } from '../utils/svg.js';
import { getPattern, getColor } from '../utils/patterns.js';
import { calculateMargins } from '../utils/chart.js';

/**
 * Renderer metadata used by the chart type auto-detection registry.
 * @type {{ name: string, detectFields: string[] }}
 */
export const metadata = {
  name: 'bar',
  detectFields: ['label', 'value']
};

/**
 * Renders a bar chart as an SVG string.
 * @param {Array<{ label: string, value: number }>} data - Data rows; each row
 *   must have a `label` and a numeric `value`
 * @param {number} width - Total SVG canvas width in pixels
 * @param {number} height - Total SVG canvas height in pixels
 * @param {Object} [options={}] - Rendering options
 * @param {string} [options.orientation='vertical'] - `'vertical'` or `'horizontal'`
 * @param {boolean} [options.externallyStyled=false] - Omit inline style attrs
 *   when `true` (CSS classes are still applied for external stylesheet control)
 * @param {string} [options.chartId] - Unique ID prefix for generated element IDs
 * @param {string[]} [options.cssColors] - CSS custom property declarations used
 *   to extract theme colors for bar fills
 * @returns {string} SVG fragment string (no outer `<svg>` wrapper)
 */
export function render(data, width, height, options = {}) {
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
