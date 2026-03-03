---
publish: true
title: "Setting Up a Markdown File"
date: 2026-03-03T00:00:00
tags:
  - memo
  - guide
summary: A reference memo covering filename conventions and all front matter fields recognized by the pochade-blog compiler.
---

# Setting Up a Markdown File

This memo covers how to name and configure a markdown file so it compiles correctly with qjs-mdc

## Filename Convention

File names must be **lowercase and dash-separated** (kebab-case). Use only letters, numbers, and hyphens. Do not use spaces, underscores, capital letters, or special characters.

**Good:**

```
my-first-post.md
notes-on-rust-lifetimes.md
2026-march-reading-list.md
```

**Avoid:**

```
My First Post.md
notes_on_rust.md
NotesOnRust.md
```

The filename becomes the output HTML filename. `my-first-post.md` compiles to `my-first-post.html` and forms the URL slug for the post.

---

## Front Matter

Every markdown file must begin with a YAML front matter block delimited by `---`. This is where you configure how the compiler processes and presents the file.

```yaml
---
publish: true
title: "My Post Title"
date: 2026-03-03T00:00:00
tags:
  - example
  - guide
type: post
author: Your Name
summary: A short description shown in post listings.
---
```

### Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `publish` | **Yes** | Must be `true`. Files without this field are ignored by the compiler. |
| `title` | **Yes** | The post title. Compiled into `{{title}}` in templates and used in the `<title>` tag, index listings, tag pages, search results, and the RSS feed. |
| `date` | **Yes** | Publication date in ISO 8601 format (`YYYY-MM-DDTHH:MM:SS`). Used to sort posts in the index and RSS feed, and compiled into `{{date}}` in templates. |
| `tags` | No | A list of tag strings. Each tag generates a dedicated tag listing page (`tag-tagname.html`) and appears in the searchable tag index. |
| `type` | No | Selects the HTML template used for this file. A value of `post` uses `post.html`. If omitted or the matching template does not exist, the compiler falls back to `post.html` then `default.html`. |
| `author` | No | Post author name. Compiled into `{{author}}` in templates. Falls back to the `author` value in `templates/index.json` if not set. |
| `summary` | No | A short description of the post. Shown in index listings and used as the RSS item description. If omitted, the compiler uses the first paragraph of the post body. |

---

## Compiled Template Variables

When the compiler renders a post, the following variables are available to substitute in your HTML templates using `{{variable}}` syntax:

| Template Variable | Source |
|-------------------|--------|
| `{{title}}` | `title` front matter field |
| `{{date}}` | `date` field, formatted as a human-readable string |
| `{{author}}` | `author` front matter field or `index.json` global |
| `{{tags}}` | Rendered HTML tag links from the `tags` array |
| `{{content}}` | The compiled HTML body of the markdown file |
| `{{site_name}}` | `templates/index.json` global config |
| `{{site_description}}` | `templates/index.json` global config |
| `{{siteUrl}}` | `templates/index.json` global config |

---

## Minimal Valid File

The smallest file that will compile is:

```markdown
---
publish: true
title: "Hello World"
date: 2026-03-03T00:00:00
---

Your content here.
```

---

## Notes

- The `date` field controls sort order. Posts without a valid date may sort unpredictably.
- Tags are normalized to lowercase when generating filenames. `My Tag` becomes `tag-my-tag.html`.
- A file with `publish: false` or no `publish` field is silently skipped — useful for drafts.
- The `type` field is free-form. You can create custom templates (e.g. `note.html`, `recipe.html`) and target them by setting `type` accordingly.
