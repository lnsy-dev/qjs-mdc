---
publish: true
title: "Getting Started"
date: 2026-02-28T00:00:00
tags:
  - tutorial
  - guide
summary: Learn how to build your own static site with qjs-md
---

# Getting Started

qjs-mdc (which stands for Quick JavaScript MarkDown Compiler) is a fast, zero-dependency SSG that compiles markdown files into self-contained HTML.[^zero-dep] Here's how to build your own site.

*[SSG]: Static Site Generator
*[HTML]: HyperText Markup Language
*[YAML]: YAML Ain't Markup Language

## Project Structure

Create a folder with this structure:

```
my-blog/
├── templates/
│   └── default.html
├── index.json
├── style.css
└── your-post.md
```

## Step 1: Create Templates

Create `templates/default.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{title}}</title>
</head>
<body>
  <h1>{{title}}</h1>
  {{content}}
</body>
</html>
```

## Step 2: Add Global Config

Create `index.json`:

```json
{
  "siteName": "My Blog",
  "author": "Your Name"
}
```

## Step 3: Write Content

Create `your-post.md`:

```markdown
---
publish: true
title: My First Post
date: 2026-02-27T00:00:00
tags: [hello, world]
---

# Hello World

This is my first post!
```

## Step 4: Build

Run the compiler:

```bash
./mdc my-blog --output my-blog/dist
```

Your site is now in `my-blog/dist/`. Open `index.html` to view it.

## What Gets Generated

- `index.html` — Paginated list of posts
- `your-post.html` — Individual post pages
- `tags.html` — Tag index
- `search.html` — Search functionality[^search-note]

All CSS, JavaScript, and images are automatically embedded into the HTML files.

## Next Steps

- Review [[Setting Up a Markdown File]] for YAML front matter details
- See [[QJS-MDC SVG without JS!]] for SVG charts with no JavaScript
- Use [[Filtering by Target]] to publish to multiple sites from one notebook

[^zero-dep]: Zero-dependency means the compiled binary has no runtime requirements beyond a POSIX-compatible OS. No Node.js, no Python, no package manager needed.
[^search-note]: Search uses a pre-built JSON index and fuzzy matching implemented in pure CSS and inline JavaScript embedded directly in the output HTML.
