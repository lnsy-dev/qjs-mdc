/**
 * @fileoverview qjs-md — JavaScript Library Entry Point
 *
 * A fast markdown processing library for QuickJS projects. Import this module
 * (or the bundled dist/qjs-md.js) to use any of qjs-md's features individually
 * or run the full compilation pipeline.
 *
 * @module qjs-md
 */

// ── Markdown Parsing ──────────────────────────────────────────────────────────

/**
 * @feature parseMarkdown
 * @description Converts a markdown string to HTML. Supports headings (h1–h6),
 *   bold, italic, links, images, inline code, fenced code blocks, blockquotes,
 *   ordered and unordered lists, task list items (- [ ] / - [x]), strikethrough,
 *   and horizontal rules.
 * @param {string} md - Markdown source string
 * @returns {string} HTML string
 * @example
 *   import { parseMarkdown } from './qjs-md.js';
 *   const html = parseMarkdown('# Hello\n\nWorld');
 *   // → '<h1>Hello</h1>\n<p>World</p>'
 */
export { parse as parseMarkdown } from '../lib/markdown.js';

/**
 * @feature parseFrontMatter
 * @description Reads a markdown file from disk, parses the optional YAML front
 *   matter block (delimited by `---`), and returns `{ data, content }` where
 *   `data` is a plain object of parsed YAML fields and `content` is the
 *   remaining markdown body.
 * @param {string} filePath - Absolute or relative path to the `.md` file
 * @returns {{ data: Object, content: string }} Parsed front matter and body
 * @example
 *   import { parseFrontMatter } from './qjs-md.js';
 *   const { data, content } = parseFrontMatter('post.md');
 *   // data.title, data.date, data.tags, etc.
 */
export { parseMatterFromFile as parseFrontMatter } from '../lib/md-yaml.js';

/**
 * @feature parseToAST
 * @description Converts a markdown string into a structured JSON AST where
 *   headings create nested section nodes that contain their subsequent
 *   paragraphs, lists, code blocks, and sub-sections as children. Useful for
 *   analysing or transforming document structure.
 * @param {string} markdownContent - Markdown source string
 * @returns {Object} Document node with `type`, `children`, and `content` fields
 * @example
 *   import { parseToAST } from './qjs-md.js';
 *   const ast = parseToAST('# Title\n\nParagraph\n\n## Sub\n\nMore text');
 *   // ast.children[0].type === 'section', ast.children[0].heading === 'Title'
 */
export { parseToAST } from '../lib/md-ast.js';

// ── Content Processors ────────────────────────────────────────────────────────

/**
 * @feature processWikilinks
 * @description Converts `[[Page Title]]` wikilink syntax into HTML anchor tags.
 *   The page title is lowercased and spaces are replaced with hyphens to form
 *   the href (e.g. `[[My Page]]` → `<a href="my-page.html">My Page</a>`).
 * @param {string} content - Markdown or HTML string containing wikilinks
 * @returns {string} String with wikilinks replaced by `<a>` tags
 * @example
 *   import { processWikilinks } from './qjs-md.js';
 *   processWikilinks('See [[Getting Started]] for details');
 *   // → 'See <a href="getting-started.html">Getting Started</a> for details'
 */
export { processWikilinks } from './content/wikilinks.js';

/**
 * @feature makeUrlsClickable
 * @description Wraps bare `http://` and `https://` URLs that are not already
 *   inside an HTML attribute with `<a href="…">` anchor tags. Useful for
 *   making raw URLs in plain-text content navigable.
 * @param {string} html - HTML string that may contain bare URLs
 * @returns {string} HTML string with bare URLs wrapped in anchor tags
 * @example
 *   import { makeUrlsClickable } from './qjs-md.js';
 *   makeUrlsClickable('Visit https://example.com today');
 *   // → 'Visit <a href="https://example.com">https://example.com</a> today'
 */
export { makeUrlsClickable } from './content/urls.js';

/**
 * @feature processAbbreviations
 * @description Processes `*[TERM]: Definition` abbreviation definitions in a
 *   markdown string. Each definition line is stripped from the output and every
 *   occurrence of the term in the remaining text is wrapped in an
 *   `<abbr title="Definition">TERM</abbr>` tag. Longer terms are matched first
 *   to avoid partial replacement.
 * @param {string} content - Markdown string with optional abbreviation definitions
 * @returns {string} Markdown with abbreviation lines removed and terms wrapped
 * @example
 *   import { processAbbreviations } from './qjs-md.js';
 *   processAbbreviations('*[HTML]: HyperText Markup Language\nWrite HTML fast.');
 *   // → 'Write <abbr title="HyperText Markup Language">HTML</abbr> fast.'
 */
export { processAbbreviations } from './content/abbreviations.js';

/**
 * @feature processFootnotes
 * @description Converts markdown footnote syntax (`[^ref]` inline markers and
 *   `[^ref]: text` definition lines) into HTML. Inline markers become
 *   superscript links; definitions are collected into a numbered `<ol>` inside
 *   a `<div class="footnotes">` block appended to the content.
 * @param {string} content - Markdown string with optional footnotes
 * @returns {{ content: string, footnotesHtml: string }} Body without definition
 *   lines, plus the rendered footnotes HTML block
 * @example
 *   import { processFootnotes } from './qjs-md.js';
 *   const { content, footnotesHtml } = processFootnotes(
 *     'See note[^1].\n\n[^1]: Important detail.'
 *   );
 */
export { processFootnotes } from './content/footnotes.js';

/**
 * @feature highlightCode
 * @description Applies syntax highlighting to fenced code blocks in HTML.
 *   Detects `<code class="language-X">` blocks produced by the markdown parser
 *   and replaces their content with tokenised, span-wrapped HTML for these
 *   languages: JavaScript/TypeScript, Python, Rust, Ruby, C, JSON, YAML,
 *   TOML, CSS, and HTML. Colors are controlled by CSS custom properties.
 * @param {string} html - HTML string containing fenced code blocks
 * @returns {string} HTML with syntax-highlighted code blocks
 * @example
 *   import { highlightCode } from './qjs-md.js';
 *   const highlighted = highlightCode('<pre><code class="language-js">const x = 1;</code></pre>');
 */
export { highlightCode } from './content/highlight.js';

/**
 * @feature extractSummary
 * @description Extracts a short summary from a parsed markdown file object.
 *   Returns the `summary` front matter field if present; otherwise falls back
 *   to the first `<p>` tag found in the rendered HTML content.
 * @param {Object} file - File object with `data` (front matter) and `content` fields
 * @returns {string} Summary HTML string, or empty string if none found
 * @example
 *   import { extractSummary } from './qjs-md.js';
 *   const summary = extractSummary({ data: {}, content: '<p>First para</p><p>More</p>' });
 *   // → '<p>First para</p>'
 */
export { extractSummary } from './content/summary.js';

// ── Table Processing ──────────────────────────────────────────────────────────

/**
 * @feature processTables
 * @description Converts GitHub-Flavored Markdown pipe tables embedded in `<p>`
 *   tags (as produced by the markdown parser) into proper HTML `<table>` elements
 *   with `<thead>`, `<tbody>`, `<th>`, and `<td>` cells. Supports left, right,
 *   and centre column alignment via GFM separator syntax (`:---`, `---:`, `:---:`).
 * @param {string} html - HTML string that may contain pipe-table paragraphs
 * @returns {string} HTML with pipe tables replaced by `<table>` elements
 * @example
 *   import { processTables } from './qjs-md.js';
 *   processTables('<p>| A | B |\n| --- | --- |\n| 1 | 2 |</p>');
 *   // → '<table><thead>…</thead><tbody>…</tbody></table>'
 */
export { processTables } from '../plugins/tables.js';

// ── SVG Charts ────────────────────────────────────────────────────────────────

/**
 * @feature processSVGCharts
 * @description Converts fenced `chart` code blocks into inline SVG images at
 *   compile time. Chart data is written in a simple YAML-like syntax inside the
 *   code block. Supported chart types: `bar`, `line`, `scatter`, `donut`,
 *   `heikin-ashi` (candlestick), and `map` (GeoJSON choropleth). SVG colors
 *   are driven by CSS custom properties extracted from the site stylesheet.
 * @param {string} html - HTML string containing chart code blocks
 * @param {string} sourceDir - Path to the source directory (used to resolve map data files)
 * @param {string[]} cssColors - Array of CSS color variable declarations
 * @returns {string} HTML with chart code blocks replaced by inline `<svg>` elements
 * @example
 *   import { processSVGCharts } from './qjs-md.js';
 *   const html = processSVGCharts(rawHtml, '/my/site', []);
 */
export { processSVGCharts } from './plugins/svg-charts.js';

// ── Template Engine ───────────────────────────────────────────────────────────

/**
 * @feature loadIndexConfig
 * @description Reads and parses the `templates/index.json` file from the given
 *   source directory, returning its contents as a plain object. This file
 *   contains global site variables (site name, author, description, etc.) that
 *   are available as template variables on every page.
 * @param {string} sourceDir - Path to the directory containing `templates/index.json`
 * @returns {Object} Parsed JSON object, or `{}` if the file is missing
 * @example
 *   import { loadIndexConfig } from './qjs-md.js';
 *   const globals = loadIndexConfig('/my/site');
 *   // globals.site_name, globals.author, etc.
 */
export { loadIndexConfig } from './templates/engine.js';

/**
 * @feature selectTemplate
 * @description Chooses the best matching HTML template for a given file based
 *   on the file's `type` front matter field. Lookup order: `{type}.html` →
 *   `post.html` → `default.html`. Returns the raw template string.
 * @param {Object} file - File object with a `data.type` field
 * @param {string} templatesDir - Path to the templates directory
 * @returns {string} Template HTML string
 * @example
 *   import { selectTemplate } from './qjs-md.js';
 *   const tpl = selectTemplate({ data: { type: 'note' } }, '/my/site/templates');
 */
export { selectTemplate } from './templates/engine.js';

/**
 * @feature compileTemplate
 * @description Substitutes `{{variableName}}` placeholders in a template string
 *   with values from the `vars` object, and resolves `{{*.html}}` include
 *   directives by loading and recursively compiling the referenced partial.
 * @param {string} template - Template HTML string with `{{…}}` placeholders
 * @param {Object} vars - Key→value map of variables to substitute
 * @param {string} templatesDir - Path to the templates directory (for includes)
 * @returns {string} Rendered HTML string
 * @example
 *   import { compileTemplate } from './qjs-md.js';
 *   const html = compileTemplate('<h1>{{title}}</h1>', { title: 'Hello' }, '/tpl');
 *   // → '<h1>Hello</h1>'
 */
export { compileTemplate } from './templates/engine.js';

// ── Asset Handling ────────────────────────────────────────────────────────────

/**
 * @feature collectAssets
 * @description Reads `templates/style.css` and `templates/index.js` from the
 *   given source directory and returns them as `{ css: string[], js: string[] }`
 *   arrays ready for embedding. Returns empty arrays if the files are absent.
 * @param {string} sourceDir - Path to the directory containing the `templates/` folder
 * @returns {{ css: string[], js: string[] }} Collected asset content arrays
 * @example
 *   import { collectAssets } from './qjs-md.js';
 *   const assets = collectAssets('/my/site');
 *   // assets.css[0] — CSS content string
 */
export { collectAssets } from './assets/handler.js';

/**
 * @feature embedAssets
 * @description Inlines collected CSS and JS assets into an HTML document.
 *   CSS is injected as `<style>` blocks just before `</head>`, and JavaScript
 *   as `<script>` blocks just before `</body>`.
 * @param {string} html - HTML document string
 * @param {{ css: string[], js: string[] }} assets - Assets from `collectAssets`
 * @returns {string} HTML document with assets embedded inline
 * @example
 *   import { embedAssets } from './qjs-md.js';
 *   const final = embedAssets(html, assets);
 */
export { embedAssets } from './assets/handler.js';

/**
 * @feature embedImages
 * @description Replaces `<img src="path">` tags that reference local files with
 *   base64 data URIs (for raster images) or inline `<svg>` elements (for `.svg`
 *   files), making the HTML document fully self-contained with no external
 *   image dependencies.
 * @param {string} html - HTML string containing image tags
 * @param {string} sourceDir - Base directory used to resolve relative image paths
 * @returns {string} HTML with local images embedded inline
 * @example
 *   import { embedImages } from './qjs-md.js';
 *   const html = embedImages('<img src="photo.jpg">', '/my/site');
 */
export { embedImages } from './assets/handler.js';

// ── File Operations ───────────────────────────────────────────────────────────

/**
 * @feature findPublishableFiles
 * @description Recursively walks a source directory, parses YAML front matter
 *   from every `.md` file, and returns an array of file objects for those where
 *   `publish: true` is set (or where `publish` is absent and defaults to true).
 *   Each object has `path`, `data` (front matter), `content`, and `outputName`
 *   fields. Optionally filters by `target` value.
 * @param {string} sourceDir - Path to the source directory to walk
 * @param {string|null} [target] - Optional target filter (matches `data.target`)
 * @returns {Object[]} Array of publishable file objects
 * @example
 *   import { findPublishableFiles } from './qjs-md.js';
 *   const files = findPublishableFiles('/my/site/content');
 */
export { findPublishableFiles } from './utils/file-ops.js';

/**
 * @feature writeFile
 * @description Writes a string to a file path, creating any missing parent
 *   directories automatically.
 * @param {string} path - Destination file path
 * @param {string} content - Content to write
 * @example
 *   import { writeFile } from './qjs-md.js';
 *   writeFile('/output/index.html', '<html>…</html>');
 */
export { writeFile } from './utils/file-ops.js';

// ── Filename Utilities ────────────────────────────────────────────────────────

/**
 * @feature sanitizeFilename
 * @description Converts a string to a safe, lowercase, hyphen-separated
 *   filename by replacing any run of non-alphanumeric characters with a single
 *   hyphen and stripping leading/trailing hyphens.
 * @param {string} name - Original name string (e.g. a post title or tag)
 * @returns {string} Safe filename string
 * @example
 *   import { sanitizeFilename } from './qjs-md.js';
 *   sanitizeFilename('Hello, World!');  // → 'hello-world'
 *   sanitizeFilename('C++ Tips & Tricks');  // → 'c-tips-tricks'
 */
export { sanitizeFilename } from './utils/filename.js';

/**
 * @feature normalizeTagArray
 * @description Normalises a `tags` front matter value into a clean array of
 *   non-empty strings. Accepts a single tag string or an array of strings.
 *   A string value is treated as a single tag (not split on commas); pass an
 *   array for multiple tags.
 * @param {string|string[]|undefined} tags - Raw tags value from front matter
 * @returns {string[]} Array of non-empty tag strings
 * @example
 *   import { normalizeTagArray } from './qjs-md.js';
 *   normalizeTagArray('js');                 // → ['js']
 *   normalizeTagArray(['js', 'web']);        // → ['js', 'web']
 *   normalizeTagArray(undefined);            // → []
 */
export { normalizeTagArray } from './utils/filename.js';

/**
 * @feature resolveFilenameConflicts
 * @description Detects collisions in the `outputName` field of a file list (two
 *   posts that would generate the same HTML filename) and appends `-2`, `-3`,
 *   etc. suffixes to disambiguate them. Mutates the file objects in place.
 * @param {Object[]} files - Array of file objects with an `outputName` field
 * @example
 *   import { resolveFilenameConflicts } from './qjs-md.js';
 *   resolveFilenameConflicts(files);
 *   // files[1].outputName might change from 'hello.html' to 'hello-2.html'
 */
export { resolveFilenameConflicts } from './utils/filename.js';

// ── Date Formatting ───────────────────────────────────────────────────────────

/**
 * @feature formatPrettyDate
 * @description Formats an ISO 8601 date string (or JavaScript Date-parseable
 *   value) into a human-readable string such as
 *   "Monday, July 1st 2026 at 12:35 AM". Falls back gracefully for invalid input.
 * @param {string|Date} dateStr - ISO date string or Date object
 * @returns {string} Formatted date string, or the original value if unparseable
 * @example
 *   import { formatPrettyDate } from './qjs-md.js';
 *   formatPrettyDate('2026-07-01');  // → 'Wednesday, July 1st 2026'
 */
export { formatPrettyDate } from './utils/date-format.js';

// ── CSS Utilities ─────────────────────────────────────────────────────────────

/**
 * @feature extractCSSColors
 * @description Scans an array of CSS source strings for `--color-*` and other
 *   custom property declarations and returns them as an array of declaration
 *   strings. Used to thread theme colors from the site stylesheet into SVG
 *   chart rendering.
 * @param {string[]} cssArray - Array of CSS source strings
 * @returns {Object|null} Object mapping property names to their values (e.g. `{ '--color-primary': '#3b82f6' }`), or `null` if none found
 * @example
 *   import { extractCSSColors } from './qjs-md.js';
 *   const colors = extractCSSColors([':root { --color-primary: #3b82f6; }']);
 */
export { extractCSSColors } from './utils/css-parser.js';

// ── Page Generators ───────────────────────────────────────────────────────────

/**
 * @feature generateIndex
 * @description Generates paginated index pages (`index.html`, `index-2.html`,
 *   …) listing all published posts in reverse-chronological order. Each page
 *   shows up to 10 post stubs rendered with the `stub.html` template, with
 *   Previous / Next pagination links.
 * @param {Object[]} files - Array of publishable file objects
 * @param {string} outputDir - Directory where index pages are written
 * @param {string} templatesDir - Templates directory path
 * @param {Object} globalVars - Global site variables from `index.json`
 * @param {{ css: string[], js: string[] }} assets - Collected CSS/JS assets
 * @example
 *   import { generateIndex } from './qjs-md.js';
 *   generateIndex(files, '/out', '/out/templates', globals, assets);
 */
export { generateIndex } from './generators/index.js';

/**
 * @feature generateTagPages
 * @description Generates per-tag listing pages (`tag-{slug}.html`) and a tag
 *   index page (`tags.html`) listing all tags with post counts. Tag slugs are
 *   sanitized to be safe filenames.
 * @param {Object[]} files - Array of publishable file objects
 * @param {string} outputDir - Directory where tag pages are written
 * @param {string} templatesDir - Templates directory path
 * @param {Object} globalVars - Global site variables
 * @param {{ css: string[], js: string[] }} assets - Collected CSS/JS assets
 * @example
 *   import { generateTagPages } from './qjs-md.js';
 *   generateTagPages(files, '/out', '/out/templates', globals, assets);
 */
export { generateTagPages } from './generators/tags.js';

/**
 * @feature generateSearchPage
 * @description Generates a client-side full-text search page (`search.html`)
 *   and its companion data file (`search-data.json`) containing indexed post
 *   titles, summaries, and URLs. The search UI uses a built-in fuzzy search
 *   implementation with no external dependencies.
 * @param {Object[]} files - Array of publishable file objects
 * @param {string} outputDir - Directory where search files are written
 * @param {string} templatesDir - Templates directory path
 * @param {Object} globalVars - Global site variables
 * @param {{ css: string[], js: string[] }} assets - Collected CSS/JS assets
 * @example
 *   import { generateSearchPage } from './qjs-md.js';
 *   generateSearchPage(files, '/out', '/out/templates', globals, assets);
 */
export { generateSearchPage } from './generators/search.js';

/**
 * @feature generateRSSFeed
 * @description Generates an RSS 2.0 feed file (`rss.xml`) containing the 20
 *   most recent published posts with title, description (summary), publication
 *   date, author, and link fields populated from front matter and global config.
 * @param {Object[]} files - Array of publishable file objects
 * @param {string} outputDir - Directory where `rss.xml` is written
 * @param {string} templatesDir - Templates directory path (unused, kept for API consistency)
 * @param {Object} globalVars - Global site variables (site URL, title, author)
 * @param {{ css: string[], js: string[] }} assets - Collected CSS/JS assets (unused)
 * @example
 *   import { generateRSSFeed } from './qjs-md.js';
 *   generateRSSFeed(files, '/out', '/out/templates', globals, assets);
 */
export { generateRSSFeed } from './generators/rss.js';

/**
 * @feature generateAboutPage
 * @description Generates an `about.html` page using the `about.html` or
 *   `default.html` template and populating it with global site variables such
 *   as site name, author, and description.
 * @param {Object[]} files - Array of publishable file objects (unused, kept for API consistency)
 * @param {string} outputDir - Directory where `about.html` is written
 * @param {string} templatesDir - Templates directory path
 * @param {Object} globalVars - Global site variables
 * @param {{ css: string[], js: string[] }} assets - Collected CSS/JS assets
 * @example
 *   import { generateAboutPage } from './qjs-md.js';
 *   generateAboutPage(files, '/out', '/out/templates', globals, assets);
 */
export { generateAboutPage } from './generators/about.js';

// ── Commands ──────────────────────────────────────────────────────────────────

/**
 * @feature generateDocs
 * @description Walks a directory of JavaScript source files, extracts JSDoc
 *   comment blocks from each file, and writes one Markdown file per source file
 *   to an output directory. Each output file has YAML front matter with
 *   `source`, `type: docs`, `date`, `description` (first sentence of the
 *   `@fileoverview` block), and a `functions` list of all documented names.
 *   The body contains formatted sections for each documented function/class with
 *   parameters, return type, thrown errors, and code examples. Output files are
 *   ready for ingestion by the standard `mdc` compile pipeline.
 * @param {string} inputDir - Directory of JavaScript source files to document
 * @param {string} outputDir - Directory where generated `.md` files are written
 * @example
 *   import { generateDocs } from './qjs-md.js';
 *   generateDocs('src', 'docs/api');
 *   // writes docs/api/utils/filename.md, docs/api/commands/compile-file.md, …
 */
export { generateDocs } from './commands/generate-docs.js';

/**
 * @feature compileFile
 * @description Compiles a single markdown file to a fully self-contained HTML
 *   document. YAML front matter fields drive `<head>` metadata: `title`,
 *   `description`, `author`, `tags` (keywords), `date`, `lang` (default "en"),
 *   `canonical`, and `image` (og:image). The document includes default prose
 *   CSS and syntax highlighting styles inline — no external dependencies.
 * @param {string} inputPath - Path to the source `.md` file
 * @param {string} [outputPath] - Path for the output `.html` file (defaults to same name as input)
 * @example
 *   import { compileFile } from './qjs-md.js';
 *   compileFile('post.md', 'post.html');
 */
export { compileFile } from './commands/compile-file.js';

/**
 * @feature toJson
 * @description Converts a markdown file to a JSON AST file. The output object
 *   contains a `frontMatter` key with parsed YAML fields and a `content` key
 *   with the nested AST produced by `parseToAST`. Useful for integrating with
 *   other tools that consume structured document data.
 * @param {string} inputPath - Path to the source `.md` file
 * @param {string} [outputPath] - Path for the output `.json` file (defaults to same name as input)
 * @example
 *   import { toJson } from './qjs-md.js';
 *   toJson('post.md', 'post.json');
 */
export { toJson } from './commands/to-json.js';

/**
 * @feature createNewNotebook
 * @description Scaffolds a new notebook (static site) directory at the given
 *   path. Creates the standard directory structure, default templates, an
 *   `index.json` configuration file pre-filled with the answers to an
 *   interactive questionnaire, and example content files to get started quickly.
 * @param {string} targetPath - Path where the new notebook should be created
 * @example
 *   import { createNewNotebook } from './qjs-md.js';
 *   createNewNotebook('/my/new-site');
 */
export { createNewNotebook } from './commands/create-notebook.js';

// ── CLI Utilities ─────────────────────────────────────────────────────────────

/**
 * @feature parseArgs
 * @description Parses QuickJS `scriptArgs` (a comma-separated string in QJS)
 *   into a structured configuration object. Recognises commands (`compile`,
 *   `compile-file`, `to-json`, `create-notebook`) and flags (`--output/-o`,
 *   `--watch/-w`, `--target/-t`, `--force/-f`, `--help/-h`).
 * @param {string} args - Raw `scriptArgs` string from QuickJS
 * @returns {Object} Config object with `command`, `source`, `output`, `watch`,
 *   `target`, `force`, `inputFile`, and `targetPath` fields
 * @example
 *   import { parseArgs } from './qjs-md.js';
 *   const config = parseArgs(scriptArgs);
 */
export { parseArgs } from './utils/cli.js';

// ── Convenience Pipeline ──────────────────────────────────────────────────────

import { parse as _parseMarkdown } from '../lib/markdown.js';
import { processFootnotes as _processFootnotes } from './content/footnotes.js';
import { processAbbreviations as _processAbbreviations } from './content/abbreviations.js';
import { processWikilinks as _processWikilinks } from './content/wikilinks.js';
import { processTables as _processTables } from '../plugins/tables.js';
import { processSVGCharts as _processSVGCharts } from './plugins/svg-charts.js';
import { highlightCode as _highlightCode } from './content/highlight.js';
import { makeUrlsClickable as _makeUrlsClickable } from './content/urls.js';

/**
 * @feature compileMarkdown
 * @description Convenience function that runs the full qjs-md content processing
 *   pipeline on a raw markdown string and returns the final HTML. The pipeline
 *   applies (in order): footnotes, abbreviations, wikilinks, markdown→HTML,
 *   tables, SVG charts, syntax highlighting, and URL linking. SVG chart
 *   processing requires a `sourceDir` when chart code blocks reference external
 *   data files.
 * @param {string} content - Raw markdown string (may include YAML front matter syntax)
 * @param {Object} [options] - Optional overrides
 * @param {string} [options.sourceDir='.'] - Base directory for SVG chart data file resolution
 * @param {string[]} [options.cssColors=[]] - CSS custom property declarations for chart colors
 * @returns {string} Fully processed HTML string
 * @example
 *   import { compileMarkdown } from './qjs-md.js';
 *   const html = compileMarkdown('# Hello\n\nVisit https://example.com');
 *   // → '<h1>Hello</h1>\n<p>Visit <a href="https://example.com">…</a></p>'
 */
export function compileMarkdown(content, options = {}) {
  const sourceDir = options.sourceDir || '.';
  const cssColors = options.cssColors || [];

  const { content: footnoteContent, footnotesHtml } = _processFootnotes(content);
  let processed = _processAbbreviations(footnoteContent);
  processed = _processWikilinks(processed);

  const contentHtml = _parseMarkdown(processed) + footnotesHtml;
  const tablesHtml = _processTables(contentHtml);
  const chartsHtml = _processSVGCharts(tablesHtml, sourceDir, cssColors);
  const highlightedHtml = _highlightCode(chartsHtml);
  return _makeUrlsClickable(highlightedHtml);
}
