/**
 * @fileoverview Minimal markdown parser adapted from snarkdown.
 * Converts a markdown string to an HTML string. Supported syntax: headings
 * (ATX `#` and setext `---`/`===`), bold (`**` / `__`), italic (`*` / `_`),
 * strikethrough (`~~`), inline code (`` ` ``), fenced code blocks (` ``` `),
 * links (`[text](url)` and `[ref]` with `[ref]: url` definitions), images
 * (`![alt](src)`), unordered lists (`*`, `+`, `-`), ordered lists (`1.`),
 * blockquotes (`>`), indented code blocks, and horizontal rules (`---`).
 *
 * @see https://github.com/developit/snarkdown
 */

// Minimal markdown parser adapted from snarkdown
// https://github.com/developit/snarkdown

const TAGS = {
  '': ['<em>','</em>'],
  _: ['<strong>','</strong>'],
  '*': ['<strong>','</strong>'],
  '~': ['<s>','</s>'],
  '\n': ['</p><p>'],
  ' ': ['</p><p>'],
  '-': ['<hr />']
};

/**
 * Strips the common leading indentation prefix from every line of `str`.
 * Used to normalise blockquote and list content before recursive parsing.
 * @param {string} str - Indented string
 * @returns {string} String with common indent removed from every line
 */
function outdent(str) {
  return str.replace(RegExp('^'+(str.match(/^(\t| )+/) || '')[0], 'gm'), '');
}

/**
 * HTML-encodes the characters `"`, `<`, and `>` in `str` for safe use inside
 * HTML attribute values and code block content.
 * @param {string} str - Raw string
 * @returns {string} String with `"` → `&quot;`, `<` → `&lt;`, `>` → `&gt;`
 */
function encodeAttr(str) {
  return (str+'').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Parses a markdown string and returns an HTML string.
 * @param {string} md - Markdown source
 * @param {Object} [prevLinks] - Pre-populated link reference map from a parent
 *   parse call; allows reference links defined in a parent document to resolve
 *   inside recursively parsed list/blockquote content
 * @param {boolean} [skipWrap=false] - When `true`, skips wrapping the output
 *   in `<p>` tags and suppressing block-element paragraph corrections; used
 *   for inline/recursive parsing of list items and headings
 * @returns {string} HTML string
 */
export function parse(md, prevLinks, skipWrap) {
  let tokenizer = /((?:^|\n+)(?:\n---+|\* \*(?: \*)+)\n)|(?:(?:^|\n+)``` *([\w-]*)\n([\s\S]*?)\n```$)|((?:(?:^|\n+)(?:\t|  {2,}).+)+\n*)|((?:(?:^|\n)([>*+-]|\d+\.)\s+.*)+)|(?:!\[([^\]]*?)\]\(([^)]+?)\))|(\[)|(\](?:\(([^)]+?)\))?)|(?:(?:^|\n+)([^\s].*)\n(-{3,}|={3,})(?:\n+|$))|(?:(?:^|\n+)(#{1,6})\s*(.+)(?:\n+|$))|(?:`([^`].*?)`)|( {2}\n\n*|\n{2,}|__|\*\*|[_*]|~~)/gm,
      context = [],
      out = '',
      links = prevLinks || {},
      last = 0,
      chunk, prev, token, inner, t;

  function tag(token) {
    let desc = TAGS[token[1] || ''];
    let end = context[context.length-1] == token;
    if (!desc) return token;
    if (!desc[1]) return desc[0];
    if (end) context.pop();
    else context.push(token);
    return desc[end|0];
  }

  function flush() {
    let str = '';
    while (context.length) str += tag(context[context.length-1]);
    return str;
  }

  md = md.replace(/^\[(.+?)\]:\s*(.+)$/gm, (s, name, url) => {
    links[name.toLowerCase()] = url;
    return '';
  }).replace(/^\n+|\n+$/g, '');

  while ( (token=tokenizer.exec(md)) ) {
    prev = md.substring(last, token.index);
    last = tokenizer.lastIndex;
    chunk = token[0];
    
    if (prev.match(/[^\\](\\\\)*\\$/)) {
      // escaped
    }
    else if (t = (token[3] || token[4])) {
      chunk = '<pre class="code" data-lang="'+(token[2]||'')+'"><code>' + encodeAttr(t).replace(/^\n+|\n+$/g, '') + '</code></pre>';
    }
    else if (t = token[6]) {
      if (t.match(/\./)) {
        token[5] = token[5].replace(/^\d+/gm, '');
      }
      inner = parse(outdent(token[5].replace(/^\s*[>*+.-]/gm, '')), links, true);
      if (t=='>') t = 'blockquote';
      else {
        t = t.match(/\./) ? 'ol' : 'ul';
        inner = inner.replace(/^(.*)(\n|$)/gm, '<li>$1</li>');
      }
      chunk = '<'+t+'>' + inner + '</'+t+'>';
    }
    else if (token[8]) {
      chunk = `<img src="${encodeAttr(token[8])}" alt="${encodeAttr(token[7])}" />`;
    }
    else if (token[10]) {
      out = out.replace('<a>', `<a href="${encodeAttr(token[11] || links[prev.toLowerCase()])}">`);
      chunk = flush() + '</a>';
    }
    else if (token[9]) {
      chunk = '<a>';
    }
    else if (token[12] || token[14]) {
      t = 'h' + (token[14] ? token[14].length : (token[13]>'=' ? 1 : 2));
      chunk = '<'+t+'>' + parse(token[12] || token[15], links, true) + '</'+t+'>';
    }
    else if (token[16]) {
      chunk = '<code>'+encodeAttr(token[16])+'</code>';
    }
    else if (token[17] || token[1]) {
      chunk = tag(token[17] || '--');
    }
    
    out += prev;
    out += chunk;
  }

  let result = (out + md.substring(last) + flush()).replace(/^\n+|\n+$/g, '');
  
  if (skipWrap) return result;
  
  // Wrap content in paragraph tags
  result = '<p>' + result + '</p>';
  
  // Fix paragraph breaks around block elements
  result = result.replace(/<p>(<h[1-6])/g, '$1');
  result = result.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  result = result.replace(/<p>(<pre)/g, '$1');
  result = result.replace(/(<\/pre>)<\/p>/g, '$1');
  result = result.replace(/<p>(<ul)/g, '$1');
  result = result.replace(/(<\/ul>)<\/p>/g, '$1');
  result = result.replace(/<p>(<ol)/g, '$1');
  result = result.replace(/(<\/ol>)<\/p>/g, '$1');
  result = result.replace(/<p>(<blockquote)/g, '$1');
  result = result.replace(/(<\/blockquote>)<\/p>/g, '$1');
  result = result.replace(/<p>(<hr)/g, '$1');
  result = result.replace(/(<hr \/>)<\/p>/g, '$1');
  
  // Close paragraphs before block elements
  result = result.replace(/([^>])(<h[1-6])/g, '$1</p>$2');
  result = result.replace(/([^>])(<pre)/g, '$1</p>$2');
  result = result.replace(/([^>])(<ul)/g, '$1</p>$2');
  result = result.replace(/([^>])(<ol)/g, '$1</p>$2');
  result = result.replace(/([^>])(<blockquote)/g, '$1</p>$2');
  result = result.replace(/([^>])(<hr)/g, '$1</p>$2');
  
  // Add opening <p> after block elements
  result = result.replace(/(<\/h[1-6]>)([^<])/g, '$1<p>$2');
  result = result.replace(/(<\/pre>)([^<])/g, '$1<p>$2');
  result = result.replace(/(<\/ul>)([^<])/g, '$1<p>$2');
  result = result.replace(/(<\/ol>)([^<])/g, '$1<p>$2');
  result = result.replace(/(<\/blockquote>)([^<])/g, '$1<p>$2');
  result = result.replace(/(<hr \/>)([^<])/g, '$1<p>$2');
  
  // Clean up empty paragraphs
  result = result.replace(/<p><\/p>/g, '');
  result = result.replace(/<p>\s*<\/p>/g, '');
  
  return result;
}

export default parse;
