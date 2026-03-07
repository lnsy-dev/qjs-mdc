/**
 * @fileoverview Content processing utilities for markdown transformation.
 * Handles wikilinks, abbreviations, URL linking, code highlighting, and summary extraction.
 */

import { parse as parseMarkdown } from '../../lib/markdown.js';

/**
 * Processes wikilink syntax [[link text]] by converting to HTML links.
 * @param {string} content - Markdown content with wikilinks
 * @returns {string} Content with wikilinks converted to anchor tags
 */
export function processWikilinks(content) {
  return content.replace(/\[\[([^\]]+)\]\]/g, (match, text) => {
    const filename = text.toLowerCase().replace(/\s+/g, '-') + '.html';
    return `<a href="${filename}">${text}</a>`;
  });
}

/**
 * Converts plain URLs in HTML to clickable links.
 * @param {string} html - HTML content
 * @returns {string} HTML with URLs converted to anchor tags
 */
export function makeUrlsClickable(html) {
  const urlRegex = /(https?:\/\/[^\s<"]+)/g;
  
  return html.replace(urlRegex, (match, _url, offset) => {
    const before = html.substring(Math.max(0, offset - 100), offset);
    // Skip URLs inside any HTML attribute value (xmlns=", href=", src=", etc.)
    if (/=["'][^"']*$/.test(before)) {
      return match;
    }
    return `<a href="${match}">${match}</a>`;
  });
}

/**
 * Processes abbreviation definitions and replaces terms with <abbr> tags.
 * Definitions use syntax: *[TERM]: Expansion
 * @param {string} content - Markdown content with abbreviation definitions
 * @returns {string} Content with abbreviations processed and definitions removed
 */
export function processAbbreviations(content) {
  const abbrs = {};
  const lines = content.split('\n');
  const outputLines = [];
  
  // First pass: collect abbreviations
  for (const line of lines) {
    const match = line.match(/^\*\[([^\]]+)\]:\s+(.+)$/);
    if (match) {
      abbrs[match[1]] = match[2].trim();
    } else {
      outputLines.push(line);
    }
  }
  
  // Second pass: replace abbreviations in content
  let result = outputLines.join('\n');
  
  if (Object.keys(abbrs).length > 0) {
    const terms = Object.keys(abbrs).sort((a, b) => b.length - a.length);
    
    for (const term of terms) {
      const title = abbrs[term];
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b(${escapedTerm})\\b`, 'g');
      result = result.replace(regex, `<abbr title="${title}">$1</abbr>`);
    }
  }
  
  return result;
}

/**
 * Highlights code blocks with syntax-specific styling.
 * Supports: js, py, rs (JavaScript, Python, Rust)
 * @param {string} html - HTML with code blocks
 * @returns {string} HTML with highlighted code blocks
 */
export function highlightCode(html) {
  return html.replace(/<pre class="code" data-lang="([^"]*)">\s*<code>([\s\S]*?)<\/code>\s*<\/pre>/g, (match, lang, code) => {
    if (!lang) return match;
    
    let highlighted = code;
    
    if (lang === 'js' || lang === 'javascript') {
      highlighted = code
        .replace(/\b(function|const|let|var|return|if|else|for|while|class|import|export|from|async|await|new|this|try|catch|throw)\b/g, '<kw>$1</kw>')
        .replace(/\b(true|false|null|undefined)\b/g, '<lit>$1</lit>')
        .replace(/(\/\/.*$)/gm, '<cmt>$1</cmt>')
        .replace(/('([^'\\]|\\.)*'|"([^"\\]|\\.)*"|`([^`\\]|\\.)*`)/g, '<str>$1</str>')
        .replace(/<kw>/g, '<span class="keyword">')
        .replace(/<\/kw>/g, '</span>')
        .replace(/<lit>/g, '<span class="literal">')
        .replace(/<\/lit>/g, '</span>')
        .replace(/<cmt>/g, '<span class="comment">')
        .replace(/<\/cmt>/g, '</span>')
        .replace(/<str>/g, '<span class="string">')
        .replace(/<\/str>/g, '</span>');
    } else if (lang === 'py' || lang === 'python') {
      highlighted = code
        .replace(/\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield|async|await|pass|break|continue)\b/g, '<kw>$1</kw>')
        .replace(/\b(True|False|None)\b/g, '<lit>$1</lit>')
        .replace(/(#.*$)/gm, '<cmt>$1</cmt>')
        .replace(/('([^'\\]|\\.)*'|"([^"\\]|\\.)*")/g, '<str>$1</str>')
        .replace(/<kw>/g, '<span class="keyword">')
        .replace(/<\/kw>/g, '</span>')
        .replace(/<lit>/g, '<span class="literal">')
        .replace(/<\/lit>/g, '</span>')
        .replace(/<cmt>/g, '<span class="comment">')
        .replace(/<\/cmt>/g, '</span>')
        .replace(/<str>/g, '<span class="string">')
        .replace(/<\/str>/g, '</span>');
    } else if (lang === 'rs' || lang === 'rust') {
      highlighted = code
        .replace(/\b(fn|let|mut|const|if|else|match|for|while|loop|return|impl|trait|struct|enum|use|pub|mod)\b/g, '<kw>$1</kw>')
        .replace(/\b(true|false|None|Some)\b/g, '<lit>$1</lit>')
        .replace(/(\/\/.*$)/gm, '<cmt>$1</cmt>')
        .replace(/('([^'\\]|\\.)*'|"([^"\\]|\\.)*")/g, '<str>$1</str>')
        .replace(/<kw>/g, '<span class="keyword">')
        .replace(/<\/kw>/g, '</span>')
        .replace(/<lit>/g, '<span class="literal">')
        .replace(/<\/lit>/g, '</span>')
        .replace(/<cmt>/g, '<span class="comment">')
        .replace(/<\/cmt>/g, '</span>')
        .replace(/<str>/g, '<span class="string">')
        .replace(/<\/str>/g, '</span>');
    }
    
    return `<pre class="code language-${lang}"><code>${highlighted}</code></pre>`;
  });
}

/**
 * Extracts a summary from a file's content or uses custom summary from front matter.
 * @param {Object} file - File object with data and content properties
 * @returns {string} Summary text (max 200 chars)
 */
export function extractSummary(file) {
  let raw = '';

  if (file.data.summary) {
    raw = file.data.summary;
  } else {
    const paragraphs = file.content.split(/\n\n+/);
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
