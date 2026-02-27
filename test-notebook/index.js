// Chart interaction handler
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('figure.chart-figure').forEach(function(figure) {
    const svg = figure.querySelector('svg');
    const figcaption = figure.querySelector('figcaption');
    
    if (!svg || !figcaption) return;
    
    // Store default content
    const defaultContent = svg.dataset.name || svg.dataset.description 
      ? formatData({ name: svg.dataset.name, description: svg.dataset.description })
      : '<em>Click on a chart element to see details</em>';
    
    figcaption.innerHTML = defaultContent;
    
    // Add click handlers to data elements
    svg.querySelectorAll('.data-element').forEach(function(elem) {
      elem.style.cursor = 'pointer';
      
      elem.addEventListener('click', function() {
        const data = {};
        Array.from(elem.attributes).forEach(function(attr) {
          if (attr.name.startsWith('data-')) {
            const key = attr.name.replace('data-', '');
            data[key] = attr.value;
          }
        });
        figcaption.innerHTML = formatData(data);
      });
    });
  });
});

function formatData(data) {
  if (!data || Object.keys(data).length === 0) return '';
  
  const parts = [];
  for (const key in data) {
    if (data[key]) {
      parts.push(key + ': <i>' + data[key] + '</i>');
    }
  }
  return parts.join(', ');
}
