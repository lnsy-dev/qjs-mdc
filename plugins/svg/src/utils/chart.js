export function createLinearScale(domain, range) {
  const [dMin, dMax] = domain;
  const [rMin, rMax] = range;
  const scale = (rMax - rMin) / (dMax - dMin);
  return (value) => rMin + (value - dMin) * scale;
}

export function calculateMargins(type, data, options) {
  const defaults = {
    bar: { top: 20, right: 20, bottom: 60, left: 60 },
    line: { top: 20, right: 20, bottom: 40, left: 40 },
    scatter: { top: 20, right: 20, bottom: 40, left: 40 },
    'heikin-ashi': { top: 20, right: 20, bottom: 60, left: 60 },
    donut: { top: 20, right: 20, bottom: 20, left: 20 }
  };
  
  const margin = defaults[type] || { top: 20, right: 20, bottom: 40, left: 40 };
  
  if (type === 'bar' && options.orientation === 'horizontal' && data.length > 0) {
    const maxLabelLength = Math.max(...data.map(d => (d.label || '').length));
    margin.left = Math.max(60, maxLabelLength * 6 + 20);
  }
  
  return margin;
}

export function sanitizeClassName(str) {
  return String(str).replace(/[^a-zA-Z0-9-_]/g, '-');
}

export function groupByCategory(data, categoryField = 'c') {
  const groups = {};
  data.forEach(d => {
    const cat = d[categoryField] || 'default';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(d);
  });
  return groups;
}
