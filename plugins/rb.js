export function highlight(code) {
  return code
    .replace(/\b(def|end|class|module|if|elsif|else|unless|case|when|for|while|until|do|begin|rescue|ensure|return|yield|break|next|redo|retry|raise|super|self|true|false|nil|and|or|not|in|require|include|extend|attr_reader|attr_writer|attr_accessor)\b/g, '<span class="keyword">$1</span>')
    .replace(/(#.*$)/gm, '<span class="comment">$1</span>')
    .replace(/('([^'\\]|\\.)*'|"([^"\\]|\\.)*")/g, '<span class="string">$1</span>');
}
