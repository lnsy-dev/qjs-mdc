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

function describeArc(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

export function render(data, width, height, options = {}) {
  const externallyStyled = options.externallyStyled || false;
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
    
    const outerArc = describeArc(centerX, centerY, radius, currentAngle, endAngle);
    const innerArc = describeArc(centerX, centerY, innerRadius, endAngle, currentAngle);
    
    const pathData = `${outerArc} L ${polarToCartesian(centerX, centerY, innerRadius, endAngle).x} ${polarToCartesian(centerX, centerY, innerRadius, endAngle).y} ${innerArc} Z`;
    
    svg += path(pathData, getPattern(i), 'black', 1, { label: d.label, value: d.value, percentage: ((d.value / total) * 100).toFixed(1) }, `data-element data-index-${i}`, externallyStyled);
    
    const labelAngle = currentAngle + sliceAngle / 2;
    const labelRadius = radius + 15;
    const labelPos = polarToCartesian(centerX, centerY, labelRadius, labelAngle);
    svg += text(labelPos.x, labelPos.y, d.label, 10, 'middle', 'label', externallyStyled);
    
    currentAngle = endAngle;
  });
  
  return svg;
}
