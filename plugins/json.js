export function highlight(code) {
  return code
    .replace(/("([^"\\]|\\.)*")/g, '<span class="string">$1</span>')
    .replace(/\b(true|false|null)\b/g, '<span class="literal">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="number">$1</span>');
}
