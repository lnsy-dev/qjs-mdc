/**
 * @fileoverview URL auto-linker for HTML content.
 * Wraps bare `http://` and `https://` URLs in clickable anchor tags.
 */

/**
 * Wraps bare `http://` and `https://` URLs that are not already inside an
 * HTML attribute value with `<a href="…">` anchor tags. Detects existing
 * attribute context by inspecting the 100 characters preceding each match.
 * @param {string} html - HTML string that may contain bare URLs
 * @returns {string} HTML with bare URLs wrapped in `<a href="…">…</a>` tags
 */
export function makeUrlsClickable(html) {
  const urlRegex = /(https?:\/\/[^\s<"]+)/g;

  return html.replace(urlRegex, (match, _url, offset) => {
    const before = html.substring(Math.max(0, offset - 100), offset);
    // Skip URLs inside any HTML attribute value (xmlns=", href=", src=", etc.)
    if (/=["'][^"']*$/.test(before)) {
      return match;
    }
    const safe = match.replace(/&/g, '&amp;').replace(/>/g, '&gt;');
    return `<a href="${safe}">${safe}</a>`;
  });
}
