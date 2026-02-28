# qjs-md - Markdown Compiler

A fast, zero-dependency static site generator built on QuickJS. Compile markdown files with YAML front matter into self-contained HTML with embedded assets, SVG charts, syntax highlighting, and more.

## Features

- **YAML Front Matter** - Parse metadata from markdown files
- **Template System** - Flexible HTML templates with variable substitution and includes
- **Wikilinks** - `[[link text]]` syntax for internal linking
- **SVG Charts** - Inline chart generation (bar, line, scatter, donut, heikin-ashi, map)
- **Code Highlighting** - Syntax highlighting for 10+ languages
- **Pagination** - Automatic index pagination (10 posts per page)
- **Tags** - Tag-based organization with individual tag pages
- **Search** - Client-side fuzzy search functionality
- **Asset Embedding** - Inline CSS, JavaScript, and images (base64)
- **Nested Directories** - Recursive file discovery with flat output
- **Summary Extraction** - Auto-extract or use custom summaries
- **Citation Pages** - Generate citation pages for unpublished references
- **Abbreviations** - Define and expand abbreviations with hover tooltips
- **Zero Dependencies** - No Node.js, npm, or external libraries required

## Quick Start

```bash
# 1. Install QuickJS (see Installation section)

# 2. Clone or download qjs-md
git clone https://github.com/yourusername/qjs-md.git
cd qjs-md

# 3. Make the script executable
chmod +x mdc

# 4. Compile your markdown files
./mdc ~/my-blog --output ~/my-blog/dist

# 5. Open the generated HTML files
open ~/my-blog/dist/index.html
```

## Installation

### Prerequisites

qjs-md requires QuickJS to be installed on your system.

### Installing QuickJS from Source

**macOS / Linux:**

```bash
# Download QuickJS source
wget https://bellard.org/quickjs/quickjs-2025-09-13-2.tar.xz
tar xf quickjs-2025-09-13-2.tar.xz
cd quickjs-2025-09-13-2

# Compile
make

# Install (requires sudo)
sudo make install

# Verify installation
qjs --version
```

**Alternative: Homebrew (macOS)**

```bash
brew install quickjs
```

**Alternative: Package Manager (Linux)**

```bash
# Debian/Ubuntu
sudo apt install quickjs

# Arch Linux
sudo pacman -S quickjs
```

### Installing qjs-md

```bash
# Clone the repository
git clone https://github.com/yourusername/qjs-md.git
cd qjs-md

# Make executable
chmod +x mdc

# Optional: Add to PATH
sudo ln -s $(pwd)/mdc /usr/local/bin/mdc

# Test installation
./mdc --help
```

## Usage

### Basic Command

```bash
./mdc <source-directory> --output <output-directory>
```

### Options

- `<source-directory>` - Directory containing markdown files and templates (required)
- `--output <dir>` or `-o <dir>` - Output directory for generated HTML (required)
- `--help` or `-h` - Display help message

### Examples

```bash
# Compile blog to dist/ directory
./mdc ~/my-blog --output ~/my-blog/dist

# Compile with short option
./mdc ./content -o ./public

# Run test example
./build-test.sh
```

## Project Structure

Your source directory should follow this structure:

```
my-blog/
├── templates/          # HTML templates (required)
│   ├── default.html   # Default template (required)
│   ├── post.html      # Post template (optional)
│   ├── citation.html  # Citation template (optional)
│   ├── header.html    # Header partial (optional)
│   └── footer.html    # Footer partial (optional)
├── index.json         # Global variables (optional)
├── style.css          # CSS files (auto-embedded)
├── script.js          # JS files (auto-embedded)
├── images/            # Images (auto-embedded)
├── post1.md           # Markdown files
├── post2.md
└── nested/            # Nested directories supported
    └── post3.md
```

### Output Structure

The compiler generates a flat structure:

```
dist/
├── index.html         # First page of posts
├── index-2.html       # Second page (if >10 posts)
├── post1.html         # Individual posts
├── post2.html
├── post3.html
├── tags.html          # Tag index with search
├── tag-javascript.html  # Individual tag pages
├── tag-tutorial.html
├── search.html        # Search page
└── search-data.json   # Search index
```

## Markdown Files

### YAML Front Matter

Each markdown file must have YAML front matter:

```markdown
---
title: My Post Title
publish: true
date: 2026-02-27
tags: [javascript, tutorial]
summary: Optional custom summary
type: post
---

Your markdown content here...
```

### Required Fields

- `publish: true` - Only files with this will be compiled (use `false` for citation pages)

### Optional Fields

- `title` - Post title (defaults to filename if not provided)
- `date` - Publication date (used for sorting, any format)
- `tags` - Array of tags for organization
- `summary` - Custom summary (auto-extracted from first paragraph if not provided)
- `type` - Template type (looks for `{type}.html`, falls back to `post.html` or `default.html`)
- Any custom fields - Available as template variables

### Example Post

```markdown
---
title: Getting Started with QuickJS
publish: true
date: 2026-02-27
tags: [quickjs, javascript, tutorial]
summary: Learn how to use QuickJS for scripting
author: John Doe
---

# Getting Started with QuickJS

QuickJS is a small and embeddable JavaScript engine...

## Installation

First, download QuickJS from the official website...
```

## Templates

Templates use `{{variable}}` syntax for variable substitution.

### Minimal Template

Create `templates/default.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
</head>
<body>
  <article>
    <h1>{{title}}</h1>
    <div class="content">
      {{content}}
    </div>
  </article>
</body>
</html>
```

### Available Variables

**Built-in Variables:**
- `{{title}}` - Post title
- `{{content}}` - Compiled markdown content (HTML)
- `{{summary}}` - Post summary (auto-extracted or custom)
- `{{date}}` - Post date

**Custom Variables:**
- Any field from YAML front matter
- Any field from `index.json` (global variables)

### Template Includes

Use `{{filename.html}}` to include other templates:

```html
<!-- templates/default.html -->
<!DOCTYPE html>
<html>
<head>
  {{header.html}}
</head>
<body>
  {{content}}
  {{footer.html}}
</body>
</html>

<!-- templates/header.html -->
<meta charset="UTF-8">
<title>{{title}} - {{siteName}}</title>
<meta name="description" content="{{summary}}">

<!-- templates/footer.html -->
<footer>
  <p>&copy; 2026 {{author}}</p>
</footer>
```

### Template Selection

Templates are selected in this order:

1. `{type}.html` - If `type` field is specified in front matter
2. `post.html` - If it exists
3. `default.html` - Fallback (required)

**Example:**

```markdown
---
title: My Tutorial
type: tutorial
---
```

This will use `templates/tutorial.html` if it exists, otherwise falls back to `post.html` or `default.html`.

### Global Variables

Create `index.json` in your source directory for site-wide variables:

```json
{
  "siteName": "My Blog",
  "siteUrl": "https://example.com",
  "author": "John Doe",
  "description": "A blog about programming"
}
```

These variables are available in all templates: `{{siteName}}`, `{{author}}`, etc.

## Markdown Features

### Standard Markdown

All standard markdown syntax is supported:

```markdown
# Headers (H1-H6)

**Bold text** and *italic text*

[Links](https://example.com)

![Images](image.jpg)

- Unordered lists
- With multiple items

1. Ordered lists
2. With numbers

> Blockquotes

`Inline code`

```
Code blocks
```
```

### Wikilinks

Use `[[Page Title]]` to link to other pages:

```markdown
See [[my other post]] for more details.

Check out [[Getting Started]] to begin.
```

The compiler will:
- Convert page title to lowercase-dashed filename
- Capitalize the display text
- Create working links between pages

**Example:**
- `[[My Other Post]]` → `<a href="my-other-post.html">My Other Post</a>`
- `[[getting started]]` → `<a href="getting-started.html">Getting Started</a>`

### Abbreviations

Define abbreviations anywhere in your markdown:

```markdown
*[HTML]: HyperText Markup Language
*[CSS]: Cascading Style Sheets
*[JS]: JavaScript

When you write HTML, CSS, and JS, you're working with web technologies.
```

**Output:**
```html
When you write <abbr title="HyperText Markup Language">HTML</abbr>,
<abbr title="Cascading Style Sheets">CSS</abbr>, and
<abbr title="JavaScript">JS</abbr>, you're working with web technologies.
```

The definition lines are removed from output, and all occurrences are wrapped in `<abbr>` tags with hover tooltips.

### Code Highlighting

Syntax highlighting is automatically applied to code blocks:

````markdown
```js
function hello(name) {
  console.log(`Hello, ${name}!`);
  return true;
}
```

```py
def hello(name):
    print(f"Hello, {name}!")
    return True
```

```rs
fn hello(name: &str) {
    println!("Hello, {}!", name);
}
```
````

**Supported Languages:**
- `js` - JavaScript
- `py` - Python
- `rs` - Rust
- `c` - C
- `rb` - Ruby
- `html` - HTML
- `css` - CSS
- `json` - JSON
- `toml` - TOML
- `yaml` - YAML

### SVG Charts

Create inline SVG charts using code blocks with chart type languages:

#### Bar Charts

````markdown
```bar
[
  {"label": "Product A", "value": 45},
  {"label": "Product B", "value": 67},
  {"label": "Product C", "value": 32}
]
```
````

#### Line Charts

````markdown
```line
[
  {"x": 1, "y": 10, "category": "Series A"},
  {"x": 2, "y": 15, "category": "Series A"},
  {"x": 1, "y": 8, "category": "Series B"},
  {"x": 2, "y": 12, "category": "Series B"}
]
```
````

#### Scatter Plots

````markdown
```scatter
[
  {"x": 10, "y": 20},
  {"x": 15, "y": 25},
  {"x": 20, "y": 18}
]
```
````

#### Donut Charts

````markdown
```donut
[
  {"label": "Category A", "value": 30},
  {"label": "Category B", "value": 45},
  {"label": "Category C", "value": 25}
]
```
````

#### Chart Configuration

Add YAML front matter to configure charts:

````markdown
```bar
---
width: 800
height: 400
orientation: horizontal
---
[
  {"label": "Q1 2026", "value": 1200},
  {"label": "Q2 2026", "value": 1450},
  {"label": "Q3 2026", "value": 1380}
]
```
````

**Configuration Options:**
- `width` - Chart width in pixels (default: 600)
- `height` - Chart height in pixels (default: 400)
- `orientation` - Bar chart orientation: `vertical` or `horizontal` (default: vertical)

**Data Formats:**

JSON (recommended):
```json
[{"label": "A", "value": 30}, {"label": "B", "value": 50}]
```

CSV:
```csv
label,value
A,30
B,50
```

For complete chart documentation, see `plugins/svg/README.md`.

## Asset Embedding

### CSS Files

All `.css` files in your source directory are automatically embedded in the `<head>` of each HTML file:

```css
/* style.css */
body {
  font-family: system-ui, sans-serif;
  line-height: 1.6;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

code {
  background: #f4f4f4;
  padding: 2px 6px;
  border-radius: 3px;
}
```

### JavaScript Files

All `.js` files in your source directory are automatically embedded:

```javascript
// script.js
document.addEventListener('DOMContentLoaded', () => {
  console.log('Page loaded');
  
  // Add smooth scrolling
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });
});
```

### Images

Images are automatically embedded based on type:

- **SVG files** - Inlined as `<svg>` elements
- **Other images** (jpg, png, gif) - Converted to base64 data URIs
- **External URLs** - Fetched and converted to base64

```markdown
![Diagram](diagram.svg)
![Photo](photo.jpg)
![External](https://example.com/image.png)
```

**Note:** Large images will increase HTML file size. Consider optimizing images before embedding.

## Generated Pages

The compiler automatically generates several auxiliary pages:

### Paginated Index

- **Files:** `index.html`, `index-2.html`, `index-3.html`, etc.
- **Content:** Lists all published posts (10 per page)
- **Sorting:** By date (newest first)
- **Features:** Previous/Next pagination links

### Tag Pages

- **Tag Index:** `tags.html` - Lists all tags with post counts and search
- **Individual Tags:** `tag-{name}.html` - Lists all posts with that tag

Example: If you have posts tagged with `javascript` and `tutorial`, the compiler generates:
- `tags.html` - Index of all tags
- `tag-javascript.html` - All JavaScript posts
- `tag-tutorial.html` - All tutorial posts

### Search Page

- **Files:** `search.html`, `search-data.json`
- **Features:** Client-side fuzzy search across all posts
- **Searches:** Title, summary, tags, and content
- **No server required:** Pure JavaScript implementation

### Citation Pages

Files with `publish: false` are converted to citation pages:

```markdown
---
title: Research Paper Reference
publish: false
author: Dr. Jane Smith
year: 2025
source: Journal of Computer Science
url: https://example.com/paper
---

This paper discusses...
```

This generates `research-paper-reference.html` which can be referenced via wikilinks from published posts:

```markdown
According to [[Research Paper Reference]], we can conclude...
```

**Use cases:**
- Footnotes and references
- Unpublished sources
- Internal documentation
- Bibliography entries

## Examples

### Complete Blog Example

See `test-notebook/` for a complete working example with:
- Multiple posts with various features
- Templates with includes
- CSS and JavaScript
- SVG charts
- Tags and search
- Citation pages

Run the example:

```bash
./build-test.sh
open test-website/index.html
```

### Minimal Blog Setup

```bash
mkdir my-blog
cd my-blog

# Create templates directory
mkdir templates

# Create default template
cat > templates/default.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{title}}</title>
  <style>
    body { max-width: 800px; margin: 0 auto; padding: 20px; font-family: system-ui; }
  </style>
</head>
<body>
  <h1>{{title}}</h1>
  {{content}}
</body>
</html>
EOF

# Create first post
cat > hello-world.md << 'EOF'
---
title: Hello World
publish: true
date: 2026-02-27
---

# Hello World

This is my first post!
EOF

# Compile
../qjs-md/mdc . --output dist

# View
open dist/index.html
```

## Troubleshooting

### QuickJS not found

```
Error: qjs: command not found
```

**Solution:** Install QuickJS (see Installation section) and ensure it's in your PATH.

### Template not found

```
Error: Cannot find template: default.html
```

**Solution:** Create `templates/default.html` in your source directory.

### No files compiled

```
Found 0 publishable files
```

**Solution:** Ensure your markdown files have `publish: true` in the front matter.

### Wikilink not working

```
[[My Post]] links to wrong page
```

**Solution:** Wikilinks use lowercase-dashed filenames. `[[My Post]]` links to `my-post.html`. Ensure the target file exists with that name.

### Chart not rendering

```
Chart code block appears as plain text
```

**Solution:** 
- Verify the language is a supported chart type: `bar`, `line`, `scatter`, `donut`, `heikin-ashi`, `map`
- Check JSON/CSV format is valid
- Ensure data structure matches chart type requirements

### Assets not embedded

```
CSS/JS not appearing in output
```

**Solution:**
- Ensure `.css` and `.js` files are in the source directory (not in `templates/`)
- Check file permissions are readable
- Verify files are not empty

## Advanced Usage

### Custom Template Types

Create specialized templates for different content types:

```markdown
---
title: API Documentation
type: api
---
```

Then create `templates/api.html` with API-specific layout.

### Multiple Blogs

Compile different blogs with different configurations:

```bash
# Personal blog
./mdc ~/personal-blog --output ~/personal-blog/dist

# Tech blog
./mdc ~/tech-blog --output ~/tech-blog/dist

# Documentation site
./mdc ~/docs --output ~/docs/public
```

### Integration with Static Hosting

```bash
# Compile
./mdc ~/my-blog --output ~/my-blog/dist

# Deploy to GitHub Pages
cd ~/my-blog/dist
git init
git add .
git commit -m "Deploy"
git push -f git@github.com:username/username.github.io.git main

# Or deploy to Netlify/Vercel
# Just point to the dist/ directory
```

### Automation

Create a build script:

```bash
#!/bin/bash
# build.sh

set -e

echo "Compiling blog..."
./mdc ~/my-blog --output ~/my-blog/dist

echo "Optimizing..."
# Add optimization steps here

echo "Deploying..."
# Add deployment steps here

echo "Done!"
```

## Performance

- **Compilation speed:** 10-50 posts in < 1 second
- **Output size:** 2-5KB per page (with embedded assets)
- **Memory usage:** Low (QuickJS has minimal footprint)
- **Startup time:** < 10ms

## Technical Details

- **Engine:** QuickJS (ES2020 JavaScript engine)
- **Markdown parser:** snarkdown-based
- **YAML parser:** Custom minimal implementation
- **Module system:** ES6 modules
- **Dependencies:** None (beyond QuickJS runtime)

## License

MIT

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `./build-test.sh`
5. Submit a pull request

## Support

- **Issues:** Report bugs and request features on GitHub
- **Documentation:** See `AGENT.md` for technical details
- **Examples:** Check `test-notebook/` for working examples

## Acknowledgments

- QuickJS by Fabrice Bellard
- snarkdown markdown parser
- Inspired by static site generators like Jekyll and Hugo

---

**Built with ❤️ using QuickJS**
