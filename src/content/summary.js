import { parse as parseMarkdown } from '../../lib/markdown.js';

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
