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
      const title = abbrs[term];
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b(${escapedTerm})\\b`, 'g');
      result = result.replace(regex, `<abbr title="${title}">$1</abbr>`);
    }
  }

  return result;
}
