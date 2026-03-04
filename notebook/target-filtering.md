---
publish: true
title: "Filtering by Target"
date: 2026-03-04T00:00:00
tags:
  - guide
  - tutorial
target: tiny-ag.blog
summary: Use the --target flag to filter which markdown files get compiled based on a target field in YAML front matter.
---

# Filtering by Target

The `--target` flag lets you compile only the markdown files intended for a specific destination, using the `target` field in YAML front matter.

## Front Matter

Add a `target` field to any markdown file:

```markdown
---
publish: true
title: My Post
date: 2026-03-04T00:00:00
target: tiny-ag.blog
---
```

## Usage

```bash
./mdc notebook --output docs --target tiny-ag.blog
```

Only files where `target: tiny-ag.blog` will be compiled. Files with a different `target` value or no `target` field are skipped.

## Without the Flag

Running without `--target` compiles all publishable files regardless of their `target` field:

```bash
./mdc notebook --output docs
```

This is the default behavior and is backwards-compatible — existing files without a `target` field continue to work as before.
