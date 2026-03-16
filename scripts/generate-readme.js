/**
 * generate-readme.js — QuickJS script
 *
 * Reads src/library.js, extracts JSDoc @feature comment blocks,
 * and generates dist/README.md documenting all library features.
 *
 * Usage: qjs scripts/generate-readme.js   (run from project root)
 */

import * as std from 'std';
import * as os from 'os';

const LIB_SRC   = 'src/library.js';
const DIST_DIR  = 'dist';
const OUT_README = 'dist/README.md';

// ── Parse JSDoc blocks from source ───────────────────────────────────────────

function parseFeatures(src) {
  const features = [];
  const blockRe = /\/\*\*([\s\S]*?)\*\//g;
  let match;

  while ((match = blockRe.exec(src)) !== null) {
    const raw = match[1];

    if (!raw.includes('@feature')) continue;

    const feature = {};

    // @feature name
    const featureMatch = raw.match(/@feature\s+(\S+)/);
    if (featureMatch) feature.name = featureMatch[1];

    // @description (may span multiple continuation lines)
    const descMatch = raw.match(/@description\s+([\s\S]*?)(?=\s*@|\s*\*\/)/);
    if (descMatch) {
      feature.description = descMatch[1]
        .split('\n')
        .map(l => l.replace(/^\s*\*\s?/, '').trim())
        .filter(Boolean)
        .join(' ');
    }

    // @param lines
    const params = [];
    const paramRe = /@param\s+(\{[^}]+\})\s+(\S+)\s+-\s+(.+)/g;
    let pm;
    while ((pm = paramRe.exec(raw)) !== null) {
      params.push({ type: pm[1], name: pm[2], desc: pm[3].trim() });
    }
    if (params.length) feature.params = params;

    // @returns
    const retMatch = raw.match(/@returns\s+(\{[^}]+\})\s+(.*)/);
    if (retMatch) feature.returns = { type: retMatch[1], desc: retMatch[2].trim() };

    // @example (everything after the tag until end of block)
    const exMatch = raw.match(/@example\s*([\s\S]*?)(?=\s*@|\s*\*\/$|\s*$)/);
    if (exMatch) {
      feature.example = exMatch[1]
        .split('\n')
        .map(l => l.replace(/^\s*\*\s?/, ''))
        .join('\n')
        .trim();
    }

    if (feature.name) features.push(feature);
  }

  return features;
}

// ── Build README ──────────────────────────────────────────────────────────────

function buildReadme(features) {
  const sections = {
    'Markdown Parsing': [],
    'Content Processors': [],
    'Table Processing': [],
    'SVG Charts': [],
    'Template Engine': [],
    'Asset Handling': [],
    'File Operations': [],
    'Filename Utilities': [],
    'Date Formatting': [],
    'CSS Utilities': [],
    'Page Generators': [],
    'Commands': [],
    'CLI Utilities': [],
    'Convenience Pipeline': [],
  };

  const categoryMap = {
    parseMarkdown: 'Markdown Parsing',
    parseFrontMatter: 'Markdown Parsing',
    parseToAST: 'Markdown Parsing',
    processWikilinks: 'Content Processors',
    makeUrlsClickable: 'Content Processors',
    processAbbreviations: 'Content Processors',
    processFootnotes: 'Content Processors',
    highlightCode: 'Content Processors',
    extractSummary: 'Content Processors',
    processTables: 'Table Processing',
    processSVGCharts: 'SVG Charts',
    loadIndexConfig: 'Template Engine',
    selectTemplate: 'Template Engine',
    compileTemplate: 'Template Engine',
    collectAssets: 'Asset Handling',
    embedAssets: 'Asset Handling',
    embedImages: 'Asset Handling',
    findPublishableFiles: 'File Operations',
    writeFile: 'File Operations',
    sanitizeFilename: 'Filename Utilities',
    normalizeTagArray: 'Filename Utilities',
    resolveFilenameConflicts: 'Filename Utilities',
    formatPrettyDate: 'Date Formatting',
    extractCSSColors: 'CSS Utilities',
    generateIndex: 'Page Generators',
    generateTagPages: 'Page Generators',
    generateSearchPage: 'Page Generators',
    generateRSSFeed: 'Page Generators',
    generateAboutPage: 'Page Generators',
    compileFile: 'Commands',
    toJson: 'Commands',
    createNewNotebook: 'Commands',
    parseArgs: 'CLI Utilities',
    compileMarkdown: 'Convenience Pipeline',
  };

  for (const f of features) {
    const cat = categoryMap[f.name] || 'Other';
    if (!sections[cat]) sections[cat] = [];
    sections[cat].push(f);
  }

  const toc = [];
  const body = [];

  for (const cat of Object.keys(sections)) {
    const feats = sections[cat];
    if (!feats.length) continue;

    const anchor = cat.toLowerCase().replace(/\s+/g, '-');
    toc.push(`- [${cat}](#${anchor})`);
    body.push(`## ${cat}\n`);

    for (const f of feats) {
      body.push(`### \`${f.name}\`\n`);

      if (f.description) body.push(`${f.description}\n`);

      if (f.params && f.params.length) {
        body.push('\n**Parameters**\n');
        for (const p of f.params) {
          body.push(`- \`${p.name}\` ${p.type} — ${p.desc}`);
        }
        body.push('');
      }

      if (f.returns) {
        body.push(`\n**Returns** ${f.returns.type} — ${f.returns.desc}\n`);
      }

      if (f.example) {
        body.push('\n**Example**\n');
        body.push('```js');
        body.push(f.example);
        body.push('```\n');
      }
    }
  }

  return `# qjs-md — JavaScript Library

> A fast, dependency-free markdown processing library for [QuickJS](https://bellard.org/quickjs/) projects.
> Bundle the source once with \`make library\` and import individual features or the full pipeline.

## Installation

Copy \`dist/qjs-md.js\` into your QuickJS project, then import what you need:

\`\`\`js
import { parseMarkdown, compileMarkdown } from './qjs-md.js';
\`\`\`

The bundle keeps QuickJS built-in modules (\`os\`, \`std\`) as external imports —
they are provided automatically by the QuickJS runtime.

## Table of Contents

${toc.join('\n')}

---

${body.join('\n')}
---

*Generated automatically from [src/library.js](../src/library.js) by \`make library\`.*
`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const src = std.loadFile(LIB_SRC);
if (!src) {
  print(`ERROR: could not read ${LIB_SRC}`);
  std.exit(1);
}

const features = parseFeatures(src);

// Ensure dist/ exists
os.mkdir(DIST_DIR, 0o755);

const readme = buildReadme(features);

const f = std.open(OUT_README, 'w');
if (!f) {
  print(`ERROR: could not write ${OUT_README}`);
  std.exit(1);
}
f.puts(readme);
f.close();

print(`README generated: ${OUT_README}`);
print(`  Features documented: ${features.length}`);
