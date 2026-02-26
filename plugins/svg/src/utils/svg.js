export function escapeXML(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function createSVGContainer(width, height, name, description) {
  let attrs = `xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"`;
  if (name) attrs += ` data-name="${escapeXML(name)}"`;
  if (description) attrs += ` data-description="${escapeXML(description)}"`;
  return `<svg ${attrs}>\n`;
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

export function rect(x, y, width, height, fill, stroke = 'black', strokeWidth = 1, data = null, className = null, externallyStyled = false) {
  const fillAttr = externallyStyled ? '' : ` fill="${fill}"`;
  const strokeAttr = externallyStyled ? '' : ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
  return `  <rect x="${x}" y="${y}" width="${width}" height="${height}"${fillAttr}${strokeAttr}${classAttr(className)}${dataAttrs(data)}/>\n`;
}

export function circle(cx, cy, r, fill, stroke = 'black', strokeWidth = 1, data = null, className = null, externallyStyled = false) {
  const fillAttr = externallyStyled ? '' : ` fill="${fill}"`;
  const strokeAttr = externallyStyled ? '' : ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
  return `  <circle cx="${cx}" cy="${cy}" r="${r}"${fillAttr}${strokeAttr}${classAttr(className)}${dataAttrs(data)}/>\n`;
}

export function line(x1, y1, x2, y2, stroke = 'black', strokeWidth = 1, data = null, className = null, externallyStyled = false) {
  const strokeAttr = externallyStyled ? '' : ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
  return `  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${strokeAttr}${classAttr(className)}${dataAttrs(data)}/>\n`;
}

export function path(d, fill = 'none', stroke = 'black', strokeWidth = 2, data = null, className = null, externallyStyled = false) {
  const fillAttr = externallyStyled ? '' : ` fill="${fill}"`;
  const strokeAttr = externallyStyled ? '' : ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
  return `  <path d="${d}"${fillAttr}${strokeAttr}${classAttr(className)}${dataAttrs(data)}/>\n`;
}

export function text(x, y, content, fontSize = 12, anchor = 'middle', className = null, externallyStyled = false) {
  const fillAttr = externallyStyled ? '' : ` fill="black"`;
  return `  <text x="${x}" y="${y}" font-size="${fontSize}" text-anchor="${anchor}"${fillAttr}${classAttr(className)}>${escapeXML(content)}</text>\n`;
}
