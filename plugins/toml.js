export function highlight(code) {
  return code
    .replace(/(#.*$)/gm, '<span class="comment">$1</span>')
    .replace(/^(\[.*\]$)/gm, '<span class="section">$1</span>')
    .replace(/^([a-z_][a-z0-9_-]*)\s*=/gmi, '<span class="key">$1</span>=')
    .replace(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g, '<span class="string">$1</span>');
}
