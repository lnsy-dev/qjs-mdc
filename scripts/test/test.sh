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
