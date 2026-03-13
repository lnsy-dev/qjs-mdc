#!/bin/bash
set -e

# ── Config ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MCD="$PROJECT_ROOT/dist/mdc"

TMP="$(mktemp -d)"
SRC="$TMP/src"
OUT="$TMP/out"

PASS=0
FAIL=0
FAILURES=()

# ── Helpers ───────────────────────────────────────────────────────────────────
pass() { echo "  [PASS] $1"; PASS=$((PASS+1)); }
fail() { echo "  [FAIL] $1"; FAIL=$((FAIL+1)); FAILURES+=("$1"); }

check_file_exists() {
  local desc="$1" path="$2"
  if [ -f "$path" ]; then pass "$desc"; else fail "$desc (missing: $path)"; fi
}

check_contains() {
  local desc="$1" path="$2" needle="$3"
  if grep -qF "$needle" "$path" 2>/dev/null; then
    pass "$desc"
  else
    fail "$desc (expected '$needle' in $path)"
  fi
}

check_not_contains() {
  local desc="$1" path="$2" needle="$3"
  if grep -qF "$needle" "$path" 2>/dev/null; then
    fail "$desc (unexpected '$needle' in $path)"
  else
    pass "$desc"
  fi
}

# Build a minimal templates dir in $SRC.
# All generator pages (index, search, tags, tag) inject their content into {{content}}.
setup_templates() {
  mkdir -p "$SRC/templates"

  # Post template - used for individual posts by default
  cat > "$SRC/templates/post.html" << 'EOF'
<!DOCTYPE html>
<html>
<head><title>{{title}}</title></head>
<body>
<time>{{date}}</time>
{{content}}
<div class="tags">{{tags}}</div>
<div class="tag-list">{{tag_list}}</div>
</body>
</html>
EOF

  # Default template - used when type: default is set, or as fallback if post.html absent
  cat > "$SRC/templates/default.html" << 'EOF'
<!DOCTYPE html>
<html>
<head><title>{{title}}</title></head>
<body>{{content}}</body>
</html>
EOF

  cat > "$SRC/templates/header.html" << 'EOF'
<header><a href="/">{{site_name}}</a></header>
EOF

  cat > "$SRC/templates/meta.html" << 'EOF'
<meta charset="UTF-8"><title>{{title}} | {{site_name}}</title>
EOF

  cat > "$SRC/templates/footer.html" << 'EOF'
<footer>{{author}}</footer>
EOF

  # Index template: stubs are injected into {{content}}
  cat > "$SRC/templates/index.html" << 'EOF'
<!DOCTYPE html>
<html>
<head><title>{{site_name}}</title></head>
<body>{{content}}</body>
</html>
EOF

  cat > "$SRC/templates/stub.html" << 'EOF'
<li class="post-stub"><h3><a href="{{url}}">{{title}}</a></h3><p>{{summary}}</p><small>{{date}}</small></li>
EOF

  # Search template: search UI injected into {{content}}
  cat > "$SRC/templates/search.html" << 'EOF'
<!DOCTYPE html>
<html><body>{{content}}</body></html>
EOF

  # Tags index template: tag list injected into {{content}}
  cat > "$SRC/templates/tags.html" << 'EOF'
<!DOCTYPE html>
<html><body>{{content}}</body></html>
EOF

  # Individual tag template: post stubs injected into {{content}}
  cat > "$SRC/templates/tag.html" << 'EOF'
<!DOCTYPE html>
<html><body>{{title}}{{content}}</body></html>
EOF

  cat > "$SRC/templates/about.html" << 'EOF'
<!DOCTYPE html>
<html><body>{{content}}</body></html>
EOF

  cat > "$SRC/templates/index.json" << 'EOF'
{
  "site_name": "Test Site",
  "site_description": "Integration test site",
  "site_url": "https://example.com",
  "author": "Test Author"
}
EOF
}

reset_src() {
  rm -rf "$SRC" "$OUT"
  mkdir -p "$SRC" "$OUT"
  setup_templates
}

compile() {
  "$MCD" "$SRC" --output "$OUT" "$@" 2>&1
}

compile_file() {
  local input="$1"; shift
  "$MCD" compile-file "$input" "$@" 2>&1
}

# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "=== qjs-md integration tests ==="
echo ""

# ── Guard: binary must exist ──────────────────────────────────────────────────
if [ ! -f "$MCD" ]; then
  echo "[ERROR] Binary not found: $MCD"
  echo "        Run 'make' in the project root first."
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 1. Basic compilation ---"
reset_src
cat > "$SRC/hello.md" << 'EOF'
---
publish: true
title: "Hello World"
date: 2026-01-01T00:00:00
---

Hello from the test suite.
EOF
compile > /dev/null
check_file_exists "basic: output file created"  "$OUT/hello-world.html"
check_contains    "basic: title in output"       "$OUT/hello-world.html" "Hello World"
check_contains    "basic: content rendered"      "$OUT/hello-world.html" "Hello from the test suite"
check_file_exists "basic: index.html created"    "$OUT/index.html"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 2. Post template selected by default ---"
reset_src
cat > "$SRC/my-post.md" << 'EOF'
---
publish: true
title: "My Post"
date: 2026-02-01T00:00:00
tags:
  - alpha
  - beta
---

Post body content here.
EOF
compile > /dev/null
check_file_exists "post template: output exists"       "$OUT/my-post.html"
check_contains    "post template: date rendered"       "$OUT/my-post.html" "<time>"
check_file_exists "post template: tag-alpha page"      "$OUT/tag-alpha.html"
check_file_exists "post template: tag-beta page"       "$OUT/tag-beta.html"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 3. File with publish: false is skipped ---"
reset_src
cat > "$SRC/draft.md" << 'EOF'
---
publish: false
title: "Draft Post"
date: 2026-01-10T00:00:00
---

This should not compile.
EOF
compile > /dev/null
if [ -f "$OUT/draft-post.html" ]; then
  fail "draft: unpublished file should not be compiled"
else
  pass "draft: unpublished file correctly skipped"
fi

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 4. File with no front matter is skipped ---"
reset_src
cat > "$SRC/bare.md" << 'EOF'
# Just a heading

No front matter at all.
EOF
compile > /dev/null
if [ -f "$OUT/bare.html" ]; then
  fail "bare: file without front matter should be skipped"
else
  pass "bare: file without front matter correctly skipped"
fi

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 5. Tags generate tag pages and tag index ---"
reset_src
cat > "$SRC/tagged-post.md" << 'EOF'
---
publish: true
title: "Tagged Post"
date: 2026-03-01T00:00:00
tags:
  - rust
  - systems
---

Content here.
EOF
compile > /dev/null
check_file_exists "tags: tags.html generated"          "$OUT/tags.html"
check_file_exists "tags: tag-rust.html generated"      "$OUT/tag-rust.html"
check_file_exists "tags: tag-systems.html generated"   "$OUT/tag-systems.html"
# Tag page content (injected via {{content}}) includes the post title in a stub
check_contains    "tags: post title appears in tag page" "$OUT/tag-rust.html" "Tagged Post"
# Tags index contains link to the tag page
check_contains    "tags: tag link in tags index"       "$OUT/tags.html" "tag-rust.html"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 6. Wikilinks conversion ---"
reset_src
cat > "$SRC/wikilink-post.md" << 'EOF'
---
publish: true
title: "Wikilink Post"
date: 2026-03-02T00:00:00
---

See [[Another Page]] for details.
EOF
compile > /dev/null
check_contains "wikilinks: link converted to anchor" "$OUT/wikilink-post.html" '<a href="another-page.html">'
check_contains "wikilinks: anchor text preserved"    "$OUT/wikilink-post.html" "Another Page"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 7a. Footnotes ---"
reset_src
cat > "$SRC/footnote-post.md" << 'EOF'
---
publish: true
title: "Footnote Post"
date: 2026-03-03T00:00:00
---

This claim needs a source.[^source] Another point here.[^note]

[^source]: The original reference document.
[^note]: An explanatory aside.
EOF
compile > /dev/null
check_contains     "footnotes: inline ref rendered"       "$OUT/footnote-post.html" 'class="footnote-ref"'
check_contains     "footnotes: superscript link"          "$OUT/footnote-post.html" '<sup>'
check_contains     "footnotes: footnote section rendered" "$OUT/footnote-post.html" 'class="footnotes"'
check_contains     "footnotes: first footnote text"       "$OUT/footnote-post.html" 'The original reference document.'
check_contains     "footnotes: back link rendered"        "$OUT/footnote-post.html" 'class="footnote-back"'
check_not_contains "footnotes: definition line removed"   "$OUT/footnote-post.html" '[^source]:'

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 7b. Footnotes: wikilinks stripped from footnote text ---"
reset_src
cat > "$SRC/fn-wikilink.md" << 'EOF'
---
publish: true
title: "Footnote Wikilink Post"
date: 2026-03-03T00:00:00
---

See the docs.[^ref]

[^ref]: Read [[Getting Started]] for more. Also see https://example.com.
EOF
compile > /dev/null
check_contains     "fn-wikilink: plain text kept"         "$OUT/footnote-wikilink-post.html" "Getting Started"
check_not_contains "fn-wikilink: wikilink brackets gone"  "$OUT/footnote-wikilink-post.html" "[[Getting Started]]"
check_contains     "fn-wikilink: http url preserved"      "$OUT/footnote-wikilink-post.html" "https://example.com"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 7. Abbreviations ---"
reset_src
cat > "$SRC/abbr-post.md" << 'EOF'
---
publish: true
title: "Abbreviation Post"
date: 2026-03-03T00:00:00
---

HTML is great.

*[HTML]: HyperText Markup Language
EOF
compile > /dev/null
check_contains     "abbr: abbr tag rendered"       "$OUT/abbreviation-post.html" '<abbr title="HyperText Markup Language">HTML</abbr>'
check_not_contains "abbr: definition line removed"  "$OUT/abbreviation-post.html" "*[HTML]:"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 8. Code highlighting ---"
reset_src
cat > "$SRC/code-post.md" << 'EOF'
---
publish: true
title: "Code Post"
date: 2026-03-04T00:00:00
---

```js
const x = true;
return x;
```
EOF
compile > /dev/null
check_contains "highlight: keyword span rendered"  "$OUT/code-post.html" 'class="keyword"'
check_contains "highlight: literal span rendered"  "$OUT/code-post.html" 'class="literal"'
check_contains "highlight: language class applied" "$OUT/code-post.html" 'language-js'

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 9. Summary extraction (from front matter) ---"
reset_src
cat > "$SRC/summary-post.md" << 'EOF'
---
publish: true
title: "Summary Post"
date: 2026-03-05T00:00:00
summary: "This is a custom summary."
---

This paragraph would otherwise be the summary.
EOF
compile > /dev/null
# Index page contains stubs via {{content}}; summary appears in stub
check_contains "summary: front matter summary in index" "$OUT/index.html" "This is a custom summary"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 10. Summary extraction (from first paragraph) ---"
reset_src
cat > "$SRC/auto-summary.md" << 'EOF'
---
publish: true
title: "Auto Summary"
date: 2026-03-06T00:00:00
---

First paragraph becomes summary.

Second paragraph is not the summary.
EOF
compile > /dev/null
check_contains "auto-summary: first paragraph used in index" "$OUT/index.html" "First paragraph becomes summary"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 11. --target flag filters files ---"
reset_src
cat > "$SRC/targeted.md" << 'EOF'
---
publish: true
title: "Targeted Post"
date: 2026-03-07T00:00:00
target: site-a
---

Only for site-a.
EOF
cat > "$SRC/not-targeted.md" << 'EOF'
---
publish: true
title: "Not Targeted"
date: 2026-03-07T00:00:00
target: site-b
---

Only for site-b.
EOF
compile --target site-a > /dev/null
check_file_exists "target: site-a file compiled" "$OUT/targeted-post.html"
if [ -f "$OUT/not-targeted.html" ]; then
  fail "target: site-b file should not be compiled"
else
  pass "target: site-b file correctly excluded"
fi

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 12. --force flag rebuilds unchanged files ---"
reset_src
cat > "$SRC/force-post.md" << 'EOF'
---
publish: true
title: "Force Post"
date: 2026-03-08T00:00:00
---

Force rebuild test.
EOF
compile > /dev/null
FORCE_LOG=$(compile --force)
if echo "$FORCE_LOG" | grep -q "(unchanged)"; then
  fail "force: file was skipped despite --force"
else
  pass "force: file rebuilt with --force"
fi
check_contains "force: output still valid" "$OUT/force-post.html" "Force Post"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 13. Duplicate titles resolved with suffix ---"
reset_src
cat > "$SRC/dupe-one.md" << 'EOF'
---
publish: true
title: "Duplicate"
date: 2026-01-01T00:00:00
---
First duplicate.
EOF
cat > "$SRC/dupe-two.md" << 'EOF'
---
publish: true
title: "Duplicate"
date: 2026-01-02T00:00:00
---
Second duplicate.
EOF
compile > /dev/null
check_file_exists "dupe: first file created"   "$OUT/duplicate.html"
check_file_exists "dupe: second file suffixed" "$OUT/duplicate-2.html"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 14. Search page and data generated ---"
reset_src
cat > "$SRC/search-post.md" << 'EOF'
---
publish: true
title: "Searchable"
date: 2026-03-09T00:00:00
---

Searchable content.
EOF
compile > /dev/null
check_file_exists "search: search.html generated"       "$OUT/search.html"
check_file_exists "search: search-data.json generated"  "$OUT/search-data.json"
# Post title is indexed in search-data.json
check_contains    "search: post title in search data"   "$OUT/search-data.json" "Searchable"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 15. Tags with special characters normalized ---"
reset_src
cat > "$SRC/special-tag.md" << 'EOF'
---
publish: true
title: "Special Tag Post"
date: 2026-03-10T00:00:00
tags:
  - "C++"
  - "My Tag"
---

Content.
EOF
compile > /dev/null
check_file_exists "tags: C++ tag page uses sanitized name" "$OUT/tag-c.html"
check_file_exists "tags: spaced tag page uses dashes"      "$OUT/tag-my-tag.html"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 16. Template includes ({{header.html}}, {{footer.html}}) ---"
reset_src
# Use type: default to select default.html (bypasses post.html priority)
cat > "$SRC/templates/default.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>{{meta.html}}</head>
<body>{{header.html}}{{content}}{{footer.html}}</body>
</html>
EOF
cat > "$SRC/include-post.md" << 'EOF'
---
publish: true
title: "Include Test"
date: 2026-03-11T00:00:00
type: default
---

Testing includes.
EOF
compile > /dev/null
check_contains "includes: header.html content injected" "$OUT/include-test.html" "Test Site"
check_contains "includes: footer.html content injected" "$OUT/include-test.html" "Test Author"
check_contains "includes: meta.html content injected"   "$OUT/include-test.html" "charset"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 17. Tags as inline YAML flow sequence ---"
reset_src
cat > "$SRC/inline-tags.md" << 'EOF'
---
publish: true
title: "Inline Tags"
date: 2026-03-12T00:00:00
tags: [foo, bar, baz]
---

Content.
EOF
compile > /dev/null
check_file_exists "inline-tags: foo tag page"  "$OUT/tag-foo.html"
check_file_exists "inline-tags: bar tag page"  "$OUT/tag-bar.html"
check_file_exists "inline-tags: baz tag page"  "$OUT/tag-baz.html"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 18. Single tag (string scalar, not array) ---"
reset_src
cat > "$SRC/single-tag.md" << 'EOF'
---
publish: true
title: "Single Tag"
date: 2026-03-13T00:00:00
tags: solo
---

Content.
EOF
compile > /dev/null
check_file_exists "single-tag: tag page generated" "$OUT/tag-solo.html"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 19. Unchanged file skipped on second compile ---"
reset_src
cat > "$SRC/stable.md" << 'EOF'
---
publish: true
title: "Stable Post"
date: 2026-03-14T00:00:00
---

Content.
EOF
compile > /dev/null
SECOND_LOG=$(compile 2>&1)
if echo "$SECOND_LOG" | grep -q "(unchanged)"; then
  pass "cache: unchanged file skipped on second run"
else
  fail "cache: expected '(unchanged)' in second compile output"
fi

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 20. Multiple posts: index lists all ---"
reset_src
for i in 1 2 3; do
  cat > "$SRC/post-$i.md" << EOF
---
publish: true
title: "Post $i"
date: 2026-0$i-01T00:00:00
---

Content of post $i.
EOF
done
compile > /dev/null
# Stubs are rendered into {{content}} in index.html; titles appear via stub.html
check_contains "multi: post 1 in index" "$OUT/index.html" "Post 1"
check_contains "multi: post 2 in index" "$OUT/index.html" "Post 2"
check_contains "multi: post 3 in index" "$OUT/index.html" "Post 3"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 21. Template variable fallback to index.json globals ---"
reset_src
# Override default.html to reference {{author}} directly
cat > "$SRC/templates/default.html" << 'EOF'
<!DOCTYPE html>
<html><body><span id="author">{{author}}</span>{{content}}</body></html>
EOF
# Use type: default so this template is selected (not post.html)
cat > "$SRC/no-author.md" << 'EOF'
---
publish: true
title: "No Author Post"
date: 2026-03-15T00:00:00
type: default
---

No author field in front matter.
EOF
compile > /dev/null
# author should fall back to index.json global "Test Author"
check_contains "var-fallback: global author from index.json" "$OUT/no-author-post.html" "Test Author"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 22. Nested subdirectory markdown files ---"
reset_src
mkdir -p "$SRC/subdir"
cat > "$SRC/subdir/nested.md" << 'EOF'
---
publish: true
title: "Nested Post"
date: 2026-03-16T00:00:00
---

Nested content.
EOF
compile > /dev/null
check_file_exists "nested: file in subdir compiled" "$OUT/nested-post.html"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 23. RSS feed generated ---"
reset_src
cat > "$SRC/rss-post.md" << 'EOF'
---
publish: true
title: "RSS Post"
date: 2026-03-17T00:00:00
---

RSS content.
EOF
compile > /dev/null
check_file_exists "rss: rss.xml generated"           "$OUT/rss.xml"
check_contains    "rss: post title in feed"          "$OUT/rss.xml" "RSS Post"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 24. Python and Rust code highlighting ---"
reset_src
cat > "$SRC/highlight-langs.md" << 'EOF'
---
publish: true
title: "Highlight Langs"
date: 2026-03-18T00:00:00
---

```py
def hello():
    return True
```

```rs
fn main() {
    let x = true;
}
```
EOF
compile > /dev/null
check_contains "highlight: py language class" "$OUT/highlight-langs.html" 'language-py'
check_contains "highlight: rs language class" "$OUT/highlight-langs.html" 'language-rs'
check_contains "highlight: py keyword def"    "$OUT/highlight-langs.html" 'class="keyword"'
check_contains "highlight: py literal True"   "$OUT/highlight-langs.html" 'class="literal"'

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 25. Empty source directory (no publishable files) ---"
rm -rf "$OUT" && mkdir -p "$OUT"
compile > /dev/null
check_file_exists "empty-src: index.html still generated" "$OUT/index.html"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 26. Tags rendered as HTML links in post ---"
reset_src
cat > "$SRC/tag-links.md" << 'EOF'
---
publish: true
title: "Tag Links Post"
date: 2026-03-19T00:00:00
tags:
  - golang
  - systems
---

Content.
EOF
compile > /dev/null
# {{tags}} should render as <a> elements with class="tag"
check_contains "tag-links: anchor tag rendered" "$OUT/tag-links-post.html" 'class="tag"'
check_contains "tag-links: tag href correct"    "$OUT/tag-links-post.html" 'href="tag-golang.html"'

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 27. tag_list variable (comma-separated tag names) ---"
reset_src
cat > "$SRC/tag-list-post.md" << 'EOF'
---
publish: true
title: "Tag List Post"
date: 2026-03-20T00:00:00
tags:
  - alpha
  - beta
  - gamma
---

Content.
EOF
compile > /dev/null
# {{tag_list}} should be "alpha, beta, gamma" (or similar comma-joined string)
check_contains "tag-list: tag names comma-joined" "$OUT/tag-list-post.html" "alpha"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 28. Custom type selects matching template ---"
reset_src
cat > "$SRC/templates/recipe.html" << 'EOF'
<!DOCTYPE html>
<html><body><h1 class="recipe-title">{{title}}</h1>{{content}}</body></html>
EOF
cat > "$SRC/custom-type.md" << 'EOF'
---
publish: true
title: "Pasta Carbonara"
date: 2026-03-21T00:00:00
type: recipe
---

Eggs, cheese, guanciale.
EOF
compile > /dev/null
check_contains "custom-type: recipe template used" "$OUT/pasta-carbonara.html" 'class="recipe-title"'
check_contains "custom-type: title rendered"       "$OUT/pasta-carbonara.html" "Pasta Carbonara"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 29. About page generated ---"
reset_src
cat > "$SRC/hello.md" << 'EOF'
---
publish: true
title: "Hello"
date: 2026-01-01T00:00:00
---
Hello.
EOF
compile > /dev/null
check_file_exists "about: about.html generated" "$OUT/about.html"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 30. URL in markdown content made clickable ---"
reset_src
cat > "$SRC/url-post.md" << 'EOF'
---
publish: true
title: "URL Post"
date: 2026-03-22T00:00:00
---

Visit https://example.com for more info.
EOF
compile > /dev/null
check_contains "url: bare URL wrapped in anchor" "$OUT/url-post.html" 'href="https://example.com"'

# ═══════════════════════════════════════════════════════════════════════════════
echo "--- 31. compile-file: basic output created ---"
CF_DIR="$(mktemp -d)"
cat > "$CF_DIR/article.md" << 'EOF'
---
title: "My Article"
date: 2026-01-15
---

Hello from compile-file.
EOF
compile_file "$CF_DIR/article.md" --output "$CF_DIR/article.html" > /dev/null
check_file_exists "compile-file: output file created"    "$CF_DIR/article.html"
check_contains    "compile-file: content rendered"       "$CF_DIR/article.html" "Hello from compile-file"
check_contains    "compile-file: DOCTYPE present"        "$CF_DIR/article.html" "<!DOCTYPE html>"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 32. compile-file: title in <title> and og:title ---"
check_contains "compile-file: <title> set"    "$CF_DIR/article.html" "<title>My Article</title>"
check_contains "compile-file: og:title set"   "$CF_DIR/article.html" 'og:title'
check_contains "compile-file: og:title value" "$CF_DIR/article.html" "My Article"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 33. compile-file: description meta tags ---"
cat > "$CF_DIR/described.md" << 'EOF'
---
title: "Described"
description: "A short summary of the page."
---

Body text.
EOF
compile_file "$CF_DIR/described.md" --output "$CF_DIR/described.html" > /dev/null
check_contains "compile-file: description meta"         "$CF_DIR/described.html" 'name="description"'
check_contains "compile-file: description value"        "$CF_DIR/described.html" "A short summary of the page."
check_contains "compile-file: og:description meta"      "$CF_DIR/described.html" 'og:description'

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 34. compile-file: author meta tag ---"
cat > "$CF_DIR/authored.md" << 'EOF'
---
title: "Authored"
author: "Jane Doe"
---

Content.
EOF
compile_file "$CF_DIR/authored.md" --output "$CF_DIR/authored.html" > /dev/null
check_contains "compile-file: author meta"  "$CF_DIR/authored.html" 'name="author"'
check_contains "compile-file: author value" "$CF_DIR/authored.html" "Jane Doe"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 35. compile-file: keywords from tags ---"
cat > "$CF_DIR/tagged.md" << 'EOF'
---
title: "Tagged"
tags: [javascript, web, tutorial]
---

Content.
EOF
compile_file "$CF_DIR/tagged.md" --output "$CF_DIR/tagged.html" > /dev/null
check_contains "compile-file: keywords meta"      "$CF_DIR/tagged.html" 'name="keywords"'
check_contains "compile-file: tag in keywords"    "$CF_DIR/tagged.html" "javascript"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 36. compile-file: date meta tag ---"
cat > "$CF_DIR/dated.md" << 'EOF'
---
title: "Dated"
date: 2026-06-01
---

Content.
EOF
compile_file "$CF_DIR/dated.md" --output "$CF_DIR/dated.html" > /dev/null
check_contains "compile-file: date meta" "$CF_DIR/dated.html" 'name="date"'
check_contains "compile-file: date value" "$CF_DIR/dated.html" "2026-06-01"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 37. compile-file: lang attribute on <html> ---"
cat > "$CF_DIR/lang-fr.md" << 'EOF'
---
title: "French"
lang: fr
---

Bonjour.
EOF
compile_file "$CF_DIR/lang-fr.md" --output "$CF_DIR/lang-fr.html" > /dev/null
check_contains "compile-file: lang set on html element" "$CF_DIR/lang-fr.html" 'lang="fr"'

cat > "$CF_DIR/lang-default.md" << 'EOF'
---
title: "Default Lang"
---

Hello.
EOF
compile_file "$CF_DIR/lang-default.md" --output "$CF_DIR/lang-default.html" > /dev/null
check_contains "compile-file: lang defaults to en" "$CF_DIR/lang-default.html" 'lang="en"'

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 38. compile-file: canonical link ---"
cat > "$CF_DIR/canonical.md" << 'EOF'
---
title: "Canonical"
canonical: "https://example.com/canonical"
---

Content.
EOF
compile_file "$CF_DIR/canonical.md" --output "$CF_DIR/canonical.html" > /dev/null
check_contains "compile-file: canonical link"  "$CF_DIR/canonical.html" 'rel="canonical"'
check_contains "compile-file: canonical href"  "$CF_DIR/canonical.html" "https://example.com/canonical"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 39. compile-file: og:image meta tag ---"
cat > "$CF_DIR/ogimage.md" << 'EOF'
---
title: "OG Image"
image: "https://example.com/cover.png"
---

Content.
EOF
compile_file "$CF_DIR/ogimage.md" --output "$CF_DIR/ogimage.html" > /dev/null
check_contains "compile-file: og:image meta"  "$CF_DIR/ogimage.html" 'og:image'
check_contains "compile-file: og:image value" "$CF_DIR/ogimage.html" "https://example.com/cover.png"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 40. compile-file: default output path (no --output) ---"
cat > "$CF_DIR/no-output-flag.md" << 'EOF'
---
title: "No Output Flag"
---

Content.
EOF
compile_file "$CF_DIR/no-output-flag.md" > /dev/null
check_file_exists "compile-file: default output is <source>.html" "$CF_DIR/no-output-flag.html"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 41. compile-file: markdown rendered (bold, links, headings) ---"
cat > "$CF_DIR/markdown.md" << 'EOF'
---
title: "Markdown"
---

## Section Heading

This is **bold** text and a [link](https://example.com).
EOF
compile_file "$CF_DIR/markdown.md" --output "$CF_DIR/markdown.html" > /dev/null
check_contains "compile-file: heading rendered"    "$CF_DIR/markdown.html" "<h2>"
check_contains "compile-file: bold rendered"       "$CF_DIR/markdown.html" "<strong>"
check_contains "compile-file: link rendered"       "$CF_DIR/markdown.html" 'href="https://example.com"'

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 42. compile-file: code highlighting applied ---"
cat > "$CF_DIR/code.md" << 'EOF'
---
title: "Code"
---

```js
const x = true;
```
EOF
compile_file "$CF_DIR/code.md" --output "$CF_DIR/code.html" > /dev/null
check_contains "compile-file: language class applied" "$CF_DIR/code.html" "language-js"
check_contains "compile-file: keyword highlighted"    "$CF_DIR/code.html" 'class="keyword"'

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 43. compile-file: meta tags absent when fields not set ---"
cat > "$CF_DIR/minimal.md" << 'EOF'
---
title: "Minimal"
---

Content.
EOF
compile_file "$CF_DIR/minimal.md" --output "$CF_DIR/minimal.html" > /dev/null
check_not_contains "compile-file: no description meta when absent" "$CF_DIR/minimal.html" 'name="description"'
check_not_contains "compile-file: no author meta when absent"      "$CF_DIR/minimal.html" 'name="author"'
check_not_contains "compile-file: no keywords meta when absent"    "$CF_DIR/minimal.html" 'name="keywords"'
check_not_contains "compile-file: no canonical when absent"        "$CF_DIR/minimal.html" 'rel="canonical"'

rm -rf "$CF_DIR"

# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "=== to-json tests ==="
echo ""
TJ_DIR="$(mktemp -d)"

to_json() {
  local input="$1"; shift
  "$MCD" to-json "$input" "$@" 2>&1
}

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 44. to-json: output file created and keys present ---"
cat > "$TJ_DIR/basic.md" << 'EOF'
---
title: "Test Doc"
---

# Hello World

Some paragraph text.
EOF
to_json "$TJ_DIR/basic.md" --output "$TJ_DIR/basic.json" > /dev/null
check_file_exists "to-json: output file created"        "$TJ_DIR/basic.json"
check_contains    "to-json: valid JSON (opening brace)" "$TJ_DIR/basic.json" '{'
check_contains    "to-json: frontMatter key present"    "$TJ_DIR/basic.json" '"frontMatter"'
check_contains    "to-json: content key present"        "$TJ_DIR/basic.json" '"content"'

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 45. to-json: frontMatter fields populated ---"
check_contains "to-json: title in frontMatter" "$TJ_DIR/basic.json" '"title"'
check_contains "to-json: title value"          "$TJ_DIR/basic.json" '"Test Doc"'

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 46. to-json: heading node structure ---"
check_contains "to-json: heading type"  "$TJ_DIR/basic.json" '"type": "heading"'
check_contains "to-json: heading level" "$TJ_DIR/basic.json" '"level": 1'
check_contains "to-json: heading id"    "$TJ_DIR/basic.json" '"id": "hello-world"'
check_contains "to-json: heading text"  "$TJ_DIR/basic.json" '"text": "Hello World"'

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 47. to-json: paragraph inside heading children ---"
check_contains "to-json: paragraph type" "$TJ_DIR/basic.json" '"type": "paragraph"'
check_contains "to-json: paragraph text" "$TJ_DIR/basic.json" '"text": "Some paragraph text.'

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 48. to-json: default output path (no --output) ---"
cat > "$TJ_DIR/no-output.md" << 'EOF'
---
title: "No Output"
---

Content.
EOF
to_json "$TJ_DIR/no-output.md" > /dev/null
check_file_exists "to-json: default output is <source>.json" "$TJ_DIR/no-output.json"

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 49. to-json: list node with items ---"
cat > "$TJ_DIR/list.md" << 'EOF'
---
title: "List"
---

# Items

- Alpha
- Beta
- Gamma
EOF
to_json "$TJ_DIR/list.md" --output "$TJ_DIR/list.json" > /dev/null
check_contains "to-json: list type"       "$TJ_DIR/list.json" '"type": "list"'
check_contains "to-json: list not ordered" "$TJ_DIR/list.json" '"ordered": false'
check_contains "to-json: listItem type"  "$TJ_DIR/list.json" '"type": "listItem"'
check_contains "to-json: listItem text"  "$TJ_DIR/list.json" '"text": "Alpha"'

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 50. to-json: task list items ---"
cat > "$TJ_DIR/tasks.md" << 'EOF'
---
title: "Tasks"
---

# Tasks

- [x] Done item
- [ ] Pending item
EOF
to_json "$TJ_DIR/tasks.md" --output "$TJ_DIR/tasks.json" > /dev/null
check_contains "to-json: task:true present"     "$TJ_DIR/tasks.json" '"task": true'
check_contains "to-json: checked:true present"  "$TJ_DIR/tasks.json" '"checked": true'
check_contains "to-json: checked:false present" "$TJ_DIR/tasks.json" '"checked": false'

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 51. to-json: code block node ---"
cat > "$TJ_DIR/code.md" << 'MDEOF'
---
title: "Code"
---

# Code

```bash
echo hello
```
MDEOF
to_json "$TJ_DIR/code.md" --output "$TJ_DIR/code.json" > /dev/null
check_contains "to-json: codeBlock type"     "$TJ_DIR/code.json" '"type": "codeBlock"'
check_contains "to-json: codeBlock language" "$TJ_DIR/code.json" '"language": "bash"'
check_contains "to-json: codeBlock code"     "$TJ_DIR/code.json" '"code"'

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 52. to-json: footnotes collected at document root ---"
cat > "$TJ_DIR/footnotes.md" << 'EOF'
---
title: "Footnotes"
---

# Section

Text with a note [^1].

[^1]: The footnote text.
EOF
to_json "$TJ_DIR/footnotes.md" --output "$TJ_DIR/footnotes.json" > /dev/null
check_contains "to-json: footnotes array present" "$TJ_DIR/footnotes.json" '"footnotes"'
check_contains "to-json: footnote id present"     "$TJ_DIR/footnotes.json" '"id": 1'
check_contains "to-json: footnote text present"   "$TJ_DIR/footnotes.json" 'The footnote text'

# ─────────────────────────────────────────────────────────────────────────────
echo "--- 53. to-json: nested heading hierarchy ---"
cat > "$TJ_DIR/nested.md" << 'EOF'
---
title: "Nested"
---

# Top Level

## Sub Section

Sub paragraph.
EOF
to_json "$TJ_DIR/nested.md" --output "$TJ_DIR/nested.json" > /dev/null
check_contains "to-json: h1 present"     "$TJ_DIR/nested.json" '"level": 1'
check_contains "to-json: h2 present"     "$TJ_DIR/nested.json" '"level": 2'
check_contains "to-json: sub-section id" "$TJ_DIR/nested.json" '"id": "sub-section"'

rm -rf "$TJ_DIR"

# ═══════════════════════════════════════════════════════════════════════════════
echo ""
echo "=== Results ==="
echo "  Passed: $PASS"
echo "  Failed: $FAIL"

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo ""
  echo "  Failed tests:"
  for f in "${FAILURES[@]}"; do
    echo "    - $f"
  done
fi

echo ""
rm -rf "$TMP"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
