export function highlight(code) {
  return code
    .replace(/(&lt;\/?[a-z][a-z0-9]*[^&]*?&gt;)/gi, '<span class="tag">$1</span>')
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="comment">$1</span>');
}
