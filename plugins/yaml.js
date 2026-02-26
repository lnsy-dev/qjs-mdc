export function highlight(code) {
  return code
    .replace(/(#.*$)/gm, '<span class="comment">$1</span>')
    .replace(/^(\s*-\s+[a-z_][a-z0-9_-]*:)/gmi, '<span class="key">$1</span>')
    .replace(/^(\s*[a-z_][a-z0-9_-]*:)/gmi, '<span class="key">$1</span>')
    .replace(/:\s*(true|false|null|~)/gi, ': <span class="literal">$1</span>')
    .replace(/("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g, '<span class="string">$1</span>');
}
