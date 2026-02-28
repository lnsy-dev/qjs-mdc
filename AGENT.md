# AGENT.md - qjs-md Technical Reference for LLMs

## System Overview

**qjs-md** is a static site generator that compiles markdown files with YAML front matter into self-contained HTML files. Built entirely on QuickJS (a lightweight JavaScript engine), it requires no Node.js or npm dependencies.

### Design Philosophy

- **Zero runtime dependencies**: All assets (CSS, JS, images) are embedded directly into HTML
- **Pure QuickJS**: Uses only QuickJS standard library (`std`, `os`) with ES6 modules
- **Single-pass compilation**: Each markdown file is processed once through a linear pipeline
- **Flat output structure**: Nested source directories produce flat HTML output with conflict resolution
- **Self-contained output**: Generated HTML files are portable and work without a web server

### Key Capabilities

- YAML front matter parsing with custom minimal YAML parser
- Markdown to HTML conversion (snarkdown-based)
- Template system with variable substitution and includes
- Wikilinks `[[text]]` for internal linking with automatic filename resolution
- Inline SVG chart generation (bar, line, scatter, donut, heikin-ashi, map)
- Syntax highlighting for 10+ languages
- Asset embedding (CSS, JS, images as base64/inline SVG)
- Automatic page generation (paginated index, tag pages, search, citations)
- Abbreviation expansion with hover tooltips

---

## System Architecture

### Module Organization

```
qjs-md/
├── compiler.js              # Main orchestrator - entry point
├── mdc                      # Bash wrapper script (#!/bin/bash)
├── md-yaml.js              # YAML front matter parser
├── lib/
│   ├── markdown.js         # Markdown parser (snarkdown-based)
│   └── fuzzy-search.js     # Client-side fuzzy search library
├── src/
│   ├── utils/
│   │   ├── cli.js          # Command-line argument parsing
│   │   ├── file-ops.js     # File discovery and reading
│   │   ├── filename.js     # Filename sanitization and conflict resolution
│   │   └── css-parser.js   # Extract CSS color variables
│   ├── content/
│   │   └── processor.js    # Content transformations (wikilinks, abbr, code, summary)
│   ├── templates/
│   │   └── engine.js       # Template loading, selection, compilation
│   ├── assets/
│   │   └── handler.js      # CSS/JS/image collection and embedding
│   ├── generators/
│   │   ├── index.js        # Paginated index generation
│   │   ├── tags.js         # Tag pages generation
│   │   ├── search.js       # Search page and data generation
│   │   └── citations.js    # Citation pages for unpublished refs
│   └── plugins/
│       └── svg-charts.js   # SVG chart integration
└── plugins/
    ├── svg/                # Standalone SVG chart generator
    │   ├── generate-svg.js # CLI tool for chart generation
    │   └── src/
    │       ├── renderers/  # Chart type implementations
    │       └── utils/      # Chart utilities
    ├── js.js, py.js, rs.js, etc.  # Syntax highlighters
    └── ...
```

### Module Dependencies

```
compiler.js
├── md-yaml.js (YAML parsing)
├── lib/markdown.js (markdown → HTML)
├── src/utils/cli.js (argument parsing)
├── src/utils/file-ops.js (file discovery)
│   └── md-yaml.js
├── src/utils/filename.js (conflict resolution)
├── src/utils/css-parser.js (CSS color extraction)
├── src/content/processor.js (content transformations)
├── src/templates/engine.js (template system)
├── src/assets/handler.js (asset embedding)
├── src/plugins/svg-charts.js (chart rendering)
│   └── plugins/svg/src/renderers/* (chart types)
└── src/generators/* (page generation)
    ├── index.js
    ├── tags.js
    ├── search.js
    └── citations.js
```

---

## Compilation Pipeline

The compilation process follows a strict linear pipeline for each markdown file:

### Phase 1: Initialization
```
1. Parse CLI arguments (source dir, output dir)
2. Load global config from index.json
3. Collect CSS/JS assets from source directory
4. Extract CSS color variables for SVG rendering
5. Discover all .md files recursively
6. Filter files with publish: true
7. Resolve filename conflicts (append -2, -3, etc.)
```

### Phase 2: Per-File Processing
```
For each markdown file:
  1. Extract summary (first paragraph or custom from front matter)
  2. Process abbreviations (*[ABBR]: expansion)
  3. Process wikilinks ([[Page Title]] → <a href="page-title.html">)
  4. Parse markdown to HTML (snarkdown)
  5. Process SVG charts (```chart blocks → inline SVG)
  6. Highlight code blocks (```js → syntax highlighted HTML)
  7. Make URLs clickable (http://... → <a href>)
  8. Embed images (SVG inline, others as base64)
  9. Select template (type.html → post.html → default.html)
  10. Compile template with variables
  11. Embed CSS/JS assets in <head>
  12. Write output HTML file
```

### Phase 3: Auxiliary Page Generation
```
1. Generate paginated index (index.html, index-2.html, ...)
2. Generate tag pages (tag-javascript.html, tag-tutorial.html, ...)
3. Generate tags index (tags.html with search)
4. Generate search page (search.html + search-data.json)
5. Generate citation pages (for publish: false files)
```

### Data Flow

```
Markdown File (.md)
    ↓
[YAML Parser] → Front Matter Data (title, date, tags, etc.)
    ↓
[Content Processor] → Abbreviations expanded, wikilinks resolved
    ↓
[Markdown Parser] → HTML content
    ↓
[SVG Chart Processor] → Chart code blocks → inline SVG
    ↓
[Code Highlighter] → Syntax highlighted code blocks
    ↓
[URL Processor] → Clickable links
    ↓
[Image Embedder] → Embedded images (base64/inline)
    ↓
[Template Engine] → HTML with variables substituted
    ↓
[Asset Embedder] → CSS/JS embedded in <head>
    ↓
Output HTML File
```

---

## Core Modules

### compiler.js - Main Orchestrator

**Purpose**: Entry point that coordinates the entire compilation process.

**Key Functions**:
- `main()` - Orchestrates all compilation phases

**Data Structures**:
```javascript
// File object structure
{
  path: string,           // Original file path
  outputName: string,     // Sanitized output filename
  content: string,        // Markdown content (without front matter)
  data: {                 // Front matter data
    title: string,
    publish: boolean,
    date: string,
    tags: string[],
    type?: string,
    summary?: string,
    // ... custom fields
  },
  summary: string         // Extracted or custom summary
}

// Config object
{
  source: string,         // Source directory path
  output: string          // Output directory path
}

// Assets object
{
  css: string,           // Concatenated CSS content
  js: string             // Concatenated JS content
}
```

**Process Flow**:
1. Parse arguments → config object
2. Load global variables from index.json
3. Collect assets (CSS/JS files)
4. Find publishable files → array of file objects
5. Resolve filename conflicts
6. For each file: process → compile → write
7. Generate auxiliary pages

---

### md-yaml.js - YAML Front Matter Parser

**Purpose**: Parse YAML front matter from markdown files.

**Key Functions**:
- `parseYAML(str)` - Parse YAML string to JavaScript object
- `parseMatterFromFile(path)` - Read file and extract front matter + content

**Supported YAML Features**:
- Key-value pairs: `key: value`
- Strings: quoted and unquoted
- Numbers: integers and floats
- Booleans: `true`, `false`
- Arrays: `[1, 2, 3]` or multi-line with `-`
- Objects: `{a: 1}` or multi-line with indentation
- Multi-line strings: `|` (literal) and `>` (folded)
- Comments: `# comment`

**Return Structure**:
```javascript
{
  data: {              // Parsed YAML object
    title: string,
    publish: boolean,
    // ... other fields
  },
  content: string      // Markdown content after front matter
}
```

**Implementation Notes**:
- Custom minimal YAML parser (no external dependencies)
- Handles indentation-based nesting
- Supports both inline and multi-line syntax
- Gracefully handles missing front matter (returns empty data)

---

### lib/markdown.js - Markdown Parser

**Purpose**: Convert markdown syntax to HTML.

**Key Function**:
- `parse(markdown)` - Convert markdown string to HTML string

**Supported Markdown Features**:
- Headers: `# H1` through `###### H6`
- Bold: `**text**` or `__text__`
- Italic: `*text*` or `_text_`
- Links: `[text](url)`
- Images: `![alt](src)`
- Code: `` `inline` `` and ``` ```block``` ```
- Lists: ordered (`1.`) and unordered (`-`, `*`)
- Blockquotes: `> quote`
- Horizontal rules: `---`

**Implementation**:
- Based on snarkdown (minimal markdown parser)
- Single-pass regex-based parsing
- No support for tables or footnotes (by design)

---

### src/utils/cli.js - Command-Line Interface

**Purpose**: Parse command-line arguments and display help.

**Key Function**:
- `parseArgs(args)` - Parse scriptArgs array into config object

**Supported Arguments**:
- `<source-directory>` - First positional argument (required)
- `--output <dir>` or `-o <dir>` - Output directory (required)
- `--help` or `-h` - Display help message

**Return Structure**:
```javascript
{
  source: string,      // Absolute path to source directory
  output: string       // Absolute path to output directory
}
```

**Error Handling**:
- Exits with error if source or output not provided
- Displays help message on --help or invalid arguments

---

### src/utils/file-ops.js - File Operations

**Purpose**: Discover and read markdown files recursively.

**Key Functions**:
- `findPublishableFiles(sourceDir)` - Find all .md files with publish: true
- `walkDirectory(dir, files)` - Recursively walk directory tree

**Return Structure**:
```javascript
[
  {
    path: string,           // Full path to .md file
    outputName: string,     // Initial output filename (may have conflicts)
    content: string,        // Markdown content
    data: object           // Front matter data
  },
  // ... more files
]
```

**Implementation Notes**:
- Uses QuickJS `os.readdir()` for directory listing
- Recursively traverses nested directories
- Filters files with `publish: true` in front matter
- Skips `templates/` directory
- Generates initial output filename from source filename

---

### src/utils/filename.js - Filename Sanitization

**Purpose**: Sanitize filenames and resolve conflicts.

**Key Functions**:
- `sanitizeFilename(name)` - Convert to lowercase-dashed format
- `resolveFilenameConflicts(files)` - Append numbers to duplicate filenames

**Sanitization Rules**:
- Convert to lowercase
- Replace spaces with dashes
- Remove special characters (keep alphanumeric and dashes)
- Add `.html` extension

**Conflict Resolution**:
- Detect duplicate output filenames
- Append `-2`, `-3`, etc. to duplicates
- Preserves original order

**Example**:
```
"My Blog Post.md" → "my-blog-post.html"
"My Blog Post (2).md" → "my-blog-post-2.html"
```


---

### src/utils/css-parser.js - CSS Color Extraction

**Purpose**: Extract CSS color variables for SVG chart rendering.

**Key Function**:
- `extractCSSColors(css)` - Parse CSS and extract color definitions

**Return Structure**:
```javascript
{
  primary: string,     // Hex color code
  secondary: string,
  accent: string,
  // ... other color variables
}
```

**Implementation**:
- Parses CSS custom properties (`:root { --color: #hex; }`)
- Extracts hex color codes
- Returns object mapping variable names to colors
- Used by SVG chart renderer for consistent styling

---

### src/content/processor.js - Content Transformations

**Purpose**: Transform markdown content before and after parsing.

**Key Functions**:

#### `extractSummary(file)`
- Extracts first paragraph as summary
- Returns custom summary from front matter if provided
- Strips HTML tags and limits length
- Used for index pages and meta tags

#### `processAbbreviations(content)`
- Finds abbreviation definitions: `*[HTML]: HyperText Markup Language`
- Removes definition lines from content
- Replaces all occurrences with `<abbr title="expansion">ABBR</abbr>`
- Case-sensitive matching

**Example**:
```markdown
*[CSS]: Cascading Style Sheets
I love CSS!
```
→
```html
I love <abbr title="Cascading Style Sheets">CSS</abbr>!
```

#### `processWikilinks(content)`
- Finds wikilinks: `[[Page Title]]`
- Converts to HTML links: `<a href="page-title.html">Page Title</a>`
- Sanitizes href using same rules as filename sanitization
- Capitalizes display text

**Example**:
```markdown
See [[my other post]] for details.
```
→
```html
See <a href="my-other-post.html">My Other Post</a> for details.
```

#### `highlightCode(html)`
- Finds code blocks: `<pre><code class="language-js">...</code></pre>`
- Applies syntax highlighting based on language
- Supports: js, py, rs, c, rb, html, css, json, toml, yaml
- Returns HTML with `<kw>`, `<str>`, `<cmt>`, `<num>` tags

**Highlighting Strategy**:
- Keywords: `<kw>keyword</kw>`
- Strings: `<str>"string"</str>`
- Comments: `<cmt>// comment</cmt>`
- Numbers: `<num>123</num>`
- CSS styling applied via embedded stylesheet

#### `makeUrlsClickable(html)`
- Finds plain URLs in text: `http://example.com`
- Converts to clickable links: `<a href="...">...</a>`
- Preserves existing links (doesn't double-wrap)

---

### src/templates/engine.js - Template System

**Purpose**: Load, select, and compile HTML templates with variable substitution.

**Key Functions**:

#### `loadIndexConfig(sourceDir)`
- Reads `index.json` from source directory
- Returns parsed JSON object with global variables
- Returns empty object if file doesn't exist

#### `selectTemplate(file, templatesDir)`
- Selects template based on priority:
  1. `{type}.html` if `type` field in front matter
  2. `post.html` if exists
  3. `default.html` (fallback)
- Returns template content as string

#### `loadTemplate(name, templatesDir)`
- Reads template file from templates directory
- Returns template content as string
- Throws error if template not found

#### `compileTemplate(template, vars, templatesDir)`
- Two-pass compilation:
  1. **First pass**: Replace includes `{{header.html}}` with template content
  2. **Second pass**: Replace variables `{{title}}` with values
- Silent failure for missing variables (replaced with empty string)
- Recursive include support

**Variable Substitution**:
```javascript
// Template
<h1>{{title}}</h1>
<div>{{content}}</div>

// Variables
{
  title: "My Post",
  content: "<p>Hello world</p>"
}

// Result
<h1>My Post</h1>
<div><p>Hello world</p></div>
```

**Template Includes**:
```html
<!-- default.html -->
<!DOCTYPE html>
<html>
<head>{{header.html}}</head>
<body>{{content}}</body>
</html>

<!-- header.html -->
<title>{{title}}</title>
<meta name="description" content="{{summary}}">
```

**Variable Priority** (later overrides earlier):
1. Global variables from `index.json`
2. Front matter data
3. Generated variables (content, summary)

---

### src/assets/handler.js - Asset Management

**Purpose**: Collect and embed CSS, JavaScript, and images.

**Key Functions**:

#### `collectAssets(sourceDir)`
- Finds all `.css` and `.js` files in source directory
- Reads and concatenates content
- Returns assets object: `{ css: string, js: string }`
- Skips files in `templates/` directory

#### `embedAssets(html, assets)`
- Embeds CSS in `<style>` tags
- Embeds JS in `<script>` tags
- Inserts into `<head>` section
- Returns modified HTML

**Embedding Strategy**:
```html
<head>
  <style>
    /* Concatenated CSS from all .css files */
  </style>
  <script>
    // Concatenated JS from all .js files
  </script>
</head>
```

#### `embedImages(html, sourceDir)`
- Finds all `<img>` tags in HTML
- Processes based on image type:
  - **SVG files**: Read and inline as `<svg>` element
  - **External URLs** (http/https): Fetch and convert to base64
  - **Local images**: Read and convert to base64 data URI
- Replaces `<img>` tags with embedded content

**Image Embedding Examples**:
```html
<!-- Before -->
<img src="diagram.svg" alt="Diagram">
<img src="photo.jpg" alt="Photo">

<!-- After -->
<svg>...</svg>  <!-- Inline SVG -->
<img src="data:image/jpeg;base64,..." alt="Photo">
```

---

### src/plugins/svg-charts.js - SVG Chart Integration

**Purpose**: Convert chart code blocks to inline SVG during compilation.

**Key Function**:
- `processSVGCharts(html, sourceDir, cssColors)` - Find and render chart blocks

**Supported Chart Types**:
- `bar` or `chart` - Bar charts (vertical/horizontal)
- `line` - Line graphs with multiple series
- `scatter` - Scatter plots with optional categories
- `donut` - Donut/pie charts
- `heikin-ashi` - Candlestick charts
- `map` - Geographic maps from GeoJSON

**Process Flow**:
1. Find code blocks with chart language: `<pre><code class="language-bar">...</code></pre>`
2. Extract data and optional YAML configuration
3. Call appropriate renderer from `plugins/svg/src/renderers/`
4. Generate inline SVG
5. Replace code block with SVG

**Data Format Support**:
- JSON: `[{"label": "A", "value": 10}]`
- CSV: `label,value\nA,10`
- GeoJSON: For map charts

**Configuration via YAML Front Matter**:
````markdown
```bar
---
width: 800
height: 400
orientation: horizontal
---
[{"label": "Q1", "value": 100}]
```
````

**Chart Renderers** (in `plugins/svg/src/renderers/`):
- `bar.js` - Vertical/horizontal bar charts with patterns
- `line.js` - Multi-series line graphs with legends
- `scatter.js` - Scatter plots with category grouping
- `donut.js` - Donut charts with percentage labels
- `heikin-ashi.js` - Candlestick financial charts
- `map.js` - Geographic maps with GeoJSON support

**Styling**:
- Uses CSS colors extracted from stylesheet
- Monochrome patterns for print-friendly output
- Responsive SVG with viewBox

---

## Page Generators

### src/generators/index.js - Paginated Index

**Purpose**: Generate paginated index pages listing all posts.

**Key Function**:
- `generateIndex(files, outputDir, templatesDir, globalVars, assets)`

**Features**:
- 10 posts per page (configurable)
- Sorted by date (newest first)
- Pagination links (Previous/Next)
- Uses `index.html` template or `default.html`

**Generated Files**:
- `index.html` - First page
- `index-2.html`, `index-3.html`, etc. - Additional pages

**Template Variables**:
```javascript
{
  posts: [
    {
      title: string,
      url: string,
      date: string,
      summary: string,
      tags: string[]
    },
    // ... up to 10 posts
  ],
  currentPage: number,
  totalPages: number,
  prevPage: string | null,
  nextPage: string | null
}
```

---

### src/generators/tags.js - Tag Pages

**Purpose**: Generate individual tag pages and tags index.

**Key Function**:
- `generateTagPages(files, outputDir, templatesDir, globalVars, assets)`

**Generated Files**:
- `tags.html` - Index of all tags with search
- `tag-{name}.html` - Individual page for each tag

**Tags Index Features**:
- Lists all tags with post counts
- Client-side search/filter
- Alphabetically sorted

**Individual Tag Pages**:
- Lists all posts with that tag
- Sorted by date
- Links back to tags index

**Template Variables** (tag page):
```javascript
{
  tag: string,              // Tag name
  posts: [                  // Posts with this tag
    {
      title: string,
      url: string,
      date: string,
      summary: string
    }
  ]
}
```

---

### src/generators/search.js - Search Functionality

**Purpose**: Generate search page and search data index.

**Key Function**:
- `generateSearchPage(files, outputDir, templatesDir, globalVars, assets)`

**Generated Files**:
- `search.html` - Search interface
- `search-data.json` - Search index

**Search Data Structure**:
```javascript
[
  {
    title: string,
    url: string,
    summary: string,
    tags: string[],
    content: string        // Plain text content for searching
  },
  // ... all posts
]
```

**Search Implementation**:
- Client-side fuzzy search using `lib/fuzzy-search.js`
- Searches title, summary, tags, and content
- Real-time results as user types
- No server required

---

### src/generators/citations.js - Citation Pages

**Purpose**: Generate citation pages for unpublished references.

**Key Concept**:
- Files with `publish: false` become citation pages
- Can be referenced via wikilinks from published posts
- Useful for footnotes, references, unpublished sources

**Process**:
1. Find all files with `publish: false`
2. Process content (markdown → HTML)
3. Use `citation.html` template or `default.html`
4. Generate HTML file (can be linked via wikilinks)

**Use Case Example**:
```markdown
<!-- research-paper.md -->
---
title: Important Research
publish: false
author: Dr. Smith
year: 2025
---
Citation details here...

<!-- blog-post.md -->
---
title: My Analysis
publish: true
---
Based on [[Important Research]], we can conclude...
```

Result: `important-research.html` is generated and linked from `my-analysis.html`

---

## Extension Points

### Adding New Chart Types

1. Create renderer in `plugins/svg/src/renderers/new-chart.js`:
```javascript
export function render(data, config) {
  // Return SVG string
  return `<svg>...</svg>`;
}
```

2. Register in `plugins/svg/src/registry.js`:
```javascript
import * as newChart from './renderers/new-chart.js';

export const renderers = {
  'new-chart': newChart,
  // ... existing renderers
};
```

3. Use in markdown:
````markdown
```new-chart
[{"x": 1, "y": 2}]
```
````

### Adding New Syntax Highlighters

1. Create highlighter in `plugins/lang.js`:
```javascript
export function highlight(code) {
  return code
    .replace(/keyword/g, '<kw>keyword</kw>')
    .replace(/"string"/g, '<str>"string"</str>');
}
```

2. Import in `src/content/processor.js`:
```javascript
import * as lang from '../../plugins/lang.js';
```

3. Add to `highlightCode()` function:
```javascript
if (lang === 'lang') {
  highlighted = lang.highlight(code);
}
```

### Adding New Page Generators

1. Create generator in `src/generators/new-page.js`:
```javascript
export function generateNewPage(files, outputDir, templatesDir, globalVars, assets) {
  // Process files
  // Generate HTML
  // Write to outputDir
}
```

2. Import and call in `compiler.js`:
```javascript
import { generateNewPage } from './src/generators/new-page.js';

// In main() after other generators
generateNewPage(files, config.output, templatesDir, globalVars, assets);
```

### Adding New Content Processors

Add processing step in `compiler.js` pipeline:
```javascript
// After existing processors
const processedHtml = myCustomProcessor(embeddedHtml);
```

---

## QuickJS-Specific Considerations

### ES6 Module System
- Uses `import`/`export` syntax (not CommonJS `require`)
- All imports must include `.js` extension
- Relative imports: `./file.js`, `../../lib/file.js`

### Standard Library APIs

**File I/O** (`std` module):
```javascript
import * as std from 'std';

// Read file
const f = std.open(path, 'r');
const content = f.readAsString();
f.close();

// Write file
const f = std.open(path, 'w');
f.puts(content);
f.close();

// Exit
std.exit(1);
```

**OS Operations** (`os` module):
```javascript
import * as os from 'os';

// Read directory
const [entries, err] = os.readdir(path);

// Create directory
os.mkdir(path, 0o755);

// Execute command
os.exec(['curl', url]);
```

### Limitations
- No `fetch()` API (use `os.exec(['curl', ...])`)
- No `Buffer` class (use strings or typed arrays)
- No `process.env` (use `std.getenv()`)
- No `__dirname` (use `scriptArgs[0]` and path manipulation)

### Performance Characteristics
- Fast startup time (< 10ms)
- Low memory footprint
- Single-threaded execution
- No JIT compilation (interpreter only)

---

## Data Structures Reference

### File Object (Complete)
```javascript
{
  path: string,              // "/path/to/source/post.md"
  outputName: string,        // "post.html" or "post-2.html"
  content: string,           // Markdown content (no front matter)
  data: {                    // Front matter (all optional except publish)
    title: string,           // Post title
    publish: boolean,        // true = published, false = citation
    date: string,            // ISO date or any format
    tags: string[],          // Array of tag strings
    type: string,            // Template type (optional)
    summary: string,         // Custom summary (optional)
    // ... any custom fields
  },
  summary: string            // Extracted or custom summary
}
```

### Config Object
```javascript
{
  source: string,            // Absolute path to source directory
  output: string             // Absolute path to output directory
}
```

### Assets Object
```javascript
{
  css: string,               // Concatenated CSS content
  js: string                 // Concatenated JS content
}
```

### Global Variables (from index.json)
```javascript
{
  siteName: string,
  siteUrl: string,
  author: string,
  // ... any custom fields
}
```

---

## Common Patterns

### Reading Files
```javascript
import * as std from 'std';

function readFile(path) {
  const f = std.open(path, 'r');
  if (!f) return null;
  const content = f.readAsString();
  f.close();
  return content;
}
```

### Writing Files
```javascript
import * as std from 'std';

function writeFile(path, content) {
  const f = std.open(path, 'w');
  f.puts(content);
  f.close();
}
```

### Walking Directories
```javascript
import * as os from 'os';

function walkDir(dir, callback) {
  const [entries] = os.readdir(dir);
  for (const entry of entries) {
    const path = `${dir}/${entry}`;
    const [stat] = os.stat(path);
    if (stat.mode & os.S_IFDIR) {
      walkDir(path, callback);
    } else {
      callback(path);
    }
  }
}
```

### Error Handling
```javascript
try {
  // Operation that might fail
  const f = std.open(path, 'r');
  if (!f) throw new Error(`Cannot open ${path}`);
  // ...
} catch (e) {
  console.log('Error:', e.message);
  std.exit(1);
}
```

---

## Testing and Debugging

### Running the Compiler
```bash
# Direct execution
qjs compiler.js /path/to/source --output /path/to/output

# Via wrapper script
./mdc /path/to/source --output /path/to/output
```

### Test Suite
```bash
# Run test compilation
./build-test.sh

# Compiles test-notebook/ → test-website/
# Includes examples of all features
```

### Debugging Tips
- Add `console.log()` statements (output to stderr)
- Check generated HTML in output directory
- Verify front matter parsing with test files
- Test individual modules in isolation
- Use `qjs` REPL for quick tests

### Common Issues
1. **Missing template**: Ensure `default.html` exists in `templates/`
2. **Wikilink not working**: Check filename sanitization matches
3. **Chart not rendering**: Verify JSON/CSV format and chart type
4. **Asset not embedded**: Ensure file is in source directory (not templates/)
5. **Front matter not parsed**: Check YAML syntax (indentation, colons)

---

## Performance Optimization

### Compilation Speed
- Typical: 10-50 posts in < 1 second
- Bottlenecks: Image embedding, SVG chart generation
- Optimization: Cache parsed templates, minimize file I/O

### Output Size
- Typical: 2-5KB per page (with embedded assets)
- Factors: Number of images, CSS/JS size, chart complexity
- Optimization: Minify CSS/JS, optimize images before embedding

### Memory Usage
- QuickJS has low memory footprint
- No memory leaks (garbage collected)
- Large files (>1MB) may be slow to process

---

## Security Considerations

### Input Validation
- YAML parser handles malformed input gracefully
- Markdown parser escapes HTML by default (via snarkdown)
- File paths are not sanitized (trusted input assumed)

### Output Safety
- Generated HTML is safe (no user input in templates)
- Embedded images are base64-encoded (no XSS risk)
- External URLs in images are fetched at compile time (not runtime)

### Recommendations
- Run compiler in isolated environment
- Validate source directory contents before compilation
- Review generated HTML before deployment
- Use HTTPS for external image URLs

---

## Future Extension Ideas

### Potential Features
- **RSS/Atom feed generation**: Generate feed.xml from posts
- **Sitemap generation**: Generate sitemap.xml for SEO
- **Table of contents**: Auto-generate TOC from headers
- **Related posts**: Suggest related posts based on tags
- **Draft preview**: Generate drafts in separate directory
- **Asset optimization**: Minify CSS/JS, compress images
- **Incremental builds**: Only recompile changed files
- **Watch mode**: Auto-recompile on file changes
- **Plugin system**: Load external plugins dynamically

### Architecture Improvements
- **Parallel processing**: Compile multiple files concurrently
- **Caching**: Cache parsed templates and assets
- **Streaming**: Process large files in chunks
- **Error recovery**: Continue compilation on individual file errors

---

## Conclusion

qjs-md is a complete, self-contained static site generator built on QuickJS. Its modular architecture makes it easy to understand, extend, and maintain. The compilation pipeline is straightforward, and the output is portable and dependency-free.

**Key Strengths**:
- Zero dependencies beyond QuickJS
- Fast compilation
- Self-contained output
- Simple, readable codebase
- Extensible architecture

**Best Use Cases**:
- Personal blogs
- Technical documentation
- Project websites
- Digital gardens
- Static portfolios

For user-facing documentation, see README.md.
