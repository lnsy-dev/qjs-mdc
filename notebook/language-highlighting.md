---
publish: true
title: "Language Highlighting"
date: 2026-03-13T00:00:00
tags:
  - docs
  - features
summary: Syntax highlighting examples for all supported languages.
---

# Language Highlighting

Code blocks are highlighted using CSS variables `--highlight`, `--secondary`, `--neutral-1`, `--neutral-2`, and `--neutral-3`.

## YAML

```yaml
---
publish: true
title: 'My Post Title'
date: 2026-03-13T00:00:00
tags:
  - example
  - guide
type: post
author: Your Name
draft: false
---
```

## Markdown with YAML Front Matter

```markdown-frontmatter
---
publish: true
title: 'My Post Title'
date: 2026-03-13T00:00:00
tags:
  - example
---

# Heading One

This is a paragraph with **bold** and *italic* text.

> A blockquote

- list item one
- list item two

Use `inline code` freely. Here is a [link](https://example.com).
```

## JavaScript

```js
import { parse } from './parser.js';

const greet = async (name = 'world') => {
  const msg = `Hello, ${name}!`;
  return msg;
};

class Parser {
  constructor(input) {
    this.input = input;
    this.pos = 0;
  }

  peek() {
    return this.input[this.pos] ?? null;
  }
}

export default greet;
```

## Python

```py
import os
from pathlib import Path

class Config:
    debug = False
    version = '1.0.0'

    def __init__(self, path):
        self.path = Path(path)

    def load(self):
        if not self.path.exists():
            raise FileNotFoundError(f'No config at {self.path}')
        return True

def main():
    config = Config('./config.toml')
    result = config.load()
    return result if result else None
```

## Rust

```rs
use std::collections::HashMap;

#[derive(Debug)]
struct Config {
    values: HashMap<String, String>,
}

impl Config {
    fn new() -> Self {
        Self { values: HashMap::new() }
    }

    fn get(&self, key: &str) -> Option<&str> {
        self.values.get(key).map(|s| s.as_str())
    }
}

fn main() {
    let mut cfg = Config::new();
    cfg.values.insert("host".to_string(), "localhost".to_string());
    println!("{:?}", cfg.get("host"));
}
```

## HTML

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Example Page</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- Main content -->
  <header>
    <nav>
      <a href="/">Home</a>
    </nav>
  </header>
  <main>
    <h1>Hello World</h1>
    <p>A paragraph with <strong>bold</strong> text.</p>
  </main>
</body>
</html>
```

## JSON

```json
{
  "name": "qjs-md",
  "version": "1.0.0",
  "description": "A fast markdown compiler",
  "config": {
    "output": "./dist",
    "watch": false,
    "pages": 10
  },
  "tags": ["markdown", "static-site", "qjs"],
  "published": true,
  "draft": null
}
```

## Markdown

```markdown
# My Document

A paragraph with **bold**, *italic*, and `inline code`.

> Blockquotes look like this.

- Item one
- Item two
  - Nested item

Here is a [link to somewhere](https://example.com).
```

## Ruby

```rb
require 'json'

class PostLoader
  attr_reader :posts

  def initialize(dir)
    @dir = dir
    @posts = []
  end

  def load
    Dir.glob("#{@dir}/*.md").each do |path|
      @posts << parse(path)
    end
    self
  end

  private

  def parse(path)
    content = File.read(path)
    { path: path, content: content }
  end
end
```

## TOML

```toml
# Site configuration

[site]
title = "My Blog"
url = "https://example.com"
author = "Your Name"

[build]
output = "./dist"
drafts = false
pages_per_index = 10

[features]
rss = true
search = true
tags = true
```
