import { path, text } from '../utils/svg.js';
import { getPattern } from '../utils/patterns.js';

export const metadata = {
  name: 'donut',
  detectFields: ['label', 'value']
};

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

export function render(data, width, height, options = {}) {
  const externallyStyled = options.externallyStyled || false;
  const chartId = options.chartId;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;
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
    
    svg += path(pathData, getPattern(i, chartId), 'black', 1, { label: d.label, value: d.value, percentage: ((d.value / total) * 100).toFixed(1) }, `data-element data-index-${i}`, externallyStyled);
    
    const labelAngle = currentAngle + sliceAngle / 2;
    const labelRadius = radius + 15;
    const labelPos = polarToCartesian(centerX, centerY, labelRadius, labelAngle);
    svg += text(labelPos.x, labelPos.y, d.label, 10, 'middle', 'label', externallyStyled);
    
    currentAngle = endAngle;
  });
  
  return svg;
}
