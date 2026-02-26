export function highlight(code) {
  return code
    .replace(/\b(fn|let|mut|const|if|else|match|for|while|loop|return|impl|trait|struct|enum|use|pub|mod|async|await|move|ref|static|type|where|unsafe)\b/g, '<span class="keyword">$1</span>')
    .replace(/\b(true|false|None|Some)\b/g, '<span class="literal">$1</span>')
    .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>')
    .replace(/('([^'\\]|\\.)*'|"([^"\\]|\\.)*")/g, '<span class="string">$1</span>');
}
