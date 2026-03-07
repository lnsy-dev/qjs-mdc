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
  return code
    .replace(rules.keywords, '<kw>$1</kw>')
    .replace(rules.literals, '<lit>$1</lit>')
    .replace(rules.comments, '<cmt>$1</cmt>')
    .replace(rules.strings, '<str>$1</str>')
    .replace(/<kw>/g, '<span class="keyword">').replace(/<\/kw>/g, '</span>')
    .replace(/<lit>/g, '<span class="literal">').replace(/<\/lit>/g, '</span>')
    .replace(/<cmt>/g, '<span class="comment">').replace(/<\/cmt>/g, '</span>')
    .replace(/<str>/g, '<span class="string">').replace(/<\/str>/g, '</span>');
}

export function highlightCode(html) {
  return html.replace(/<pre class="code" data-lang="([^"]*)">\s*<code>([\s\S]*?)<\/code>\s*<\/pre>/g, (match, lang, code) => {
    const rules = HIGHLIGHT_RULES[lang];
    if (!rules) return match;
    return `<pre class="code language-${lang}"><code>${applyHighlighting(code, rules)}</code></pre>`;
  });
}
