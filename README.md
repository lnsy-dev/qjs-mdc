# pochade-blog

A fast, self-contained static site generator built with [QuickJS](https://bellard.org/quickjs/). Compiles markdown files with YAML front matter into a fully-featured static website with search, RSS, tag pages, SVG charts, and more. Compiles to a single native binary with no runtime dependencies.

---

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Building](#building)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Commands](#commands)
- [Project Structure](#project-structure)
- [Writing Content](#writing-content)
- [Configuration](#configuration)
- [Templates](#templates)
- [SVG Charts](#svg-charts)
- [Code Highlighting](#code-highlighting)
- [Obsidian Plugin](#obsidian-plugin)

---

## Features

- **Single native binary** — compiles to `dist/mdc` via QuickJS, no Node.js or runtime required
- **Markdown with YAML front matter** — full post metadata (title, date, tags, author, type)
- **Wikilinks** — `[[Page Title]]` syntax converts to HTML links
- **Abbreviations** — `*[TERM]: Definition` creates `<abbr>` tooltip tags
- **Syntax highlighting** — built-in highlighters for JS, Python, Rust, Ruby, C, JSON, YAML, TOML, CSS, HTML
- **SVG chart generation** — inline charts from code blocks (bar, line, scatter, donut, heikin-ashi/candlestick, map)
- **Auto-URL linking** — bare URLs are automatically made clickable
- **Image embedding** — images embedded as base64 data URIs or inline SVG
- **Paginated index** — 10 posts per page with previous/next navigation
- **Tag pages** — per-tag listing pages and a searchable tag index
- **Fuzzy search** — client-side full-text search with `search-data.json`
- **RSS feed** — RSS 2.0 XML with the 20 most recent posts
- **About page** — static about page populated from site config
- **Watch mode** — file monitoring for live development
- **Notebook scaffolding** — `create-new-notebook` command bootstraps a complete site

---

## Prerequisites

- [QuickJS](https://bellard.org/quickjs/) (`qjs` and `qjsc`) installed and available in your `PATH`
- `make` (standard on macOS and Linux)

Install QuickJS on macOS via Homebrew:

```sh
brew install quickjs
```

On Linux use:

```sh
sudo apt install quickjs
```

For windows you can use [Windows Prebuilt Binaries](https://github.com/mengmo/QuickJS-Windows-Build) Or use the included binaries.

---

## Building

Clone the repository and compile the binary:

```sh
git clone <repo-url> pochade-blog
cd pochade-blog
make
```

The compiled binary is written to `dist/mdc`.

### Other build targets

| Command | Description |
|---------|-------------|
| `make` | Compile `src/compiler.js` to `dist/mdc` |
| `make install` | Install binary to `/usr/local/bin/mdc` |
| `make clean` | Remove the `dist/` directory |

The Makefile auto-detects your OS (macOS, Linux, Windows) and uses the appropriate commands and file extensions.

---

## Installation

After building, install the binary system-wide:

```sh
make install
```

This copies `dist/mdc` to `/usr/local/bin/mdc` so you can run `mdc` from anywhere.

Alternatively, use the included shell wrapper during development without installing:

```sh
./mdc <source-directory> --output <output-directory>
```

---

## Quick Start

### Create a new blog

```sh
mdc create-new-notebook my-blog
```

This runs an interactive questionnaire (site name, description, author) and scaffolds a complete directory structure.

### Compile the site

```sh
mdc my-blog/content --output my-blog/site
```

### Watch for changes during development

```sh
mdc my-blog/content --output my-blog/site --watch
```

Open `my-blog/site/index.html` in a browser to view your site.

---

## Commands

```
mdc <source> --output <output>          Compile markdown files to a static site
mdc <source> --output <output> --watch  Compile and watch for file changes
mdc create-new-notebook <target-dir>    Scaffold a new blog/notebook
mdc --help                              Show help text
```

### Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--output <dir>` | | Output directory for compiled HTML |
| `--watch` | `-w` | Watch source files and recompile on change |
| `--help` | `-h` | Print usage information |

---

## Project Structure

```
pochade-blog/
├── src/                        # Core compiler source
│   ├── compiler.js             # Main compilation pipeline
│   ├── assets/
│   │   └── handler.js          # CSS/JS asset collection and embedding
│   ├── commands/
│   │   └── create-notebook.js  # Notebook scaffolding command
│   ├── content/
│   │   └── processor.js        # Wikilinks, abbreviations, URL linking, highlighting
│   ├── generators/
│   │   ├── index.js            # Paginated index page generation
│   │   ├── tags.js             # Tag pages and tag index
│   │   ├── search.js           # Search page and search-data.json
│   │   ├── rss.js              # RSS 2.0 feed generation
│   │   └── about.js            # About page generation
│   ├── plugins/
│   │   └── svg-charts.js       # SVG chart code block processing
│   ├── templates/
│   │   └── engine.js           # Template loader and variable substitution
│   └── utils/
│       ├── cli.js              # Argument parsing and help text
│       ├── date-format.js      # Human-readable date formatting
│       ├── file-ops.js         # Directory walking and markdown discovery
│       └── filename.js         # Filename sanitization and conflict resolution
├── lib/                        # Bundled libraries
│   ├── markdown.js             # Snarkdown-based markdown parser
│   ├── md-yaml.js              # YAML front matter parser
│   └── fuzzy-search.js         # Client-side fuzzy search
├── plugins/                    # Syntax highlighter and SVG plugins
│   ├── js.js                   # JavaScript/TypeScript highlighter
│   ├── py.js                   # Python highlighter
│   ├── rs.js                   # Rust highlighter
│   ├── rb.js                   # Ruby highlighter
│   ├── c.js                    # C highlighter
│   ├── json.js                 # JSON highlighter
│   ├── yaml.js                 # YAML highlighter
│   ├── toml.js                 # TOML highlighter
│   ├── css.js                  # CSS highlighter
│   ├── html.js                 # HTML highlighter
│   └── svg/                    # SVG chart rendering system
│       ├── src/renderers/      # Bar, scatter, line, donut, heikin-ashi, map
│       └── src/utils/          # SVG utilities (patterns, CSS, error handling)
├── pochade-blog-obsidian-plugin/  # Obsidian.md integration plugin
│   ├── main.js
│   └── src/
├── scripts/                    # Build helper scripts
│   └── generate-template.js    # Bundles template for notebook scaffolding
├── dist/                       # Compiled binary output (git-ignored)
├── docs/                       # Additional documentation
├── Makefile                    # Build configuration
└── mdc                         # Shell wrapper for development
```

### Output structure

After compilation, the output directory contains:

```
site/
├── index.html          # Main post listing (page 1)
├── index-2.html        # Page 2, etc.
├── post-title.html     # Individual post pages
├── tag-tagname.html    # Per-tag listing pages
├── tags.html           # Searchable tag index
├── search.html         # Full-text search interface
├── search-data.json    # Search index
├── about.html          # About page
└── rss.xml             # RSS 2.0 feed
```

All CSS and JavaScript are embedded directly in each HTML file — the site is fully self-contained.

---

## Writing Content

### Markdown files

Create `.md` files in your source directory. Only files with `publish: true` in their front matter are included in the compiled output.

### Front matter

Every post should start with a YAML front matter block:

```yaml
---
title: My First Post
date: 2026-03-03
tags: [writing, technology]
type: post
author: Your Name
publish: true
---

Your markdown content begins here.
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Post title displayed in listings and the page `<title>` |
| `date` | Yes | Publication date (`YYYY-MM-DD`), used for sorting |
| `tags` | No | Array of tag strings |
| `type` | No | Template selector (e.g. `post`). Falls back to `post.html` then `default.html` |
| `author` | No | Post author name |
| `publish` | Yes | Must be `true` to include the file in output |

### Wikilinks

Link to other posts using their title:

```markdown
See also [[My Other Post]].
```

### Abbreviations

Define abbreviations that appear as tooltips throughout the document:

```markdown
*[HTML]: HyperText Markup Language
*[CSS]: Cascading Style Sheets

We write HTML and CSS every day.
```

---

## Configuration

Each notebook contains a `templates/index.json` file with global variables available to all templates:

```json
{
  "site_name": "My Blog",
  "site_description": "Writing about things I find interesting",
  "author": "Your Name",
  "siteUrl": "https://example.com"
}
```

These values are substituted into templates via `{{variable}}` syntax and are also available in the generated about page and RSS feed.

---

## Templates

pochade-blog uses a simple template engine with `{{variable}}` substitution and `{{*.html}}` includes.

### Template files

Place these files in your source's `templates/` directory:

| File | Purpose |
|------|---------|
| `default.html` | Fallback template |
| `post.html` | Standard post/article template |
| `index.html` | Paginated post listing |
| `tag.html` | Individual tag page |
| `tags.html` | Tag index with search |
| `search.html` | Full-text search page |
| `about.html` | About page |
| `style.css` | Styles (embedded into every page) |
| `index.js` | JavaScript (embedded into every page) |

### Template variables

| Variable | Description |
|----------|-------------|
| `{{title}}` | Post or page title |
| `{{content}}` | Compiled HTML body content |
| `{{date}}` | Formatted publication date |
| `{{author}}` | Post author |
| `{{tags}}` | Rendered tag links |
| `{{site_name}}` | From `index.json` |
| `{{site_description}}` | From `index.json` |
| `{{siteUrl}}` | From `index.json` |

### Template selection

The compiler selects a template in this priority order:

1. `{type}.html` — matches the `type` field in front matter
2. `post.html` — default fallback for posts
3. `default.html` — final fallback

---

## SVG Charts

Embed interactive SVG charts directly in markdown using fenced code blocks with a `chart` language tag.

### Bar chart

```
```chart
type: bar
data:
  - label: Apples
    value: 42
  - label: Oranges
    value: 17
```
```

### Supported chart types

| Type | Description |
|------|-------------|
| `bar` | Vertical or horizontal bar chart |
| `line` | Line chart with optional area fill |
| `scatter` | Scatter plot |
| `donut` | Donut / pie chart |
| `heikin-ashi` | Candlestick chart for financial data |
| `map` | Geographic map from GeoJSON |

Charts are rendered as inline SVG at compile time — no JavaScript required for display.

---

## Code Highlighting

Fenced code blocks are syntax-highlighted at compile time. Supported languages:

| Language tag | Language |
|-------------|----------|
| `js`, `javascript`, `typescript` | JavaScript / TypeScript |
| `py`, `python` | Python |
| `rs`, `rust` | Rust |
| `rb`, `ruby` | Ruby |
| `c` | C |
| `json` | JSON |
| `yaml` | YAML |
| `toml` | TOML |
| `css` | CSS |
| `html` | HTML |

Example:

````markdown
```python
def hello(name):
    print(f"Hello, {name}!")
```
````

---

## Obsidian Plugin

The `pochade-blog-obsidian-plugin/` directory contains an [Obsidian.md](https://obsidian.md) plugin that integrates with pochade-blog for authoring posts directly inside Obsidian.

### Building the plugin

```sh
cd pochade-blog-obsidian-plugin
npm install
npm run build
```

Copy the built plugin into your Obsidian vault's `.obsidian/plugins/pochade-blog/` directory and enable it in Obsidian's Community Plugins settings.
