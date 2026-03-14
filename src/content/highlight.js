// encodeAttr (from the markdown parser) encodes: " → &quot;  < → &lt;  > → &gt;
// Single quotes, backticks, and all other chars are left as-is.
// All regexes below must account for this encoding.

const DQ = /(&quot;(?:[^&\n]|&(?!quot;))*&quot;)/g;   // "double-quoted"
const SQ = /('(?:[^'\\\n]|\\.)*')/g;                    // 'single-quoted'
const BT = /(`(?:[^`\\]|\\.)*`)/g;                      // `backtick`

// Slot format: \x00s<index>s\x00
// The "s" prefix/suffix are word chars so \b\d+\b won't match the index digits.
function makeHighlighter(steps) {
  return (code) => {
    const slots = [];
    const slot = (i) => `\x00s${i}s\x00`;

    let out = code;
    for (const [re, cls, fmt] of steps) {
      if (cls === null) {
        out = out.replace(re, fmt);
      } else {
        out = out.replace(re, (m) => {
          slots.push(`<span class="${cls}">${m}</span>`);
          return slot(slots.length - 1);
        });
      }
    }

    return out.replace(/\x00s(\d+)s\x00/g, (_, i) => slots[+i]);
  };
}

// ─── Language highlighters ────────────────────────────────────────────────────

const HIGHLIGHTERS = {

  // JavaScript / TypeScript
  js: makeHighlighter([
    [DQ,                                                                  'string'],
    [SQ,                                                                  'string'],
    [BT,                                                                  'string'],
    [/(\/\*[\s\S]*?\*\/)/g,                                               'comment'],
    [/(\/\/[^\n]*)/g,                                                     'comment'],
    [/\b(function|const|let|var|return|if|else|for|while|class|import|export|from|async|await|new|this|try|catch|throw|typeof|instanceof|switch|case|break|continue|default|do|delete|in|of|void|yield)\b/g, 'keyword'],
    [/\b(true|false|null|undefined|NaN|Infinity)\b/g,                     'literal'],
    [/\b(\d+\.?\d*)\b/g,                                                  'number'],
  ]),

  // Python
  py: makeHighlighter([
    [/(&quot;&quot;&quot;[\s\S]*?&quot;&quot;&quot;|'''[\s\S]*?''')/g,   'string'],
    [DQ,                                                                  'string'],
    [SQ,                                                                  'string'],
    [/(#[^\n]*)/g,                                                        'comment'],
    [/\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield|async|await|pass|break|continue|raise|not|and|or|is|in|del|global|nonlocal|assert)\b/g, 'keyword'],
    [/\b(True|False|None)\b/g,                                            'literal'],
    [/\b(\d+\.?\d*)\b/g,                                                  'number'],
  ]),

  // Rust
  rs: makeHighlighter([
    [DQ,                                                                  'string'],
    [SQ,                                                                  'string'],
    [/(\/\*[\s\S]*?\*\/)/g,                                               'comment'],
    [/(\/\/[^\n]*)/g,                                                     'comment'],
    [/\b(fn|let|mut|const|if|else|match|for|while|loop|return|impl|trait|struct|enum|use|pub|mod|async|await|move|ref|static|type|where|unsafe|extern|crate|super|self|Self)\b/g, 'keyword'],
    [/\b(true|false|None|Some|Ok|Err)\b/g,                                'literal'],
    [/\b(\d+\.?\d*(?:u8|u16|u32|u64|usize|i8|i16|i32|i64|isize|f32|f64)?)\b/g, 'number'],
  ]),

  // C
  c: makeHighlighter([
    [DQ,                                                                  'string'],
    [SQ,                                                                  'string'],
    [/(\/\*[\s\S]*?\*\/)/g,                                               'comment'],
    [/(\/\/[^\n]*)/g,                                                     'comment'],
    [/\b(int|char|float|double|void|if|else|for|while|return|struct|typedef|sizeof|static|const|unsigned|signed|long|short|switch|case|break|continue|default|do|goto|enum|union|volatile|register|extern|auto|inline)\b/g, 'keyword'],
    [/\b(true|false|NULL)\b/g,                                            'literal'],
    [/\b(\d+\.?\d*)\b/g,                                                  'number'],
  ]),

  // Ruby
  rb: makeHighlighter([
    [DQ,                                                                  'string'],
    [SQ,                                                                  'string'],
    [/(#[^\n]*)/g,                                                        'comment'],
    [/\b(def|end|class|module|if|elsif|else|unless|case|when|for|while|until|do|begin|rescue|ensure|return|yield|break|next|raise|super|self|require|include|extend|attr_reader|attr_writer|attr_accessor)\b/g, 'keyword'],
    [/\b(true|false|nil)\b/g,                                             'literal'],
    [/\b(\d+\.?\d*)\b/g,                                                  'number'],
  ]),

  // HTML — tags and attributes are &lt;...&gt; encoded
  html: makeHighlighter([
    [/(&lt;!--[\s\S]*?--&gt;)/g,                                          'comment'],
    [/(&lt;!DOCTYPE[^&]*?&gt;)/gi,                                        'tag'],
    [/(&lt;\/?[a-zA-Z][a-zA-Z0-9]*(?:\s[^&]*?)?&gt;)/g,                  'tag'],
    [DQ,                                                                  'string'],
    [SQ,                                                                  'string'],
  ]),

  // JSON — values are &quot;...&quot; encoded
  json: makeHighlighter([
    [DQ,                                                                  'string'],
    [/\b(true|false|null)\b/g,                                            'literal'],
    [/\b(\d+\.?\d*(?:e[+-]?\d+)?)\b/gi,                                  'number'],
  ]),

  // CSS
  css: makeHighlighter([
    [/(\/\*[\s\S]*?\*\/)/g,                                               'comment'],
    [DQ,                                                                  'string'],
    [SQ,                                                                  'string'],
    [/(:[^:{}\n;]+)/g,                                                    'string'],    // values after :
    [/([.#:][a-zA-Z][a-zA-Z0-9_-]*)/g,                                   'keyword'],   // selectors
    [/\b([a-zA-Z-]+)(?=\s*:)/g,                                          'literal'],   // property names
  ]),

  // TOML
  toml: makeHighlighter([
    [DQ,                                                                  'string'],
    [SQ,                                                                  'string'],
    [/(#[^\n]*)/g,                                                        'comment'],
    [/^(\[{1,2}[^\]]+\]{1,2})/gm,                                        'keyword'],   // [sections]
    [/^([a-zA-Z_][a-zA-Z0-9_.-]*)(?=\s*=)/gm,                           'literal'],   // keys
    [/\b(true|false)\b/g,                                                 'number'],
  ]),

  // YAML — uses custom slot logic for key vs value coloring
  yaml: (code) => {
    const slots = [];
    const slot = (i) => `\x00s${i}s\x00`;

    let out = code
      .replace(SQ, (m) => { slots.push(`<span class="string">${m}</span>`); return slot(slots.length - 1); })
      .replace(/(#[^\n]*)/g, (m) => { slots.push(`<span class="comment">${m}</span>`); return slot(slots.length - 1); });

    out = out
      .replace(/^(\s*(?:-\s+)?)([a-zA-Z_][a-zA-Z0-9_-]*)(\s*:)/gm, '$1<span class="keyword">$2</span>$3')
      .replace(/:\s*(true|false|null|~)\b/gi, (m, v) => m.replace(v, `<span class="literal">${v}</span>`));

    return out.replace(/\x00s(\d+)s\x00/g, (_, i) => slots[+i]);
  },

  // Markdown — all inlines are slotted in priority order so they can't re-match each other
  markdown: (code) => {
    const slots = [];
    const slot = (i) => `\x00s${i}s\x00`;
    const protect = (m, cls) => { slots.push(`<span class="${cls}">${m}</span>`); return slot(slots.length - 1); };

    let out = code
      .replace(/(`[^`\n]+`)/g,              (m) => protect(m, 'string'))
      .replace(/(\[[^\]\n]*\]\([^)\n]*\))/g, (m) => protect(m, 'string'))
      .replace(/^(#{1,6}\s+.*)$/gm,          (m) => protect(m, 'keyword'))
      .replace(/(\*\*[^*\n]+\*\*|__[^_\n]+__)/g, (m) => protect(m, 'keyword'))
      .replace(/(\*[^*\n]+\*|_[^_\n]+_)/g,   (m) => protect(m, 'literal'))
      .replace(/^(>\s?.*)$/gm,               (m) => protect(m, 'comment'));

    return out.replace(/\x00s(\d+)s\x00/g, (_, i) => slots[+i]);
  },

  // Markdown file with YAML front matter (--- block at top)
  'markdown-frontmatter': (code) => {
    const fmMatch = code.match(/^(---\n[\s\S]*?\n---\n?)([\s\S]*)$/);
    if (!fmMatch) return HIGHLIGHTERS.markdown(code);
    const fmHighlighted = HIGHLIGHTERS.yaml(fmMatch[1]);
    const mdHighlighted = HIGHLIGHTERS.markdown(fmMatch[2]);
    return fmHighlighted + mdHighlighted;
  },
};

// Aliases
HIGHLIGHTERS.javascript = HIGHLIGHTERS.js;
HIGHLIGHTERS.typescript = HIGHLIGHTERS.js;
HIGHLIGHTERS.ts         = HIGHLIGHTERS.js;
HIGHLIGHTERS.python     = HIGHLIGHTERS.py;
HIGHLIGHTERS.rust       = HIGHLIGHTERS.rs;
HIGHLIGHTERS.ruby       = HIGHLIGHTERS.rb;
HIGHLIGHTERS.yml        = HIGHLIGHTERS.yaml;
HIGHLIGHTERS.md         = HIGHLIGHTERS.markdown;
HIGHLIGHTERS['language-markdown'] = HIGHLIGHTERS.markdown;

// ─── Main export ─────────────────────────────────────────────────────────────

export function highlightCode(html) {
  return html.replace(
    /<pre class="code" data-lang="([^"]*)">\s*<code>([\s\S]*?)<\/code>\s*<\/pre>/g,
    (match, lang, code) => {
      const fn = HIGHLIGHTERS[lang];
      if (!fn) return match;
      return `<pre class="code language-${lang}"><code>${fn(code)}</code></pre>`;
    }
  );
}
