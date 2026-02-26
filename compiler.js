import * as std from 'std';
import * as os from 'os';
import { parseMatterFromFile } from './md-yaml.js';
import { parse as parseMarkdown } from './lib/markdown.js';

function loadTemplate(templatesDir, name) {
  const path = `${templatesDir}/${name}`;
  const content = std.loadFile(path);
  return content || '';
}

function loadIndexConfig(sourceDir) {
  const path = `${sourceDir}/index.json`;
  const content = std.loadFile(path);
  if (!content) return {};
  try {
    return JSON.parse(content);
  } catch (e) {
    return {};
  }
}

function substituteVariables(template, vars) {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmed = key.trim();
    return vars[trimmed] !== undefined ? vars[trimmed] : '';
  });
}

function compileTemplate(template, vars, templatesDir) {
  // First pass: compile {{*.html}} template includes
  let result = template.replace(/\{\{([^}]+\.html)\}\}/g, (match, filename) => {
    const trimmed = filename.trim();
    return loadTemplate(templatesDir, trimmed);
  });
  
  // Second pass: compile data variables
  result = substituteVariables(result, vars);
  
  return result;
}

function selectTemplate(file, templatesDir) {
  const type = file.data.type;
  
  if (type) {
    const typeTemplate = loadTemplate(templatesDir, `${type}.html`);
    if (typeTemplate) return typeTemplate;
  }
  
  const postTemplate = loadTemplate(templatesDir, 'post.html');
  if (postTemplate) return postTemplate;
  
  return loadTemplate(templatesDir, 'default.html');
}

function processWikilinks(content) {
  // Remove wikilink brackets, leaving just the text
  return content.replace(/\[\[([^\]]+)\]\]/g, '$1');
}

function makeUrlsClickable(html) {
  // Make URLs clickable - simple regex that works in QuickJS
  // This will match URLs not already in quotes (basic check)
  let result = html;
  const urlRegex = /(https?:\/\/[^\s<"]+)/g;
  
  result = result.replace(urlRegex, (match) => {
    // Check if this URL is already in an href by looking backwards
    const index = result.indexOf(match);
    const before = result.substring(Math.max(0, index - 10), index);
    if (before.includes('href="') || before.includes('">')) {
      return match; // Already in a link
    }
    return `<a href="${match}">${match}</a>`;
  });
  
  return result;
}

function processAbbreviations(content) {
  const abbrs = {};
  const lines = content.split('\n');
  const outputLines = [];
  
  // First pass: collect abbreviations
  for (const line of lines) {
    const match = line.match(/^\*\[([^\]]+)\]:\s+(.+)$/);
    if (match) {
      abbrs[match[1]] = match[2].trim();
    } else {
      outputLines.push(line);
    }
  }
  
  // Second pass: replace abbreviations in content
  let result = outputLines.join('\n');
  
  if (Object.keys(abbrs).length > 0) {
    // Sort by length (longest first) to avoid partial replacements
    const terms = Object.keys(abbrs).sort((a, b) => b.length - a.length);
    
    for (const term of terms) {
      const title = abbrs[term];
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b(${escapedTerm})\\b`, 'g');
      result = result.replace(regex, `<abbr title="${title}">$1</abbr>`);
    }
  }
  
  return result;
}

function highlightCode(html) {
  return html.replace(/<pre class="code" data-lang="([^"]*)">\s*<code>([\s\S]*?)<\/code>\s*<\/pre>/g, (match, lang, code) => {
    if (!lang) return match;
    
    // Simple inline highlighting based on language
    let highlighted = code;
    
    if (lang === 'js' || lang === 'javascript') {
      highlighted = code
        .replace(/\b(function|const|let|var|return|if|else|for|while|class|import|export|from|async|await|new|this|try|catch|throw)\b/g, '<kw>$1</kw>')
        .replace(/\b(true|false|null|undefined)\b/g, '<lit>$1</lit>')
        .replace(/(\/\/.*$)/gm, '<cmt>$1</cmt>')
        .replace(/('([^'\\]|\\.)*'|"([^"\\]|\\.)*"|`([^`\\]|\\.)*`)/g, '<str>$1</str>')
        .replace(/<kw>/g, '<span class="keyword">')
        .replace(/<\/kw>/g, '</span>')
        .replace(/<lit>/g, '<span class="literal">')
        .replace(/<\/lit>/g, '</span>')
        .replace(/<cmt>/g, '<span class="comment">')
        .replace(/<\/cmt>/g, '</span>')
        .replace(/<str>/g, '<span class="string">')
        .replace(/<\/str>/g, '</span>');
    } else if (lang === 'py' || lang === 'python') {
      highlighted = code
        .replace(/\b(def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|with|lambda|yield|async|await|pass|break|continue)\b/g, '<kw>$1</kw>')
        .replace(/\b(True|False|None)\b/g, '<lit>$1</lit>')
        .replace(/(#.*$)/gm, '<cmt>$1</cmt>')
        .replace(/('([^'\\]|\\.)*'|"([^"\\]|\\.)*")/g, '<str>$1</str>')
        .replace(/<kw>/g, '<span class="keyword">')
        .replace(/<\/kw>/g, '</span>')
        .replace(/<lit>/g, '<span class="literal">')
        .replace(/<\/lit>/g, '</span>')
        .replace(/<cmt>/g, '<span class="comment">')
        .replace(/<\/cmt>/g, '</span>')
        .replace(/<str>/g, '<span class="string">')
        .replace(/<\/str>/g, '</span>');
    } else if (lang === 'rs' || lang === 'rust') {
      highlighted = code
        .replace(/\b(fn|let|mut|const|if|else|match|for|while|loop|return|impl|trait|struct|enum|use|pub|mod)\b/g, '<kw>$1</kw>')
        .replace(/\b(true|false|None|Some)\b/g, '<lit>$1</lit>')
        .replace(/(\/\/.*$)/gm, '<cmt>$1</cmt>')
        .replace(/('([^'\\]|\\.)*'|"([^"\\]|\\.)*")/g, '<str>$1</str>')
        .replace(/<kw>/g, '<span class="keyword">')
        .replace(/<\/kw>/g, '</span>')
        .replace(/<lit>/g, '<span class="literal">')
        .replace(/<\/lit>/g, '</span>')
        .replace(/<cmt>/g, '<span class="comment">')
        .replace(/<\/cmt>/g, '</span>')
        .replace(/<str>/g, '<span class="string">')
        .replace(/<\/str>/g, '</span>');
    }
    
    return `<pre class="code language-${lang}"><code>${highlighted}</code></pre>`;
  });
}

function extractSummary(file) {
  if (file.data.summary) {
    return file.data.summary;
  }
  
  // Extract first paragraph from content
  const paragraphs = file.content.split(/\n\n+/);
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
      return trimmed.replace(/\n/g, ' ').substring(0, 200);
    }
  }
  
  return '';
}

function embedImages(html, sourceDir) {
  return html.replace(/<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi, (match, before, src, after) => {
    // Check if it's a data URI already
    if (src.startsWith('data:')) return match;
    
    let imageData;
    
    // External URL
    if (src.startsWith('http://') || src.startsWith('https://')) {
      try {
        const result = std.urlGet(src, { binary: true });
        if (result) {
          imageData = result;
        }
      } catch (e) {
        return match; // Keep original if fetch fails
      }
    } else {
      // Local file
      const imagePath = src.startsWith('/') ? sourceDir + src : sourceDir + '/' + src;
      const content = std.loadFile(imagePath);
      if (!content) return match;
      imageData = content;
    }
    
    if (!imageData) return match;
    
    // Check if SVG
    if (src.endsWith('.svg') || (typeof imageData === 'string' && imageData.trim().startsWith('<svg'))) {
      return imageData;
    }
    
    // Base64 encode for other images
    const base64 = btoa(imageData);
    const ext = src.split('.').pop().toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    const mime = mimeTypes[ext] || 'image/png';
    
    return `<img ${before}src="data:${mime};base64,${base64}"${after}>`;
  });
}

function collectAssets(sourceDir) {
  const assets = { css: [], js: [] };
  
  function scan(dir) {
    try {
      const result = os.readdir(dir);
      if (!result || result[1] !== 0) return;
      
      const entries = String(result[0]).split(',');
      
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (entry === '.' || entry === '..' || !entry || entry === 'templates') continue;
        
        const fullPath = dir + '/' + entry;
        const [st, err] = os.stat(fullPath);
        
        if (!err && (st.mode & os.S_IFDIR)) {
          scan(fullPath);
        } else if (fullPath.endsWith('.css')) {
          const content = std.loadFile(fullPath);
          if (content) assets.css.push(content);
        } else if (fullPath.endsWith('.js') && !fullPath.includes('compiler.js')) {
          const content = std.loadFile(fullPath);
          if (content) assets.js.push(content);
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }
  
  scan(sourceDir);
  return assets;
}

function embedAssets(html, assets) {
  // Embed CSS
  if (assets.css.length > 0) {
    const cssBlock = '<style>\n' + assets.css.join('\n') + '\n</style>';
    html = html.replace('</head>', cssBlock + '\n</head>');
  }
  
  // Embed JS
  if (assets.js.length > 0) {
    const jsBlock = '<script>\n' + assets.js.join('\n') + '\n</script>';
    html = html.replace('</head>', jsBlock + '\n</head>');
  }
  
  return html;
}

function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveFilenameConflicts(files) {
  const usedNames = new Map();
  
  for (const file of files) {
    const basename = file.data.title || file.path.split('/').pop().replace(/\.md$/, '');
    let sanitized = sanitizeFilename(basename);
    
    if (usedNames.has(sanitized)) {
      const count = usedNames.get(sanitized) + 1;
      usedNames.set(sanitized, count);
      sanitized = `${sanitized}-${count}`;
    } else {
      usedNames.set(sanitized, 1);
    }
    
    file.outputName = sanitized + '.html';
  }
  
  return files;
}

function walkDirectory(dir, files = []) {
  try {
    const result = os.readdir(dir);
    
    if (!result || result[1] !== 0) {
      return files;
    }
    
    // result[0] is already an array-like object, not a string
    const entriesStr = String(result[0]);
    const entries = entriesStr.split(',');
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry === '.' || entry === '..' || !entry) continue;
      
      const fullPath = dir + '/' + entry;
      const [st, err] = os.stat(fullPath);
      
      if (!err && (st.mode & os.S_IFDIR)) {
        walkDirectory(fullPath, files);
      } else if (fullPath.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Directory error
  }
  
  return files;
}

function findPublishableFiles(sourceDir) {
  const allFiles = walkDirectory(sourceDir);
  const publishable = [];
  
  for (const filepath of allFiles) {
    try {
      const parsed = parseMatterFromFile(filepath);
      if (parsed.data && parsed.data.publish === true) {
        publishable.push({
          path: filepath,
          data: parsed.data,
          content: parsed.content
        });
      }
    } catch (e) {
      console.log('Error parsing', filepath, ':', e.message);
    }
  }
  
  return publishable;
}

function printHelp() {
  console.log('Usage: mdc <source-directory> --output <output-directory>');
  console.log('');
  console.log('Compile markdown files with YAML front matter into static HTML.');
  console.log('');
  console.log('Options:');
  console.log('  --output, -o    Output directory (required)');
  console.log('  --help, -h      Show this help message');
}

function parseArgs(args) {
  // scriptArgs is a string in QuickJS, need to split it
  if (typeof args === 'string') {
    args = args.split(',');
  }
  
  if (!args || args.length < 3) {
    printHelp();
    std.exit(1);
  }

  const config = {
    source: null,
    output: null
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      printHelp();
      std.exit(0);
    } else if (arg === '--output' || arg === '-o') {
      config.output = args[++i];
    } else if (!config.source) {
      config.source = arg;
    }
  }

  if (!config.source) {
    console.log('Error: Source directory is required');
    printHelp();
    std.exit(1);
  }

  if (!config.output) {
    console.log('Error: Output directory is required (use --output)');
    printHelp();
    std.exit(1);
  }

  return config;
}

function main() {
  const config = parseArgs(scriptArgs);
  
  console.log('Markdown Compiler');
  console.log('Source:', config.source);
  console.log('Output:', config.output);
  console.log('');
  
  // Create output directory
  os.mkdir(config.output, 0o755);
  
  // Load global config
  const globalVars = loadIndexConfig(config.source);
  const templatesDir = `${config.source}/templates`;
  
  // Collect CSS and JS assets
  const assets = collectAssets(config.source);
  
  // Find and process files
  let files = findPublishableFiles(config.source);
  console.log('Found', files.length, 'publishable files');
  
  // Resolve filename conflicts
  files = resolveFilenameConflicts(files);
  
  // Compile each file
  for (const file of files) {
    try {
      // Extract summary
      file.summary = extractSummary(file);
      
      // Process abbreviations and wikilinks BEFORE markdown parsing
      let contentProcessed = processAbbreviations(file.content);
      contentProcessed = processWikilinks(contentProcessed);
      
      // Parse markdown to HTML
      const contentHtml = parseMarkdown(contentProcessed);
      
      // Highlight code
      const highlightedHtml = highlightCode(contentHtml);
      
      // Make URLs clickable
      const linkedHtml = makeUrlsClickable(highlightedHtml);
      
      // Embed images
      const embeddedHtml = embedImages(linkedHtml, config.source);
      
      // Select template
      const template = selectTemplate(file, templatesDir);
      
      // Prepare variables
      const vars = Object.assign({}, globalVars, file.data, {
        content: embeddedHtml,
        summary: file.summary
      });
      
      // Compile template
      let finalHtml = compileTemplate(template, vars, templatesDir);
      
      // Embed CSS and JS assets
      finalHtml = embedAssets(finalHtml, assets);
      
      // Write output
      const outputPath = `${config.output}/${file.outputName}`;
      const f = std.open(outputPath, 'w');
      f.puts(finalHtml);
      f.close();
      
      console.log('✓', file.outputName);
    } catch (e) {
      console.log('✗', file.path, ':', e.message);
    }
  }
  
  console.log('');
  console.log('Compilation complete!');
  
  // Generate paginated index
  generateIndex(files, config.output, templatesDir, globalVars, assets);
  
  // Generate tag pages
  generateTagPages(files, config.output, templatesDir, globalVars, assets);
  
  // Generate search page
  generateSearchPage(files, config.output, templatesDir, globalVars, assets);
  
  // Generate citation pages
  generateCitationPages(config.source, config.output, templatesDir, globalVars, assets);
}

function generateCitationPages(sourceDir, outputDir, templatesDir, globalVars, assets) {
  // Find all markdown files (including unpublished ones)
  const allFiles = walkDirectory(sourceDir);
  const citationFiles = new Map();
  
  for (const filepath of allFiles) {
    try {
      const parsed = parseMatterFromFile(filepath);
      if (parsed.data && parsed.data.publish === false) {
        const basename = filepath.split('/').pop().replace(/\.md$/, '');
        const sanitized = sanitizeFilename(parsed.data.title || basename);
        citationFiles.set(sanitized, {
          path: filepath,
          data: parsed.data,
          content: parsed.content
        });
      }
    } catch (e) {
      // Skip files that can't be parsed
    }
  }
  
  // Generate citation pages for unpublished files
  for (const [filename, file] of citationFiles) {
    const citationHtml = `<div class="citation">
  <h2>${file.data.title || 'Untitled'}</h2>
  ${file.data.author ? `<p><strong>Author:</strong> ${file.data.author}</p>` : ''}
  ${file.data.year ? `<p><strong>Year:</strong> ${file.data.year}</p>` : ''}
  ${file.data.source ? `<p><strong>Source:</strong> ${file.data.source}</p>` : ''}
  ${file.data.url ? `<p><strong>URL:</strong> <a href="${file.data.url}">${file.data.url}</a></p>` : ''}
  <div class="citation-content">
    ${parseMarkdown(file.content)}
  </div>
</div>`;
    
    const template = loadTemplate(templatesDir, 'citation.html') || loadTemplate(templatesDir, 'default.html');
    const vars = Object.assign({}, globalVars, file.data, {
      title: file.data.title || 'Citation',
      content: citationHtml
    });
    
    let html = compileTemplate(template, vars, templatesDir);
    html = embedAssets(html, assets);
    
    const outputFilename = `${filename}.html`;
    const f = std.open(`${outputDir}/${outputFilename}`, 'w');
    f.puts(html);
    f.close();
    
    console.log('✓', outputFilename, '(citation)');
  }
}

function generateSearchPage(files, outputDir, templatesDir, globalVars, assets) {
  // Generate search data JSON
  const searchData = files.map(file => ({
    title: file.data.title || 'Untitled',
    summary: file.summary,
    url: file.outputName,
    tags: file.data.tags || []
  }));
  
  const jsonFile = std.open(`${outputDir}/search-data.json`, 'w');
  jsonFile.puts(JSON.stringify(searchData));
  jsonFile.close();
  
  // Load fuzzy search library
  const fuzzySearchLib = std.loadFile('./lib/fuzzy-search.js');
  
  const searchHtml = `<h2>Search</h2>
<input type="text" id="search-input" placeholder="Search posts..." style="width: 100%; padding: 10px; font-size: 16px;" />
<div id="search-results" style="margin-top: 20px;"></div>

<script>
${fuzzySearchLib}

let searchData = [];
let fuse;

fetch('search-data.json')
  .then(r => r.json())
  .then(data => {
    searchData = data;
    fuse = new FuzzySearch(data, { keys: ['title', 'summary'] });
  });

document.getElementById('search-input').addEventListener('input', function(e) {
  const query = e.target.value;
  const results = fuse ? fuse.search(query) : [];
  
  const resultsDiv = document.getElementById('search-results');
  
  if (!query) {
    resultsDiv.innerHTML = '';
    return;
  }
  
  if (results.length === 0) {
    resultsDiv.innerHTML = '<p>No results found.</p>';
    return;
  }
  
  let html = '<ul class="search-results">';
  for (const result of results.slice(0, 10)) {
    const post = result.item;
    html += '<li><h3><a href="' + post.url + '">' + post.title + '</a></h3><p>' + post.summary + '</p></li>';
  }
  html += '</ul>';
  
  resultsDiv.innerHTML = html;
});
</script>`;
  
  const template = loadTemplate(templatesDir, 'search.html') || loadTemplate(templatesDir, 'default.html');
  const vars = Object.assign({}, globalVars, {
    title: 'Search',
    content: searchHtml
  });
  
  let html = compileTemplate(template, vars, templatesDir);
  html = embedAssets(html, assets);
  
  const f = std.open(`${outputDir}/search.html`, 'w');
  f.puts(html);
  f.close();
  
  console.log('✓ search.html');
  console.log('✓ search-data.json');
}

function generateTagPages(files, outputDir, templatesDir, globalVars, assets) {
  const tagMap = new Map();
  
  // Collect all tags
  for (const file of files) {
    const tags = file.data.tags || [];
    const tagArray = Array.isArray(tags) ? tags : [tags];
    
    for (const tag of tagArray) {
      if (!tag) continue;
      const tagKey = String(tag).toLowerCase();
      if (!tagMap.has(tagKey)) {
        tagMap.set(tagKey, []);
      }
      tagMap.get(tagKey).push(file);
    }
  }
  
  // Generate individual tag pages
  for (const [tag, posts] of tagMap) {
    const sanitized = sanitizeFilename(tag);
    let postsList = `<h2>Posts tagged: ${tag}</h2>\n<ul class="post-list">\n`;
    
    for (const post of posts) {
      postsList += `  <li>
    <h3><a href="${post.outputName}">${post.data.title || 'Untitled'}</a></h3>
    <p>${post.summary}</p>
  </li>\n`;
    }
    postsList += '</ul>\n';
    
    const template = loadTemplate(templatesDir, 'tag.html') || loadTemplate(templatesDir, 'default.html');
    const vars = Object.assign({}, globalVars, {
      title: `Tag: ${tag}`,
      content: postsList
    });
    
    let html = compileTemplate(template, vars, templatesDir);
    html = embedAssets(html, assets);
    
    const filename = `tag-${sanitized}.html`;
    const f = std.open(`${outputDir}/${filename}`, 'w');
    f.puts(html);
    f.close();
    
    console.log('✓', filename);
  }
  
  // Generate tags index page
  let tagsList = '<h2>All Tags</h2>\n<input type="text" id="tag-search" placeholder="Search tags..." />\n<ul id="tags-list" class="tags-list">\n';
  
  const sortedTags = Array.from(tagMap.keys()).sort();
  for (const tag of sortedTags) {
    const sanitized = sanitizeFilename(tag);
    const count = tagMap.get(tag).length;
    tagsList += `  <li><a href="tag-${sanitized}.html">${tag}</a> (${count})</li>\n`;
  }
  tagsList += '</ul>\n';
  
  tagsList += `<script>
document.getElementById('tag-search').addEventListener('input', function(e) {
  const search = e.target.value.toLowerCase();
  const items = document.querySelectorAll('#tags-list li');
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(search) ? '' : 'none';
  });
});
</script>\n`;
  
  const template = loadTemplate(templatesDir, 'tags.html') || loadTemplate(templatesDir, 'default.html');
  const vars = Object.assign({}, globalVars, {
    title: 'Tags',
    content: tagsList
  });
  
  let html = compileTemplate(template, vars, templatesDir);
  html = embedAssets(html, assets);
  
  const f = std.open(`${outputDir}/tags.html`, 'w');
  f.puts(html);
  f.close();
  
  console.log('✓ tags.html');
}

function generateIndex(files, outputDir, templatesDir, globalVars, assets) {
  const postsPerPage = 10;
  const sortedFiles = files.slice().sort((a, b) => {
    const dateA = a.data.date ? new Date(a.data.date) : new Date(0);
    const dateB = b.data.date ? new Date(b.data.date) : new Date(0);
    return dateB - dateA;
  });
  
  const totalPages = Math.ceil(sortedFiles.length / postsPerPage);
  
  for (let page = 1; page <= totalPages; page++) {
    const start = (page - 1) * postsPerPage;
    const end = start + postsPerPage;
    const pagePosts = sortedFiles.slice(start, end);
    
    let postsList = '<ul class="post-list">\n';
    for (const post of pagePosts) {
      postsList += `  <li>
    <h3><a href="${post.outputName}">${post.data.title || 'Untitled'}</a></h3>
    <p>${post.summary}</p>
    <small>${post.data.date || ''}</small>
  </li>\n`;
    }
    postsList += '</ul>\n';
    
    let pagination = '<div class="pagination">\n';
    if (page > 1) {
      const prevPage = page === 2 ? 'index.html' : `index-${page - 1}.html`;
      pagination += `  <a href="${prevPage}">← Previous</a>\n`;
    }
    pagination += `  <span>Page ${page} of ${totalPages}</span>\n`;
    if (page < totalPages) {
      pagination += `  <a href="index-${page + 1}.html">Next →</a>\n`;
    }
    pagination += '</div>\n';
    
    const template = loadTemplate(templatesDir, 'index.html') || loadTemplate(templatesDir, 'default.html');
    const vars = Object.assign({}, globalVars, {
      title: 'Blog Posts',
      content: postsList + pagination
    });
    
    let html = compileTemplate(template, vars, templatesDir);
    html = embedAssets(html, assets);
    
    const filename = page === 1 ? 'index.html' : `index-${page}.html`;
    const f = std.open(`${outputDir}/${filename}`, 'w');
    f.puts(html);
    f.close();
    
    console.log('✓', filename);
  }
}

main();
