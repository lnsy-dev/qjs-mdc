export function highlight(code) {
  return code
    .replace(/\b(int|char|float|double|void|if|else|for|while|return|struct|typedef|sizeof|static|const|unsigned|signed|long|short|switch|case|break|continue|default|do|goto|enum|union|volatile|register|extern|auto)\b/g, '<span class="keyword">$1</span>')
    .replace(/\b(true|false|NULL)\b/g, '<span class="literal">$1</span>')
    .replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>')
    .replace(/('([^'\\]|\\.)*'|"([^"\\]|\\.)*")/g, '<span class="string">$1</span>');
}
