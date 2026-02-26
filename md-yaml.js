import * as std from 'std';

// ============================================================================
// YAML Parser - Minimal implementation for front matter
// ============================================================================

function parseYAML(str) {
  const lines = str.split('\n');
  let i = 0;
  
  function skipEmpty() {
    while (i < lines.length && (!lines[i].trim() || lines[i].trim().startsWith('#'))) {
      i++;
    }
  }
  
  function getIndent(line) {
    return line.match(/^(\s*)/)[1].length;
  }
  
  function parseValue(value, baseIndent) {
    value = value.trim();
    
    // Handle quoted strings
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1).replace(/\\(.)/g, '$1');
    }
    
    // Handle multi-line literal (|) or folded (>)
    if (value === '|' || value === '>') {
      const isFolded = value === '>';
      i++;
      const contentLines = [];
      const startIndent = i < lines.length ? getIndent(lines[i]) : 0;
      
      while (i < lines.length) {
        const line = lines[i];
        const indent = getIndent(line);
        
        if (line.trim() && indent < startIndent) break;
        if (indent >= startIndent || !line.trim()) {
          contentLines.push(line.slice(startIndent));
          i++;
        } else {
          break;
        }
      }
      i--;
      
      let result = contentLines.join('\n');
      // Remove trailing newlines but keep one if present
      result = result.replace(/\n+$/, '');
      
      if (isFolded) {
        // Folded style: join lines with spaces, preserve paragraph breaks
        result = result.replace(/([^\n])\n([^\n])/g, '$1 $2');
      }
      return result;
    }
    
    // Handle arrays inline [1, 2, 3]
    if (value.startsWith('[') && value.endsWith(']')) {
      return value.slice(1, -1).split(',').map(v => parseValue(v.trim(), baseIndent));
    }
    
    // Handle objects inline {a: 1}
    if (value.startsWith('{') && value.endsWith('}')) {
      const obj = {};
      const content = value.slice(1, -1);
      const pairs = content.split(',');
      for (const pair of pairs) {
        const [k, v] = pair.split(':').map(s => s.trim());
        if (k && v !== undefined) {
          obj[k] = parseValue(v, baseIndent);
        }
      }
      return obj;
    }
    
    // Booleans
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    // Null
    if (value === 'null' || value === '~' || value === '') return null;
    
    // Numbers
    if (/^-?\d+$/.test(value)) return parseInt(value, 10);
    if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
    
    // String
    return value;
  }
  
  function parseArray(baseIndent) {
    const arr = [];
    
    while (i < lines.length) {
      skipEmpty();
      if (i >= lines.length) break;
      
      const line = lines[i];
      const indent = getIndent(line);
      
      if (indent < baseIndent) break;
      if (indent > baseIndent) {
        // Nested structure
        const nested = parseObject(indent);
        if (Object.keys(nested).length > 0) {
          arr.push(nested);
        }
        continue;
      }
      
      const trimmed = line.trim();
      if (!trimmed.startsWith('-')) break;
      
      const value = trimmed.slice(1).trim();
      i++;
      
      if (!value) {
        // Multi-line array item
        skipEmpty();
        if (i < lines.length && getIndent(lines[i]) > indent) {
          arr.push(parseObject(getIndent(lines[i])));
        }
      } else if (value.startsWith('-')) {
        // Nested array
        i--;
        arr.push(parseArray(indent + 2));
      } else {
        arr.push(parseValue(value, indent));
      }
    }
    
    return arr;
  }
  
  function parseObject(baseIndent = 0) {
    const obj = {};
    
    while (i < lines.length) {
      skipEmpty();
      if (i >= lines.length) break;
      
      const line = lines[i];
      const indent = getIndent(line);
      
      if (indent < baseIndent) break;
      if (indent > baseIndent) {
        i++;
        continue;
      }
      
      const trimmed = line.trim();
      
      // Array item
      if (trimmed.startsWith('-')) {
        return parseArray(indent);
      }
      
      // Key-value pair
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) {
        i++;
        continue;
      }
      
      const key = trimmed.slice(0, colonIdx).trim();
      const valueStr = trimmed.slice(colonIdx + 1).trim();
      
      i++;
      
      if (!valueStr) {
        // Multi-line value
        skipEmpty();
        if (i < lines.length) {
          const nextIndent = getIndent(lines[i]);
          if (nextIndent > indent) {
            const nextLine = lines[i].trim();
            if (nextLine.startsWith('-')) {
              obj[key] = parseArray(nextIndent);
            } else {
              obj[key] = parseObject(nextIndent);
            }
          } else {
            obj[key] = null;
          }
        } else {
          obj[key] = null;
        }
      } else {
        obj[key] = parseValue(valueStr, indent);
      }
    }
    
    return obj;
  }
  
  skipEmpty();
  if (i >= lines.length) return {};
  
  const firstLine = lines[i].trim();
  if (firstLine.startsWith('-')) {
    return parseArray(0);
  }
  
  return parseObject(0);
}

// ============================================================================
// Engines - Support for different front matter languages
// ============================================================================

const engines = {
  yaml: {
    parse: parseYAML,
    stringify: (obj) => {
      // Minimal YAML stringify
      const lines = [];
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          lines.push(`${key}: ${JSON.stringify(value)}`);
        } else if (typeof value === 'string') {
          lines.push(`${key}: ${value}`);
        } else {
          lines.push(`${key}: ${value}`);
        }
      }
      return lines.join('\n');
    }
  },
  
  json: {
    parse: JSON.parse,
    stringify: (obj, options) => {
      const opts = Object.assign({ replacer: null, space: 2 }, options);
      return JSON.stringify(obj, opts.replacer, opts.space);
    }
  },
  
  javascript: {
    parse: (str, options, wrap) => {
      try {
        if (wrap !== false) {
          str = '(function() {\nreturn ' + str.trim() + ';\n}());';
        }
        return eval(str) || {};
      } catch (err) {
        if (wrap !== false && /(unexpected|identifier)/i.test(err.message)) {
          return engines.javascript.parse(str, options, false);
        }
        throw new SyntaxError(err);
      }
    },
    stringify: (obj) => {
      return 'module.exports = ' + JSON.stringify(obj, null, 2);
    }
  }
};

// ============================================================================
// Utilities
// ============================================================================

function arrayify(val) {
  return Array.isArray(val) ? val : [val];
}

function defaults(options) {
  const opts = Object.assign({}, options);
  opts.delimiters = arrayify(opts.delims || opts.delimiters || '---');
  if (opts.delimiters.length === 1) {
    opts.delimiters.push(opts.delimiters[0]);
  }
  opts.language = (opts.language || opts.lang || 'yaml').toLowerCase();
  opts.engines = Object.assign({}, engines, opts.parsers, opts.engines);
  return opts;
}

// ============================================================================
// Excerpt extraction
// ============================================================================

function extractExcerpt(file, options) {
  const opts = defaults(options);
  
  if (file.data == null) {
    file.data = {};
  }
  
  if (typeof opts.excerpt === 'function') {
    return opts.excerpt(file, opts);
  }
  
  const sep = file.data.excerpt_separator || opts.excerpt_separator;
  if (sep == null && (opts.excerpt === false || opts.excerpt == null)) {
    return file;
  }
  
  const delimiter = typeof opts.excerpt === 'string'
    ? opts.excerpt
    : (sep || opts.delimiters[0]);
  
  const idx = file.content.indexOf(delimiter);
  if (idx !== -1) {
    file.excerpt = file.content.slice(0, idx);
  }
  
  return file;
}

// ============================================================================
// Language detection
// ============================================================================

function detectLanguage(str, options) {
  const opts = defaults(options);
  const open = opts.delimiters[0];
  
  if (str.startsWith(open)) {
    str = str.slice(open.length);
  }
  
  const language = str.slice(0, str.search(/\r?\n/));
  return {
    raw: language,
    name: language ? language.trim() : ''
  };
}

// ============================================================================
// Core parsing logic
// ============================================================================

function parseMatter(input, options) {
  if (input === '') {
    return { data: {}, content: input, excerpt: '', orig: input };
  }
  
  const opts = defaults(options);
  const open = opts.delimiters[0];
  const close = '\n' + opts.delimiters[1];
  
  const file = {
    content: input,
    data: {},
    excerpt: '',
    orig: input,
    matter: '',
    language: opts.language
  };
  
  let str = file.content;
  const openLen = open.length;
  
  // Check if starts with delimiter
  if (!str.startsWith(open)) {
    extractExcerpt(file, opts);
    return file;
  }
  
  // Check if next char is same as delimiter (e.g., ----)
  if (str.charAt(openLen) === open.slice(-1)) {
    return file;
  }
  
  // Strip opening delimiter
  str = str.slice(openLen);
  const len = str.length;
  
  // Detect language
  const language = detectLanguage(open + str, opts);
  if (language.name) {
    file.language = language.name;
    str = str.slice(language.raw.length);
  }
  
  // Find closing delimiter
  let closeIndex = str.indexOf(close);
  if (closeIndex === -1) {
    closeIndex = len;
  }
  
  // Extract front matter
  file.matter = str.slice(0, closeIndex);
  
  // Parse front matter
  const block = file.matter.replace(/^\s*#[^\n]+/gm, '').trim();
  if (block === '') {
    file.isEmpty = true;
    file.empty = file.content;
    file.data = {};
  } else {
    const engine = opts.engines[file.language];
    if (!engine) {
      throw new Error(`Engine not found for language: ${file.language}`);
    }
    file.data = engine.parse(file.matter, opts);
  }
  
  // Extract content
  if (closeIndex === len) {
    file.content = '';
  } else {
    file.content = str.slice(closeIndex + close.length);
    if (file.content[0] === '\r') {
      file.content = file.content.slice(1);
    }
    if (file.content[0] === '\n') {
      file.content = file.content.slice(1);
    }
  }
  
  // Extract excerpt
  extractExcerpt(file, opts);
  
  return file;
}

// ============================================================================
// File I/O
// ============================================================================

function parseMatterFromFile(filepath, options) {
  const content = std.loadFile(filepath);
  if (content === null) {
    throw new Error(`Failed to read file: ${filepath}`);
  }
  
  const file = parseMatter(content, options);
  file.path = filepath;
  return file;
}

// ============================================================================
// Exports
// ============================================================================

export { parseMatter, parseMatterFromFile, engines };
export default parseMatter;
