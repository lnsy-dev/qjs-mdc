const HIGHLIGHT_RULES = {
  js: {
    keywords: /\b(function|const|let|var|return|if|else|for|while|class|import|export|from|async|await|new|this|try|catch|throw)\b/g,
    literals: /\b(true|false|null|undefined)\b/g,
    comments: /(\/\/.*$)/gm,
    strings: /('([^'\\]|\\.)*'|"([^"\\]|\\.)*"|`([^`\\]|\\.)*`)/g
  },
  py: {
    keywords: /\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield|async|await|pass|break|continue)\b/g,
    literals: /\b(True|False|None)\b/g,
    comments: /(#.*$)/gm,
    strings: /('([^'\\]|\\.)*'|"([^"\\]|\\.)*")/g
  },
  rs: {
    keywords: /\b(fn|let|mut|const|if|else|match|for|while|loop|return|impl|trait|struct|enum|use|pub|mod)\b/g,
    literals: /\b(true|false|None|Some)\b/g,
    comments: /(\/\/.*$)/gm,
    strings: /('([^'\\]|\\.)*'|"([^"\\]|\\.)*")/g
  }
};

HIGHLIGHT_RULES.javascript = HIGHLIGHT_RULES.js;
HIGHLIGHT_RULES.python = HIGHLIGHT_RULES.py;
HIGHLIGHT_RULES.rust = HIGHLIGHT_RULES.rs;

function applyHighlighting(code, rules) {
  const slots = [];
  const slot = (i) => `\x00${i}\x00`;

  let processed = code
    .replace(rules.strings, (m) => { slots.push(`<span class="string">${m}</span>`); return slot(slots.length - 1); })
    .replace(rules.comments, (m) => { slots.push(`<span class="comment">${m}</span>`); return slot(slots.length - 1); });

  processed = processed
    .replace(rules.keywords, '<span class="keyword">$1</span>')
    .replace(rules.literals, '<span class="literal">$1</span>');

  return processed.replace(/\x00(\d+)\x00/g, (_, i) => slots[+i]);
}

export function highlightCode(html) {
  return html.replace(/<pre class="code" data-lang="([^"]*)">\s*<code>([\s\S]*?)<\/code>\s*<\/pre>/g, (match, lang, code) => {
    const rules = HIGHLIGHT_RULES[lang];
    if (!rules) return match;
    return `<pre class="code language-${lang}"><code>${applyHighlighting(code, rules)}</code></pre>`;
  });
}
