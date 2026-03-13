/**
 * Processes Markdown-style footnotes.
 *
 * Definition syntax (any line):
 *   [^label]: Footnote text here.
 *
 * Inline reference syntax:
 *   Some claim.[^label]
 *
 * Returns an object:
 *   { content: string, footnotesHtml: string }
 *
 * Footnote definitions are stripped from the content, inline references are
 * replaced with superscript links, and footnotesHtml contains a ready-to-append
 * <section> element (empty string if no footnotes are present).
 */
export function processFootnotes(content) {
  const defs = {};
  const lines = content.split('\n');
  const outputLines = [];

  for (const line of lines) {
    const match = line.match(/^\[\^([^\]]+)\]:\s+(.+)$/);
    if (match) {
      defs[match[1]] = match[2].trim();
    } else {
      outputLines.push(line);
    }
  }

  if (Object.keys(defs).length === 0) {
    return { content, footnotesHtml: '' };
  }

  const order = [];
  let processed = outputLines.join('\n');

  processed = processed.replace(/\[\^([^\]]+)\]/g, (match, label) => {
    if (!defs[label]) return match;
    if (!order.includes(label)) order.push(label);
    const num = order.indexOf(label) + 1;
    return `<sup><a href="#fn-${label}" id="fnref-${label}" class="footnote-ref">${num}</a></sup>`;
  });

  if (order.length === 0) {
    return { content: processed, footnotesHtml: '' };
  }

  const items = order.map((label) => {
    // Strip [[wikilink]] syntax from footnote text — wikilinks are not processed
    // in the footnotes section (it is appended after wikilink processing).
    // Standard markdown links [text](url) and bare URLs are left intact.
    const text = defs[label].replace(/\[\[([^\]]+)\]\]/g, '$1');
    return `<li id="fn-${label}">${text} <a href="#fnref-${label}" class="footnote-back" aria-label="Back to reference">&#8617;</a></li>`;
  }).join('\n');

  const footnotesHtml = `<section class="footnotes" aria-label="Footnotes"><hr><ol>\n${items}\n</ol></section>`;

  return { content: processed, footnotesHtml };
}
