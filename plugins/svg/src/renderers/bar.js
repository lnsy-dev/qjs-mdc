import { rect, line, text } from '../utils/svg.js';
import { getPattern } from '../utils/patterns.js';

export const metadata = {
  name: 'bar',
  detectFields: ['label', 'value']
};

export function render(data, width, height, options = {}) {
  const orientation = options.orientation || 'vertical';
  const externallyStyled = options.externallyStyled || false;
  const margin = { top: 20, right: 20, bottom: 60, left: 60 };
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
      
      svg += rect(x, y, barWidth, barHeight, getPattern(i), 'black', 1, { label: d.label, value: d.value }, `data-element data-index-${i}`, externallyStyled);
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
      
      svg += rect(x, y, barWidth, barHeight, getPattern(i), 'black', 1, { label: d.label, value: d.value }, `data-element data-index-${i}`, externallyStyled);
      svg += text(margin.left - 10, y + barHeight / 2 + 4, d.label, 10, 'end', 'label', externallyStyled);
    });
    
    svg += line(margin.left, margin.top, margin.left, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
    svg += line(margin.left, height - margin.bottom, width - margin.right, height - margin.bottom, 'black', 1, null, 'axis', externallyStyled);
  }
  
  return svg;
}
