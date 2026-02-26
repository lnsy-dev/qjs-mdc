export function highlight(code) {
  return code
    .replace(/\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield|async|await|pass|break|continue)\b/g, '<span class="keyword">$1</span>')
    .replace(/\b(True|False|None)\b/g, '<span class="literal">$1</span>')
    .replace(/(#.*$)/gm, '<span class="comment">$1</span>')
    .replace(/('([^'\\]|\\.)*'|"([^"\\]|\\.)*"|'''[\s\S]*?'''|"""[\s\S]*?""")/g, '<span class="string">$1</span>');
}
