/**
 * @fileoverview Donut (ring) chart renderer for the SVG chart system.
 * Renders each data row as an arc slice of an annulus, with percentage labels
 * positioned outside the ring. Interactive data-label popups are attached to
 * each slice.
 */

import { path, text, createDataLabelGroup } from '../utils/svg.js';
import { getPattern, getColor } from '../utils/patterns.js';

/**
 * Renderer metadata used by the chart type auto-detection registry.
 * @type {{ name: string, detectFields: string[] }}
 */
export const metadata = {
  name: 'donut',
  detectFields: ['label', 'value']
};

/**
 * Converts polar coordinates (angle in degrees, measured clockwise from the
 * top) to Cartesian SVG coordinates relative to a given centre point.
 * @param {number} centerX - X coordinate of the circle centre
 * @param {number} centerY - Y coordinate of the circle centre
 * @param {number} radius - Circle radius in pixels
 * @param {number} angleInDegrees - Angle in degrees, 0 = top, clockwise
 * @returns {{ x: number, y: number }} Cartesian point on the circle
 */
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

/**
 * Renders a donut (ring) chart as an SVG string.
 * @param {Array<{ label: string, value: number }>} data - Data rows; each row
 *   must have a `label` and a positive numeric `value`
 * @param {number} width - Total SVG canvas width in pixels
 * @param {number} height - Total SVG canvas height in pixels
 * @param {Object} [options={}] - Rendering options
 * @param {boolean} [options.externallyStyled=false] - Omit inline style attrs
 * @param {string} [options.chartId] - Unique ID prefix for element IDs
 * @param {string[]} [options.cssColors] - CSS custom property declarations for
 *   theme colors applied per slice
 * @returns {string} SVG fragment string (no outer `<svg>` wrapper)
 */
export function render(data, width, height, options = {}) {
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
