export function escapeXML(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function createSVGContainer(width, height, name, description, captionHeight = 80) {
  const totalHeight = height + captionHeight;
  let attrs = `xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 ${width} ${totalHeight}" role="img"`;
  
  if (name) {
    attrs += ` aria-labelledby="chart-title"`;
    if (description) attrs += ` aria-describedby="chart-desc"`;
  } else if (description) {
    attrs += ` aria-label="${escapeXML(description)}"`;
  }
  
  let svg = `<svg ${attrs}>\n`;
  svg += `  <style>\n`;
  svg += `    .label-group { opacity: 0; pointer-events: none; }\n`;
  svg += `    .chart-item:focus-within .label-group { opacity: 1; }\n`;
  svg += `    text { font-family: inherit; fill: currentColor; }\n`;
  svg += `    a { cursor: pointer; outline: none; }\n`;
  svg += `  </style>\n`;
  
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

export function createDataLabelGroup(id, x, y, data, width = 400) {
  if (!data || Object.keys(data).length === 0) return '';
  
  let svg = `  <g class="label-group" data-for="${id}">\n`;
  const parts = [];
  for (const key in data) {
    if (data[key] !== undefined && data[key] !== null) {
      parts.push(`${key}: ${data[key]}`);
    }
  }
  const text = parts.join(', ');
  svg += `    <text x="${x}" y="${y}" text-anchor="middle" font-size="14" font-weight="bold">${escapeXML(text)}</text>\n`;
  svg += `  </g>\n`;
  return svg;
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

export function rect(x, y, width, height, fill, stroke = 'black', strokeWidth = 1, data = null, className = null, externallyStyled = false, linkId = null) {
  const strokeAttr = externallyStyled ? '' : ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
  const rectEl = `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"${strokeAttr}${classAttr(className)}${dataAttrs(data)}${ariaLabel(data)}/>`;
  if (linkId) {
    return `  <a class="chart-link" data-label="${linkId}" tabindex="0">\n    ${rectEl}\n  </a>\n`;
  }
  return `  ${rectEl}\n`;
}

export function circle(cx, cy, r, fill, stroke = 'black', strokeWidth = 1, data = null, className = null, externallyStyled = false, linkId = null) {
  const strokeAttr = externallyStyled ? '' : ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
  const circleEl = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${strokeAttr}${classAttr(className)}${dataAttrs(data)}${ariaLabel(data)}/>`;
  if (linkId) {
    return `  <a class="chart-link" data-label="${linkId}" tabindex="0">\n    ${circleEl}\n  </a>\n`;
  }
  return `  ${circleEl}\n`;
}

export function line(x1, y1, x2, y2, stroke = 'black', strokeWidth = 1, data = null, className = null, externallyStyled = false) {
  const strokeAttr = externallyStyled ? '' : ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
  const label = data ? ariaLabel(data) : '';
  return `  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${strokeAttr}${classAttr(className)}${dataAttrs(data)}${label}/>\n`;
}

export function path(d, fill = 'none', stroke = 'black', strokeWidth = 2, data = null, className = null, externallyStyled = false, linkId = null) {
  const strokeAttr = externallyStyled ? '' : ` stroke="${stroke}" stroke-width="${strokeWidth}"`;
  const label = data ? ariaLabel(data) : '';
  const pathEl = `<path d="${d}" fill="${fill}"${strokeAttr}${classAttr(className)}${dataAttrs(data)}${label}/>`;
  if (linkId) {
    return `  <a class="chart-link" data-label="${linkId}" tabindex="0">\n    ${pathEl}\n  </a>\n`;
  }
  return `  ${pathEl}\n`;
}

export function text(x, y, content, fontSize = 12, anchor = 'middle', className = null, externallyStyled = false, rotation = null) {
  const fillAttr = externallyStyled ? '' : ` fill="black"`;
  const fontSizeAttr = externallyStyled ? '' : ` font-size="${fontSize}"`;
  const transformAttr = rotation != null ? ` transform="rotate(${rotation}, ${x}, ${y})"` : '';
  return `  <text x="${x}" y="${y}"${fontSizeAttr} text-anchor="${anchor}"${fillAttr}${classAttr(className)}${transformAttr}>${escapeXML(content)}</text>\n`;
}
