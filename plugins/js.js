export function highlight(code) {
  return code
    .replace(/\b(function|const|let|var|return|if|else|for|while|class|import|export|from|async|await|new|this|try|catch|throw)\b/g, '<span class="keyword">$1</span>')
    .replace(/\b(true|false|null|undefined)\b/g, '<span class="literal">$1</span>')
    .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>')
    .replace(/('([^'\\]|\\.)*'|"([^"\\]|\\.)*"|`([^`\\]|\\.)*`)/g, '<span class="string">$1</span>');
}
