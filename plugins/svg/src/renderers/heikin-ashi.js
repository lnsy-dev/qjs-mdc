import { rect, line, text } from '../utils/svg.js';
import { getPattern } from '../utils/patterns.js';
import { createLinearScale, calculateMargins } from '../utils/chart.js';

export const metadata = {
  name: 'heikin-ashi',
  detectFields: ['open', 'high', 'low', 'close']
};

function renderCandlestick(x, open, high, low, close, width, yScale, isBullish, date, index, externallyStyled, chartId) {
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
    svg += rect(bodyX, bodyTop, width, bodyHeight, getPattern(0, chartId), 'black', 1, dataAttrs, className, externallyStyled);
  } else {
    svg += rect(bodyX, bodyTop, width, bodyHeight, 'black', 'black', 1, dataAttrs, className, externallyStyled);
  }
  
  return svg;
}

export function render(data, width, height, options = {}) {
  const externallyStyled = options.externallyStyled || false;
  const chartId = options.chartId;
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
    svg += renderCandlestick(x, d.open, d.high, d.low, d.close, candleWidth, yScale, isBullish, d.date, i, externallyStyled, chartId);
  });
  
  svg += line(margin.left, margin.top, margin.left, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
  svg += line(margin.left, height - margin.bottom, width - margin.right, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
  
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
