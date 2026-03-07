export function processWikilinks(content) {
  return content.replace(/\[\[([^\]]+)\]\]/g, (match, text) => {
    const filename = text.toLowerCase().replace(/\s+/g, '-') + '.html';
    return `<a href="${filename}">${text}</a>`;
  });
}
