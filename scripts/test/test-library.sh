#!/bin/bash
set -e

# ── Config ────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LIBRARY="$PROJECT_ROOT/dist/qjs-md.js"

PASS=0
FAIL=0
FAILURES=()

# ── Helpers ───────────────────────────────────────────────────────────────────
pass() { echo "  [PASS] $1"; PASS=$((PASS+1)); }
fail() { echo "  [FAIL] $1"; FAIL=$((FAIL+1)); FAILURES+=("$1"); }

check_output_contains() {
  local desc="$1" script="$2" needle="$3"
  local actual
  actual=$(qjs "$script" 2>&1) || true
  if echo "$actual" | grep -qF "$needle"; then
    pass "$desc"
  else
    fail "$desc (expected '$needle', got: $actual)"
  fi
}

check_output_not_contains() {
  local desc="$1" script="$2" needle="$3"
  local actual
  actual=$(qjs "$script" 2>&1) || true
  if echo "$actual" | grep -qF "$needle"; then
    fail "$desc (unexpected '$needle' in: $actual)"
  else
    pass "$desc"
  fi
}

# ── Pre-flight ────────────────────────────────────────────────────────────────
echo "=== qjs-md Library Tests ==="
echo ""

if [ ! -f "$LIBRARY" ]; then
  echo "ERROR: $LIBRARY not found. Run 'make library' first."
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# ── Test helpers ──────────────────────────────────────────────────────────────

# Write a temporary QJS test script and run it
run_test() {
  local name="$1" body="$2" needle="$3"
  local script="$TMP/test_${name}.js"
  # Import path needs to be relative-absolute for qjs
  cat > "$script" << JSEOF
import { ${name} } from '${LIBRARY}';
${body}
JSEOF
  check_output_contains "$name" "$script" "$needle"
}

run_test_multi() {
  local testname="$1" imports="$2" body="$3" needle="$4"
  local script="$TMP/test_${testname}.js"
  cat > "$script" << JSEOF
import { ${imports} } from '${LIBRARY}';
${body}
JSEOF
  check_output_contains "$testname" "$script" "$needle"
}

# ── Tests ─────────────────────────────────────────────────────────────────────

echo "--- Markdown Parsing ---"

# parseMarkdown: heading
run_test "parseMarkdown" \
  "print(parseMarkdown('# Hello World'));" \
  "<h1>Hello World</h1>"

# parseMarkdown: bold
run_test_multi "parseMarkdown_bold" "parseMarkdown" \
  "print(parseMarkdown('This is **bold** text'));" \
  "<strong>bold</strong>"

# parseMarkdown: inline code
run_test_multi "parseMarkdown_code" "parseMarkdown" \
  "print(parseMarkdown('Use \`const x = 1\`'));" \
  "<code>"

# parseFrontMatter: reads front matter from a temp file
TMPMD="$TMP/test_fm.md"
cat > "$TMPMD" << 'EOF'
---
title: Test Post
tags: [js, web]
publish: true
---
Body content here.
EOF
FMSCRIPT="$TMP/test_parseFrontMatter.js"
cat > "$FMSCRIPT" << JSEOF
import { parseFrontMatter } from '${LIBRARY}';
const result = parseFrontMatter('${TMPMD}');
print(result.data.title);
print(result.content.trim().substring(0, 12));
JSEOF
check_output_contains "parseFrontMatter title" "$FMSCRIPT" "Test Post"
check_output_contains "parseFrontMatter content" "$FMSCRIPT" "Body content"

# parseToAST: returns document with children
run_test "parseToAST" \
  "const ast = parseToAST('# Title\n\nParagraph\n\n## Sub\n\nMore'); print(ast.type || ast.children ? 'ok' : 'fail');" \
  "ok"

echo ""
echo "--- Content Processors ---"

# processWikilinks
run_test "processWikilinks" \
  "print(processWikilinks('See [[Getting Started]] for details'));" \
  'href="getting-started.html"'

run_test_multi "processWikilinks_text" "processWikilinks" \
  "print(processWikilinks('[[My Page]]'));" \
  "My Page"

# makeUrlsClickable
run_test "makeUrlsClickable" \
  "print(makeUrlsClickable('Visit https://example.com today'));" \
  'href="https://example.com"'

run_test_multi "makeUrlsClickable_nomod" "makeUrlsClickable" \
  "const r = makeUrlsClickable('<a href=\"https://example.com\">already linked</a>'); print(r.includes('href=\"https://example.com\"') ? 'ok' : 'fail');" \
  "ok"

# processAbbreviations
run_test "processAbbreviations" \
  "print(processAbbreviations('*[API]: Application Programming Interface\nUse the API now.'));" \
  '<abbr title="Application Programming Interface">API</abbr>'

run_test_multi "processAbbreviations_removed" "processAbbreviations" \
  "const r = processAbbreviations('*[HTML]: HyperText\nHello'); print(r.includes('*[HTML]') ? 'fail' : 'ok');" \
  "ok"

# processFootnotes
run_test "processFootnotes" \
  "const r = processFootnotes('Text[^1].\n\n[^1]: A note.'); print(r.footnotesHtml);" \
  "footnotes"

run_test_multi "processFootnotes_superscript" "processFootnotes" \
  "const r = processFootnotes('See[^note].\n\n[^note]: Details.'); print(r.content);" \
  "sup"

# highlightCode — format produced by the markdown parser is:
#   <pre class="code" data-lang="LANG"><code>…</code></pre>
run_test "highlightCode" \
  "const html = '<pre class=\"code\" data-lang=\"js\"><code>const x = 1;</code></pre>'; print(highlightCode(html));" \
  "<span"

run_test_multi "highlightCode_passthru" "highlightCode" \
  "const html = '<p>No code here</p>'; print(highlightCode(html));" \
  "No code here"

# extractSummary
run_test "extractSummary" \
  "const file = { data: {}, content: '<p>First para.</p><p>Second.</p>' }; print(extractSummary(file));" \
  "First para"

run_test_multi "extractSummary_frontmatter" "extractSummary" \
  "const file = { data: { summary: 'Custom summary' }, content: '<p>Para.</p>' }; print(extractSummary(file));" \
  "Custom summary"

echo ""
echo "--- Table Processing ---"

# processTables
run_test "processTables" \
  "const md = '<p>| A | B |\n| --- | --- |\n| 1 | 2 |</p>'; print(processTables(md));" \
  "<table"

run_test_multi "processTables_header" "processTables" \
  "const md = '<p>| Name | Age |\n| --- | --- |\n| Alice | 30 |</p>'; print(processTables(md));" \
  "<th"

echo ""
echo "--- Filename Utilities ---"

# sanitizeFilename
run_test "sanitizeFilename" \
  "print(sanitizeFilename('Hello, World!'));" \
  "hello-world"

run_test_multi "sanitizeFilename_special" "sanitizeFilename" \
  "print(sanitizeFilename('C++ Tips & Tricks'));" \
  "c-tips-tricks"

run_test_multi "sanitizeFilename_hyphens" "sanitizeFilename" \
  "const r = sanitizeFilename('--test--'); print(r === 'test' ? 'ok' : r);" \
  "ok"

# normalizeTagArray — wraps a single string in an array (does not split commas)
run_test "normalizeTagArray" \
  "print(normalizeTagArray('js').join(','));" \
  "js"

run_test_multi "normalizeTagArray_array" "normalizeTagArray" \
  "print(normalizeTagArray(['a', 'b', 'c']).length);" \
  "3"

run_test_multi "normalizeTagArray_empty" "normalizeTagArray" \
  "print(normalizeTagArray(undefined).length);" \
  "0"

# resolveFilenameConflicts — file objects require a `data` field with a `title`
run_test_multi "resolveFilenameConflicts" "resolveFilenameConflicts" \
  "const files = [{data:{title:'Post'},path:'a.md'},{data:{title:'Post'},path:'b.md'}]; resolveFilenameConflicts(files); print(files[1].outputName);" \
  "post-2.html"

echo ""
echo "--- Date Formatting ---"

# formatPrettyDate
run_test "formatPrettyDate" \
  "print(formatPrettyDate('2026-01-15'));" \
  "January"

run_test_multi "formatPrettyDate_year" "formatPrettyDate" \
  "print(formatPrettyDate('2026-07-04'));" \
  "2026"

echo ""
echo "--- CSS Utilities ---"

# extractCSSColors — returns an Object keyed by property name (not an array)
run_test "extractCSSColors" \
  "const css = [':root { --color-primary: #3b82f6; --color-secondary: #10b981; }']; const r = extractCSSColors(css); print(r && Object.keys(r).length > 0 ? 'ok' : 'none');" \
  "ok"

echo ""
echo "--- Convenience Pipeline ---"

# compileMarkdown: full pipeline
run_test "compileMarkdown" \
  "print(compileMarkdown('# Hello\n\nVisit https://example.com'));" \
  "<h1>Hello</h1>"

run_test_multi "compileMarkdown_link" "compileMarkdown" \
  "print(compileMarkdown('Visit https://example.com for info'));" \
  'href="https://example.com"'

run_test_multi "compileMarkdown_abbr" "compileMarkdown" \
  "print(compileMarkdown('*[CSS]: Cascading Style Sheets\nWrite CSS today.'));" \
  "<abbr"

run_test_multi "compileMarkdown_table" "compileMarkdown" \
  "print(compileMarkdown('| A | B |\n| --- | --- |\n| 1 | 2 |'));" \
  "<table"

run_test_multi "compileMarkdown_footnote" "compileMarkdown" \
  "print(compileMarkdown('Text[^1].\n\n[^1]: A footnote.'));" \
  "footnote"

run_test_multi "compileMarkdown_wikilink" "compileMarkdown" \
  "print(compileMarkdown('See [[My Page]].'));" \
  "my-page.html"

echo ""
echo "--- Template Engine ---"

# compileTemplate: variable substitution
run_test_multi "compileTemplate" "compileTemplate" \
  "print(compileTemplate('<h1>{{title}}</h1><p>{{body}}</p>', { title: 'Hello', body: 'World' }, '/tmp'));" \
  "<h1>Hello</h1>"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "================================"
echo "Results: $PASS passed, $FAIL failed"

if [ ${#FAILURES[@]} -gt 0 ]; then
  echo ""
  echo "Failed tests:"
  for f in "${FAILURES[@]}"; do
    echo "  - $f"
  done
  echo ""
  exit 1
else
  echo ""
  echo "All library tests passed!"
fi
