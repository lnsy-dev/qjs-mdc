/**
 * @fileoverview Heikin-Ashi candlestick chart renderer for the SVG chart system.
 * Renders OHLC (open/high/low/close) financial data as candlesticks. Bullish
 * candles (close ≥ open) are filled with the first theme color; bearish candles
 * are filled solid black. A wick line spans the full high-to-low range. X-axis
 * date labels are sampled to avoid overlap based on estimated label width.
 * A bullish/bearish legend is rendered in the top-left corner.
 */

import { rect, line, text, createDataLabelGroup } from '../utils/svg.js';
import { getPattern, getColor } from '../utils/patterns.js';
import { createLinearScale, calculateMargins } from '../utils/chart.js';

/**
 * Renderer metadata used by the chart type auto-detection registry.
 * @type {{ name: string, detectFields: string[] }}
 */
export const metadata = {
  name: 'heikin-ashi',
  detectFields: ['open', 'high', 'low', 'close']
};

/**
 * Renders a single candlestick (wick + body rectangle) as an SVG fragment.
 * @param {number} x - Horizontal centre position of the candle
 * @param {number} open - Open price
 * @param {number} high - High price (top of wick)
 * @param {number} low - Low price (bottom of wick)
 * @param {number} close - Close price
 * @param {number} width - Candle body width in pixels
 * @param {function(number): number} yScale - Linear scale mapping price → SVG Y
 * @param {boolean} isBullish - `true` if close ≥ open (bullish; colored fill)
 * @param {string|number} date - Date label attached as a data attribute
 * @param {number} index - Data index, used for CSS class and element ID
 * @param {boolean} externallyStyled - Omit inline style attrs when `true`
 * @param {string} chartId - Unique chart ID prefix
 * @param {string[]} cssColors - CSS custom property declarations for theme colors
 * @param {string} linkId - Element ID linking the body to its data-label popup
 * @returns {string} SVG fragment for the wick line and body rectangle
 */
function renderCandlestick(x, open, high, low, close, width, yScale, isBullish, date, index, externallyStyled, chartId, cssColors, linkId) {
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

/**
 * Renders a Heikin-Ashi candlestick chart as an SVG string.
 * @param {Array<{ open: number, high: number, low: number, close: number, date?: string }>} data
 *   - OHLC data rows in chronological order; `date` is an optional label shown
 *   on the X axis
 * @param {number} width - Total SVG canvas width in pixels
 * @param {number} height - Total SVG canvas height in pixels
 * @param {Object} [options={}] - Rendering options
 * @param {boolean} [options.externallyStyled=false] - Omit inline style attrs
 * @param {string} [options.chartId] - Unique ID prefix for element IDs
 * @param {string[]} [options.cssColors] - CSS custom property declarations for
 *   the bullish candle fill color
 * @returns {string} SVG fragment string (no outer `<svg>` wrapper)
 */
export function render(data, width, height, options = {}) {
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
  
  // Axis labels
  svg += text(10, margin.top + chartHeight / 2, 'Price', 10, 'middle', 'axis-label', externallyStyled, -90);
  
  // Legend
  const legendX = margin.left + 10;
  const legendY = margin.top + 10;
  const color = getColor(0, cssColors);
  const fill = color || getPattern(0, chartId);
  svg += rect(legendX, legendY, 12, 12, fill, 'black', 1, null, 'legend', externallyStyled);
  svg += text(legendX + 18, legendY + 9, 'Bullish', 9, 'start', 'legend', externallyStyled);
  svg += rect(legendX, legendY + 20, 12, 12, 'black', 'black', 1, null, 'legend', externallyStyled);
  svg += text(legendX + 18, legendY + 29, 'Bearish', 9, 'start', 'legend', externallyStyled);
  
  const maxLabelLen = data.reduce((max, d) => Math.max(max, (d.date || '').length), 4);
  const estLabelWidth = maxLabelLen * 5.5;
  const minLabelSpacing = estLabelWidth * 0.7 + 10;
  const maxLabels = Math.max(1, Math.floor(chartWidth / minLabelSpacing));
  const sampleInterval = Math.max(1, Math.ceil(data.length / maxLabels));
  data.forEach((d, i) => {
    if (i % sampleInterval === 0 || i === data.length - 1) {
      const x = margin.left + i * candleSpacing + candleSpacing / 2;
      const label = d.date || i.toString();
      svg += text(x, height - margin.bottom + 15, label, 9, 'end', 'label', externallyStyled, -45);
    }
  });
  
  return svg;
}
