/**
 * @fileoverview generate-docs command: walks a directory of JavaScript files,
 * extracts JSDoc comment blocks, and writes one Markdown file per source file
 * with YAML front matter carrying path, description, and function index metadata.
 *
 * Usage:
 *   mdc generate-docs <input-directory> --output <output-directory>
 *
 * JSDoc tags recognised:
 *   @fileoverview / @file  — file-level description (goes into YAML front matter)
 *   @description / @desc   — block description
 *   @param                 — parameter: {type} name - description
 *   @returns / @return     — return value: {type} description
 *   @example               — freeform code example
 *   @throws                — exception: {type} description
 *   @feature               — short feature name (compatible with library.js tags)
 *
 * Each output .md file is suitable for ingestion by the standard mdc compile
 * pipeline, so generated docs can be published as part of a notebook.
 */

import * as std from 'std';
import * as os from 'os';

// ── File system helpers ───────────────────────────────────────────────────────

function readFile(path) {
  return std.loadFile(path) || '';
}

function writeOutputFile(path, content) {
  // Create parent directories
  const parts = path.split('/');
  for (let i = 1; i < parts.length; i++) {
    const dir = parts.slice(0, i).join('/');
    if (dir) os.mkdir(dir, 0o755);
  }
  const f = std.open(path, 'w');
  if (!f) {
    console.log('✗ could not write', path);
    return;
  }
  f.puts(content);
  f.close();
}

function walkJS(dir, files = []) {
  const [entries, err] = os.readdir(dir);
  if (err || !entries) return files;
  for (const entry of entries) {
    if (entry === '.' || entry === '..') continue;
    if (entry.startsWith('.')) continue;
    const fullPath = `${dir}/${entry}`;
    const [stat] = os.stat(fullPath);
    if (!stat) continue;
    if (stat.mode & os.S_IFDIR) {
      walkJS(fullPath, files);
    } else if (entry.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
}

// ── JSDoc parsing ─────────────────────────────────────────────────────────────

/**
 * Strip leading " * " prefixes from a raw JSDoc block interior and return
 * the cleaned text.
 */
function cleanBlock(raw) {
  return raw
    .split('\n')
    .map(l => l.replace(/^\s*\*\s?/, ''))
    .join('\n');
}

/**
 * Extract the text for a single tag from the cleaned block.
 * Handles multi-line tag bodies (indented continuation lines).
 */
function extractTag(cleaned, tag) {
  // Match @tag content up to the next @tag or end of string
  const re = new RegExp(`@${tag}\\s+([\\s\\S]*?)(?=\\n\\s*@|$)`, 'i');
  const m = cleaned.match(re);
  if (!m) return null;
  return m[1]
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .join(' ');
}

/**
 * Like extractTag but preserves paragraph structure (blank lines become \n\n).
 * Used for multi-paragraph @fileoverview content in the body.
 */
function extractTagRaw(cleaned, tag) {
  const re = new RegExp(`@${tag}\\s+([\\s\\S]*?)(?=\\n\\s*@|$)`, 'i');
  const m = cleaned.match(re);
  if (!m) return null;
  // Rebuild: blank lines become paragraph breaks, other lines are trimmed
  return m[1]
    .split(/\n\s*\n/)
    .map(para =>
      para.split('\n').map(l => l.trim()).filter(Boolean).join(' ')
    )
    .filter(Boolean)
    .join('\n\n');
}

/**
 * Extract only the first sentence/paragraph of a tag value (for short descriptions).
 */
function extractTagSummary(cleaned, tag) {
  const full = extractTag(cleaned, tag);
  if (!full) return null;
  // Stop at first period followed by space/end, or first newline
  const m = full.match(/^(.*?[.!?])(?:\s|$)/);
  return m ? m[1] : full.split('\n')[0];
}

function extractAllTags(cleaned, tag) {
  const results = [];
  const re = new RegExp(`@${tag}\\s+([\\s\\S]*?)(?=\\n\\s*@|$)`, 'gi');
  let m;
  while ((m = re.exec(cleaned)) !== null) {
    results.push(
      m[1]
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
        .join(' ')
    );
  }
  return results;
}

/**
 * Parse a @param line: {Type} name - description
 */
function parseParam(raw) {
  const m = raw.match(/^(\{[^}]+\})\s+(\[?[\w.]+\]?)\s*[-–]\s*([\s\S]*)$/);
  if (m) return { type: m[1], name: m[2], desc: m[3].trim() };
  // Fallback: no type
  const m2 = raw.match(/^(\[?[\w.]+\]?)\s*[-–]\s*([\s\S]*)$/);
  if (m2) return { type: '', name: m2[1], desc: m2[2].trim() };
  return { type: '', name: raw.trim(), desc: '' };
}

/**
 * Parse a @returns / @return line: {Type} description
 */
function parseReturns(raw) {
  const m = raw.match(/^(\{[^}]+\})\s*([\s\S]*)$/);
  if (m) return { type: m[1], desc: m[2].trim() };
  return { type: '', desc: raw.trim() };
}

/**
 * Parse a @throws line: {Type} description
 */
function parseThrows(raw) {
  const m = raw.match(/^(\{[^}]+\})\s*([\s\S]*)$/);
  if (m) return { type: m[1], desc: m[2].trim() };
  return { type: '{Error}', desc: raw.trim() };
}

/**
 * Extract the @example content, preserving code formatting.
 */
function extractExample(cleaned) {
  const m = cleaned.match(/@example\s*([\s\S]*?)(?=\n\s*@|$)/i);
  if (!m) return null;
  return m[1]
    .split('\n')
    .map(l => l.replace(/^\s*/, ''))  // strip leading spaces but keep structure
    .join('\n')
    .trim();
}

/**
 * Determine the name of the declaration that immediately follows a JSDoc block.
 * Handles: export function, function, export class, class, export const/let/var,
 * const/let/var (arrow functions), async variants.
 */
function inferName(after) {
  const line = after.trimStart().split('\n')[0];
  // export function / async function / function
  let m = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
  if (m) return { name: m[1], kind: 'function' };
  // export class / class
  m = line.match(/(?:export\s+)?class\s+(\w+)/);
  if (m) return { name: m[1], kind: 'class' };
  // export const/let/var name = (arrow function or value)
  m = line.match(/(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=/);
  if (m) {
    const isArrow = after.includes('=>') && after.indexOf('=>') < after.indexOf('\n\n') + 2;
    return { name: m[1], kind: isArrow ? 'function' : 'constant' };
  }
  return null;
}

/**
 * Parse all JSDoc blocks from a JS source string.
 * Returns an array of block objects.
 */
function parseJSDoc(src) {
  const blocks = [];
  const blockRe = /\/\*\*([\s\S]*?)\*\/([\s\S]*?)(?=\/\*\*|$)/g;
  let m;

  while ((m = blockRe.exec(src)) !== null) {
    const raw = m[1];
    const after = m[2].split(/\/\*\*/)[0]; // only text before next block
    const cleaned = cleanBlock(raw);

    // Skip blocks with no meaningful content
    if (!cleaned.trim()) continue;

    const block = {};

    // File-level description (@fileoverview or @file)
    block.isFileOverview = /@fileoverview|@file\b/i.test(cleaned);

    // Name: from @feature, then from the declaration that follows
    const featureTag = extractTag(cleaned, 'feature');
    const inferred = inferName(after);
    block.name = featureTag || (inferred && inferred.name) || null;
    block.kind = (inferred && inferred.kind) || 'function';

    // Short description for YAML front matter: first sentence only
    const descFromTag = extractTag(cleaned, 'description') || extractTag(cleaned, 'desc');
    const fileoverviewSummary = extractTagSummary(cleaned, 'fileoverview') || extractTagSummary(cleaned, 'file');
    const leadingDesc = cleaned
      .replace(/@[\s\S]*$/, '')  // strip from first tag onward
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)
      .join(' ');
    block.description = descFromTag || fileoverviewSummary || leadingDesc || null;

    // Full description for body rendering (preserves paragraphs)
    const fileoverviewFull = extractTagRaw(cleaned, 'fileoverview') || extractTagRaw(cleaned, 'file');
    block.fullDescription = descFromTag || fileoverviewFull || leadingDesc || null;

    // Params
    const paramLines = extractAllTags(cleaned, 'param');
    block.params = paramLines.map(parseParam);

    // Returns
    const retRaw = extractTag(cleaned, 'returns') || extractTag(cleaned, 'return');
    block.returns = retRaw ? parseReturns(retRaw) : null;

    // Throws
    const throwLines = extractAllTags(cleaned, 'throws');
    block.throws = throwLines.map(parseThrows);

    // Example
    block.example = extractExample(cleaned);

    blocks.push(block);
  }

  return blocks;
}

// ── Markdown rendering ────────────────────────────────────────────────────────

function escapeYaml(str) {
  if (!str) return '';
  // Wrap in double quotes if the string contains special chars
  if (/[:#\[\]{},&*?|<>=!%@`"'\\\n]/.test(str)) {
    return '"' + str.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }
  return str;
}

/**
 * Today's date as YYYY-MM-DD (QuickJS compatible).
 */
function today() {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

function renderBlock(block) {
  const lines = [];

  if (!block.name) return '';

  const heading = block.kind === 'class' ? `## Class: \`${block.name}\`` : `## \`${block.name}\``;
  lines.push(heading);
  lines.push('');

  if (block.description) {
    lines.push(block.description);
    lines.push('');
  }

  if (block.params && block.params.length) {
    lines.push('**Parameters**');
    lines.push('');
    for (const p of block.params) {
      const type = p.type ? ` ${p.type}` : '';
      const desc = p.desc ? ` — ${p.desc}` : '';
      lines.push(`- \`${p.name}\`${type}${desc}`);
    }
    lines.push('');
  }

  if (block.returns && (block.returns.type || block.returns.desc)) {
    const type = block.returns.type ? `${block.returns.type} ` : '';
    lines.push(`**Returns** ${type}${block.returns.desc}`);
    lines.push('');
  }

  if (block.throws && block.throws.length) {
    lines.push('**Throws**');
    lines.push('');
    for (const t of block.throws) {
      lines.push(`- ${t.type} ${t.desc}`);
    }
    lines.push('');
  }

  if (block.example) {
    lines.push('**Example**');
    lines.push('');
    lines.push('```js');
    lines.push(block.example);
    lines.push('```');
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Build the complete markdown document for one JS file.
 */
function buildMarkdown(filePath, inputDir, blocks) {
  // Relative path for display
  const rel = filePath.startsWith(inputDir + '/')
    ? filePath.slice(inputDir.length + 1)
    : filePath;

  // Separate file overview from function blocks
  const overviewBlock = blocks.find(b => b.isFileOverview);
  const funcBlocks = blocks.filter(b => !b.isFileOverview && b.name);

  const title = rel;
  const description = overviewBlock && overviewBlock.description
    ? overviewBlock.description
    : '';
  const functionNames = funcBlocks.map(b => b.name);

  // ── YAML front matter ──
  const fm = ['---'];
  fm.push(`title: ${escapeYaml(title)}`);
  fm.push(`source: ${escapeYaml(filePath)}`);
  fm.push(`type: docs`);
  fm.push(`date: ${today()}`);
  fm.push(`publish: true`);
  if (description) fm.push(`description: ${escapeYaml(description)}`);
  if (functionNames.length) {
    fm.push('functions:');
    for (const name of functionNames) fm.push(`  - ${name}`);
  }
  fm.push('---');
  fm.push('');

  // ── Body ──
  const body = [];
  body.push(`# ${rel}`);
  body.push('');

  const fullDesc = overviewBlock && overviewBlock.fullDescription
    ? overviewBlock.fullDescription
    : description;

  if (fullDesc) {
    body.push(fullDesc);
    body.push('');
  }

  if (funcBlocks.length) {
    for (const block of funcBlocks) {
      const rendered = renderBlock(block);
      if (rendered) {
        body.push(rendered);
      }
    }
  } else if (!description) {
    body.push('*No JSDoc documentation found in this file.*');
    body.push('');
  }

  return fm.join('\n') + body.join('\n');
}

/**
 * Derive the output .md file path for a given input .js file.
 */
function outputPath(jsPath, inputDir, outputDir) {
  const rel = jsPath.startsWith(inputDir + '/')
    ? jsPath.slice(inputDir.length + 1)
    : jsPath;
  const mdRel = rel.replace(/\.js$/, '.md');
  return `${outputDir}/${mdRel}`;
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Walk inputDir for .js files, extract JSDoc from each, and write
 * formatted .md files to outputDir.
 * @param {string} inputDir  - Directory of JavaScript source files to document
 * @param {string} outputDir - Directory where generated .md files are written
 */
export function generateDocs(inputDir, outputDir) {
  console.log('Generate Docs');
  console.log('Input: ', inputDir);
  console.log('Output:', outputDir);
  console.log('');

  const files = walkJS(inputDir);

  if (!files.length) {
    console.log('No .js files found in', inputDir);
    return;
  }

  console.log('Found', files.length, '.js files');
  console.log('');

  let written = 0;
  let skipped = 0;

  for (const file of files) {
    const src = readFile(file);
    const blocks = parseJSDoc(src);

    // Skip files with no JSDoc at all
    const hasContent = blocks.some(b => b.description || b.name);
    if (!hasContent) {
      console.log('-', file, '(no JSDoc)');
      skipped++;
      continue;
    }

    const md = buildMarkdown(file, inputDir, blocks);
    const out = outputPath(file, inputDir, outputDir);
    writeOutputFile(out, md);
    console.log('✓', out);
    written++;
  }

  console.log('');
  console.log(`Done: ${written} files written, ${skipped} skipped (no JSDoc)`);
}
