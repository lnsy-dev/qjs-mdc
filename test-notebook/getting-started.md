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

qjs-md is a fast, zero-dependency static site generator that compiles markdown files into self-contained HTML. Here's how to build your own site.

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

- `index.html` - Paginated list of posts
- `your-post.html` - Individual post pages
- `tags.html` - Tag index
- `search.html` - Search functionality

All CSS, JavaScript, and images are automatically embedded into the HTML files.

## Next Steps

- Add more posts with different tags
- Customize your templates with includes
- Add SVG charts with code blocks
- Use [[wikilinks]] to connect posts
