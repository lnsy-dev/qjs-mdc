/**
 * @fileoverview Markdown table processor.
 * Converts pipe-delimited markdown table syntax (inside <p> tags from the markdown parser)
 * into proper HTML <table> elements with optional column alignment.
 */

/**
 * Splits a pipe-delimited table row into cell strings, discarding the outer pipes.
 * @param {string} row - A table row like "| foo | bar |"
 * @returns {string[]} Array of trimmed cell contents
 */
function parseRow(row) {
  return row.split('|').slice(1, -1).map(c => c.trim());
}

/**
 * Derives a CSS text-align style attribute from a GFM separator cell (e.g. ":---", "---:", ":---:").
 * @param {string} cell - Separator cell content
 * @returns {string} Style attribute string, or empty string for default alignment
 */
function alignAttr(cell) {
  const c = cell.trim();
  if (c.startsWith(':') && c.endsWith(':')) return ' style="text-align:center"';
  if (c.endsWith(':')) return ' style="text-align:right"';
  if (c.startsWith(':')) return ' style="text-align:left"';
  return '';
}

/**
 * Processes HTML produced by the markdown parser and converts any pipe-delimited
 * table blocks (wrapped in <p> tags) into proper HTML <table> elements.
 *
 * The markdown parser handles inline elements (bold, code, links) inside cells
 * before this function runs, so cell content may already contain HTML tags.
 *
 * @param {string} html - HTML content containing markdown table remnants
 * @returns {string} HTML with tables rendered as <table> elements
 */
export function processTables(html) {
  return html.replace(/<p>(\|[\s\S]*?)<\/p>/g, (match, tableContent) => {
    const lines = tableContent.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // Need at least a header row and a separator row
    if (lines.length < 2) return match;

    // Every line must be a pipe-delimited row
    if (!lines.every(l => l.startsWith('|'))) return match;

    // Second line must be a GFM separator: |---|---| (with optional colons and spaces)
    if (!/^\|[\s\-:\s|]+\|$/.test(lines[1])) return match;

    const headerCells = parseRow(lines[0]);
    const separatorCells = parseRow(lines[1]);
    const alignments = separatorCells.map(alignAttr);
    const dataRows = lines.slice(2);

    let out = '<table>\n<thead>\n<tr>';
    headerCells.forEach((cell, i) => {
      out += `<th${alignments[i]}>${cell}</th>`;
    });
    out += '</tr>\n</thead>\n';

    if (dataRows.length > 0) {
      out += '<tbody>\n';
      for (const row of dataRows) {
        if (!row.startsWith('|')) continue;
        const cells = parseRow(row);
        out += '<tr>';
        cells.forEach((cell, i) => {
          out += `<td${alignments[i]}>${cell}</td>`;
        });
        out += '</tr>\n';
      }
      out += '</tbody>\n';
    }

    out += '</table>';
    return out;
  });
}
