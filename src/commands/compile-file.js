/**
 * @fileoverview compile-file command: compiles a single markdown file to a
 * self-contained HTML document. YAML front matter drives <head> metadata.
 *
 * Usage:
 *   mdc compile-file <source.md> --output <output.html>
 *
 * Front matter fields recognised:
 *   title       → <title> and og:title
 *   description → <meta name="description"> and og:description
 *   author      → <meta name="author">
 *   tags        → <meta name="keywords"> (array or comma-separated string)
 *   date        → <meta name="date">
 *   lang        → <html lang="…"> (defaults to "en")
 *   canonical   → <link rel="canonical" …>
 *   image       → <meta property="og:image" …>
 */

import { parse as parseMarkdown } from '../../lib/markdown.js';
import { parseMatterFromFile } from '../../lib/md-yaml.js';
import { writeFile } from '../utils/file-ops.js';
import {
  processAbbreviations,
  processWikilinks,
  processFootnotes,
  highlightCode,
  makeUrlsClickable,
} from '../content/processor.js';
import { processTables } from '../../plugins/tables.js';
import { normalizeTagArray } from '../utils/filename.js';
import { formatPrettyDate } from '../utils/date-format.js';

// ---------------------------------------------------------------------------
// Default CSS — clean, readable, responsive prose
// ---------------------------------------------------------------------------
const DEFAULT_CSS = `
*, *::before, *::after { box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 1.0625rem;
  line-height: 1.7;
  color: #1a1a1a;
  background: #fff;
  margin: 0;
  padding: 2rem 1rem;
}

article {
  max-width: 720px;
  margin: 0 auto;
}

h1, h2, h3, h4, h5, h6 {
  line-height: 1.25;
  margin-top: 2em;
  margin-bottom: 0.5em;
  font-weight: 700;
}

h1 { font-size: 2rem; margin-top: 0; }
h2 { font-size: 1.5rem; }
h3 { font-size: 1.25rem; }

p { margin: 1em 0; }

a { color: #0066cc; }
a:hover { color: #004499; }

code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.875em;
  background: #f3f4f6;
  border-radius: 3px;
  padding: 0.15em 0.35em;
}

pre {
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: 6px;
  padding: 1.25rem;
  overflow-x: auto;
  font-size: 0.875em;
  line-height: 1.55;
}

pre code {
  background: none;
  padding: 0;
  font-size: inherit;
  color: inherit;
}

blockquote {
  margin: 1.5em 0;
  padding: 0.75em 1.25em;
  border-left: 4px solid #d1d5db;
  color: #4b5563;
  background: #f9fafb;
  border-radius: 0 4px 4px 0;
}

blockquote p { margin: 0; }

table {
  border-collapse: collapse;
  width: 100%;
  margin: 1.5em 0;
  font-size: 0.9375em;
}

th, td {
  border: 1px solid #e5e7eb;
  padding: 0.5rem 0.75rem;
  text-align: left;
}

th { background: #f3f4f6; font-weight: 600; }
tr:nth-child(even) { background: #f9fafb; }

img { max-width: 100%; height: auto; border-radius: 4px; }

hr {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 2em 0;
}

abbr[title] { text-decoration: underline dotted; cursor: help; }

.footnotes { font-size: 0.875em; color: #4b5563; margin-top: 3em; border-top: 1px solid #e5e7eb; padding-top: 1em; }
.footnote-ref { font-size: 0.75em; vertical-align: super; }

@media (max-width: 600px) {
  body { font-size: 1rem; }
  h1 { font-size: 1.6rem; }
}
`.trim();

// ---------------------------------------------------------------------------
// HTML template — variables substituted at runtime
// ---------------------------------------------------------------------------
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="{{lang}}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
{{head_meta}}  <style>
{{css}}
  </style>
</head>
<body>
  <article>
{{content}}
  </article>
</body>
</html>`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function metaTag(name, content, attr = 'name') {
  if (!content) return '';
  return `  <meta ${attr}="${esc(name)}" content="${esc(content)}">\n`;
}

function buildHeadMeta(data) {
  const tags = [];

  if (data.description) {
    tags.push(metaTag('description', data.description));
  }
  if (data.author) {
    tags.push(metaTag('author', data.author));
  }

  const tagArr = normalizeTagArray(data.tags);
  if (tagArr.length) {
    tags.push(metaTag('keywords', tagArr.join(', ')));
  }

  if (data.date) {
    tags.push(metaTag('date', String(data.date)));
  }

  // Open Graph
  if (data.title) {
    tags.push(metaTag('og:title', data.title, 'property'));
  }
  if (data.description) {
    tags.push(metaTag('og:description', data.description, 'property'));
  }
  if (data.image) {
    tags.push(metaTag('og:image', data.image, 'property'));
  }

  if (data.canonical) {
    tags.push(`  <link rel="canonical" href="${esc(data.canonical)}">\n`);
  }

  return tags.join('');
}

function resolveOutputPath(inputPath, outputArg) {
  if (outputArg) return outputArg;
  // Strip .md extension and replace with .html
  return inputPath.replace(/\.md$/i, '') + '.html';
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function compileFile(inputPath, outputPath) {
  const parsed = parseMatterFromFile(inputPath);
  const data = parsed.data || {};

  // Determine source directory for image embedding
  const sourceDir = inputPath.replace(/\/[^/]+$/, '') || '.';

  const { content: footnoteContent, footnotesHtml } = processFootnotes(parsed.content);
  let processed = processAbbreviations(footnoteContent);
  processed = processWikilinks(processed);

  const contentHtml = parseMarkdown(processed) + footnotesHtml;
  const tablesHtml = processTables(contentHtml);
  const highlightedHtml = highlightCode(tablesHtml);
  const linkedHtml = makeUrlsClickable(highlightedHtml);

  const title = data.title || 'Untitled';
  const lang = data.lang || 'en';
  const headMeta = buildHeadMeta(data);

  const indentedContent = linkedHtml
    .split('\n')
    .map(line => '    ' + line)
    .join('\n');

  let html = HTML_TEMPLATE
    .replace('{{lang}}', esc(lang))
    .replace('{{title}}', esc(title))
    .replace('{{head_meta}}', headMeta)
    .replace('{{css}}', DEFAULT_CSS.split('\n').map(l => '    ' + l).join('\n'))
    .replace('{{content}}', indentedContent);

  const out = resolveOutputPath(inputPath, outputPath);
  writeFile(out, html);
  console.log('✓', out);
}
