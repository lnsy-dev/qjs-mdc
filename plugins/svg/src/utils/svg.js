export function escapeXML(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function createSVGContainer(width, height, name, description) {
  let attrs = `xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 ${width} ${height}" role="img"`;
  
  if (name) {
    attrs += ` aria-labelledby="chart-title"`;
    if (description) attrs += ` aria-describedby="chart-desc"`;
  } else if (description) {
    attrs += ` aria-label="${escapeXML(description)}"`;
  }
  
  let svg = `<svg ${attrs}>\n`;
  
  if (name) {
    svg += `  <title id="chart-title">${escapeXML(name)}</title>\n`;
  }
  if (description) {
    svg += `  <desc id="chart-desc">${escapeXML(description)}</desc>\n`;
  }
  
  return svg;
}

export function closeSVGContainer() {
  return '</svg>';
}

function dataAttrs(data) {
  if (!data) return '';
  return ' ' + Object.keys(data).map(k => `data-${k}="${escapeXML(data[k])}"`).join(' ');
}

function classAttr(className) {
  if (!className) return '';
  return ` class="${className}"`;
}

function ariaLabel(data) {
  if (!data) return '';
  const parts = Object.entries(data).map(([k, v]) => `${k}: ${v}`);
  return ` aria-label="${escapeXML(parts.join(', '))}"`;
}

export function rect(x, y, width, height, fill, stroke = 'black', strokeWidth = 1, data = null, className = null, externallyStyled = false) {
  const strokeAttr = externallyStyled ? '' : ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
  return `  <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"${strokeAttr}${classAttr(className)}${dataAttrs(data)}${ariaLabel(data)}/>\n`;
}

export function circle(cx, cy, r, fill, stroke = 'black', strokeWidth = 1, data = null, className = null, externallyStyled = false) {
  const strokeAttr = externallyStyled ? '' : ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
  return `  <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${strokeAttr}${classAttr(className)}${dataAttrs(data)}${ariaLabel(data)}/>\n`;
}

export function line(x1, y1, x2, y2, stroke = 'black', strokeWidth = 1, data = null, className = null, externallyStyled = false) {
  const strokeAttr = externallyStyled ? '' : ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
  const label = data ? ariaLabel(data) : '';
  return `  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${strokeAttr}${classAttr(className)}${dataAttrs(data)}${label}/>\n`;
}

export function path(d, fill = 'none', stroke = 'black', strokeWidth = 2, data = null, className = null, externallyStyled = false) {
  const strokeAttr = externallyStyled ? '' : ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
  const label = data ? ariaLabel(data) : '';
  return `  <path d="${d}" fill="${fill}"${strokeAttr}${classAttr(className)}${dataAttrs(data)}${label}/>\n`;
}

export function text(x, y, content, fontSize = 12, anchor = 'middle', className = null, externallyStyled = false, rotation = null) {
  const fillAttr = externallyStyled ? '' : ` fill="black"`;
  const transformAttr = rotation != null ? ` transform="rotate(${rotation}, ${x}, ${y})"` : '';
  return `  <text x="${x}" y="${y}" font-size="${fontSize}" text-anchor="${anchor}"${fillAttr}${classAttr(className)}${transformAttr}>${escapeXML(content)}</text>\n`;
}
