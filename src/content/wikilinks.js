/**
 * @fileoverview Wikilink processor for Markdown content.
 * Converts `[[Page Title]]` syntax into standard HTML anchor tags.
 */

/**
 * Replaces all `[[Page Title]]` wikilink occurrences with HTML anchor tags.
 * The page title is lowercased and spaces are replaced with hyphens to form
 * the `href` (e.g. `[[My Page]]` → `<a href="my-page.html">My Page</a>`).
 * @param {string} content - Markdown or HTML string that may contain wikilinks
 * @returns {string} String with all wikilinks replaced by `<a>` elements
 */
export function processWikilinks(content) {
  return content.replace(/\[\[([^\]]+)\]\]/g, (match, text) => {
    const filename = text.toLowerCase().replace(/\s+/g, '-') + '.html';
    return `<a href="${filename}">${text}</a>`;
  });
}
