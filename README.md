# Markdown Compiler (mdc)

A QuickJS-based static site generator that compiles markdown files with YAML front matter into HTML.

## Features

✅ **YAML Front Matter** - Parse metadata from markdown files  
✅ **Template System** - Flexible HTML templates with variable substitution  
✅ **Wikilinks** - `[[link text]]` syntax for internal linking  
✅ **Code Highlighting** - Syntax highlighting for JavaScript, Python, Rust  
✅ **Pagination** - Automatic index pagination (10 posts per page)  
✅ **Tags** - Tag-based organization with individual tag pages  
✅ **Search** - Client-side fuzzy search functionality  
✅ **Asset Embedding** - Inline CSS, JavaScript, and images (base64)  
✅ **Nested Directories** - Recursive file discovery with flat output  
✅ **Summary Extraction** - Auto-extract or use custom summaries  
✅ **Citation Pages** - Generate citation pages for unpublished references  
✅ **Abbreviations** - Define and expand abbreviations with hover tooltips  

## Installation

Requires [QuickJS](https://bellard.org/quickjs/) to be installed.

```bash
# Make the script executable
chmod +x mdc

# Run the compiler
./mdc <source-directory> --output <output-directory>
```

## Usage

```bash
./mdc ~/my-blog --output ~/my-blog/dist
```

### Options

- `--output, -o` - Output directory (required)
- `--help, -h` - Show help message

## Project Structure

```
my-blog/
├── templates/          # HTML templates
│   ├── default.html   # Default template
│   ├── post.html      # Post template (optional)
│   ├── header.html    # Header partial (optional)
│   └── footer.html    # Footer partial (optional)
├── index.json         # Global variables (optional)
├── style.css          # CSS files (auto-embedded)
├── script.js          # JS files (auto-embedded)
└── *.md               # Markdown files
```

## Markdown Files

Each markdown file should have YAML front matter:

```markdown
---
title: My Post Title
publish: true
date: 2026-02-26
tags: [javascript, tutorial]
summary: Optional custom summary
type: post
---

Your markdown content here...
```

### Required Fields

- `publish: true` - Only files with this will be compiled

### Optional Fields

- `title` - Post title (defaults to filename)
- `date` - Publication date (for sorting)
- `tags` - Array of tags
- `summary` - Custom summary (auto-extracted if not provided)
- `type` - Template type (looks for `{type}.html`)

## Templates

Templates use `{{variable}}` syntax for substitution.

### Available Variables

- `{{title}}` - Post title
- `{{content}}` - Compiled markdown content
- `{{summary}}` - Post summary
- `{{date}}` - Post date
- Any custom field from YAML front matter
- Any field from `index.json`

### Template Includes

Use `{{header.html}}` or `{{footer.html}}` to include other templates.

### Template Selection

Templates are selected in this order:
1. `{type}.html` (if type is specified)
2. `post.html`
3. `default.html`

## Wikilinks

Use `[[Page Title]]` to link to other pages. The compiler will:
- Convert to lowercase-dashed filename
- Capitalize the display text
- Handle conflicts by appending numbers

Example: `[[My Page]]` → `<a href="my-page.html">My Page</a>`

## Code Highlighting

Supported languages: `js`, `py`, `rs`, `c`, `rb`, `html`, `css`, `json`, `toml`, `yaml`

```markdown
\`\`\`js
function hello() {
  console.log('Hello!');
}
\`\`\`
```

## Generated Pages

The compiler automatically generates:

- `index.html`, `index-2.html`, etc. - Paginated post listings
- `tags.html` - All tags with search
- `tag-{name}.html` - Individual tag pages
- `search.html` - Search page with fuzzy search
- `search-data.json` - Search index
- `{citation-name}.html` - Citation pages for unpublished references

## Citation Pages

Files with `publish: false` are automatically converted to citation pages. These are useful for references, footnotes, or unpublished sources.

```markdown
---
title: Important Research Paper
publish: false
author: Dr. Jane Smith
year: 2025
source: Journal of Computer Science
url: https://example.com/paper
---

Citation content here...
```

This generates a citation page that can be referenced via wikilinks: `[[Important Research Paper]]`

## Abbreviations

Define abbreviations anywhere in your markdown file using the syntax:

```markdown
*[HTML]: HyperText Markup Language
*[CSS]: Cascading Style Sheets

When you write HTML and CSS, you're working with web technologies.
```

The compiler will:
- Remove the definition lines from output
- Replace all occurrences of the term with `<abbr>` tags
- Add the expansion as a title attribute (shows on hover)

Example output: `<abbr title="HyperText Markup Language">HTML</abbr>`

## Asset Embedding

All CSS and JavaScript files in the source directory are automatically embedded in the `<head>` of each HTML file.

Images are embedded as:
- **SVG** - Inline SVG
- **Other images** - Base64 data URIs
- **External URLs** - Fetched and embedded

## Example

See `test-notebook/` for a complete example with templates and sample posts.

```bash
./build-test.sh
```

## License

MIT
