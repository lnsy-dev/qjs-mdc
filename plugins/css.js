export function highlight(code) {
  return code
    .replace(/([.#][a-z][a-z0-9_-]*)/gi, '<span class="selector">$1</span>')
    .replace(/\b([a-z-]+):/gi, '<span class="property">$1</span>:')
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="comment">$1</span>');
}
