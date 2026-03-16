/**
 * @fileoverview Abbreviation processor for Markdown content.
 * Converts `*[TERM]: Definition` syntax into HTML `<abbr>` elements.
 */

/**
 * Scans content for abbreviation definitions (`*[TERM]: Definition` lines),
 * removes them, and wraps every subsequent occurrence of each term in an
 * `<abbr title="Definition">TERM</abbr>` tag. Longer terms are matched first
 * to avoid partial replacement. Handles non-word-boundary terms such as `C++`
 * using lookahead/lookbehind instead of `\b`.
 * @param {string} content - Markdown string possibly containing abbreviation definitions
 * @returns {string} Content with definition lines removed and terms wrapped in `<abbr>` tags
 */
export function processAbbreviations(content) {
  const abbrs = {};
  const lines = content.split('\n');
  const outputLines = [];

  for (const line of lines) {
    const match = line.match(/^\*\[([^\]]+)\]:\s+(.+)$/);
    if (match) {
      abbrs[match[1]] = match[2].trim();
    } else {
      outputLines.push(line);
    }
  }

  let result = outputLines.join('\n');

  if (Object.keys(abbrs).length > 0) {
    const terms = Object.keys(abbrs).sort((a, b) => b.length - a.length);

    for (const term of terms) {
      const escapedTitle = abbrs[term]
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Use lookahead/lookbehind instead of \b to handle non-word char boundaries
      // \b only works at \w/\W transitions, so terms like C++ or *nix need explicit checks
      const startsWithWord = /^\w/.test(term);
      const endsWithWord = /\w$/.test(term);
      const prefix = startsWithWord ? '(?<!\\w)' : '(?<!\\S)';
      const suffix = endsWithWord ? '(?!\\w)' : '(?!\\S)';
      const regex = new RegExp(`${prefix}(${escapedTerm})${suffix}`, 'g');
      result = result.replace(regex, `<abbr title="${escapedTitle}">$1</abbr>`);
    }
  }

  return result;
}
