/**
 * @fileoverview Summary extractor for compiled markdown file objects.
 * Derives a short HTML summary from front matter or the first body paragraph.
 */

import { parse as parseMarkdown } from '../../lib/markdown.js';

/**
 * Extracts a short HTML summary from a parsed file object. Returns the
 * `summary` front matter field (rendered as markdown) if present; otherwise
 * finds the first non-heading, non-code-fence paragraph in the raw content,
 * truncates it to 200 characters, and parses it to HTML. Returns an empty
 * string if no suitable content is found.
 * @param {{ data: Object, content: string }} file - Parsed file object with
 *   `data` (front matter fields) and `content` (raw markdown body)
 * @returns {string} HTML summary string, or empty string if none found
 */
export function extractSummary(file) {
  let raw = '';

  if (file.data?.summary) {
    raw = file.data.summary;
  } else {
    const paragraphs = (file.content ?? '').split(/\n\n+/);
    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
        raw = trimmed.replace(/\n/g, ' ').substring(0, 200);
        break;
      }
    }
  }

  if (!raw) return '';

  const html = parseMarkdown(raw);
  return html.replace(/^<p>([\s\S]*?)<\/p>\s*$/, '$1');
}
