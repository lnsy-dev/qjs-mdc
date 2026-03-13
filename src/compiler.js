/**
 * @fileoverview Markdown Compiler - Main orchestrator for static site generation.
 *
 * Compilation Pipeline:
 * 1. Parse CLI arguments and load configuration
 * 2. Discover publishable markdown files
 * 3. Collect CSS/JS assets from templates directory
 * 4. Process each markdown file:
 *    - Extract summary
 *    - Process abbreviations and wikilinks
 *    - Parse markdown to HTML
 *    - Process SVG charts (convert chart code blocks to inline SVG)
 *    - Highlight code blocks
 *    - Make URLs clickable
 *    - Embed images
 *    - Select and compile template
 *    - Embed assets
 * 5. Generate auxiliary pages:
 *    - Paginated index
 *    - Tag pages and tags index
 *    - Search page with data
 *    - Citation pages for unpublished references
 */

import * as os from 'os';
import { parse as parseMarkdown } from '../lib/markdown.js';
import { parseArgs } from './utils/cli.js';
import { findPublishableFiles, writeFile, getNewestMtime } from './utils/file-ops.js';
import { resolveFilenameConflicts, sanitizeFilename, normalizeTagArray } from './utils/filename.js';
import { loadIndexConfig, selectTemplate, compileTemplate } from './templates/engine.js';
import { processAbbreviations, processWikilinks, processFootnotes, extractSummary, highlightCode, makeUrlsClickable } from './content/processor.js';
import { collectAssets, embedAssets, embedImages } from './assets/handler.js';
import { generateIndex } from './generators/index.js';
import { generateTagPages } from './generators/tags.js';
import { generateSearchPage } from './generators/search.js';
import { generateRSSFeed } from './generators/rss.js';
import { generateAboutPage } from './generators/about.js';
import { processSVGCharts } from './plugins/svg-charts.js';
import { processTables } from '../plugins/tables.js';
import { extractCSSColors } from './utils/css-parser.js';
import { createNewNotebook } from './commands/create-notebook.js';
import { compileFile } from './commands/compile-file.js';
import { toJson } from './commands/to-json.js';
import { formatPrettyDate } from './utils/date-format.js';

/**
 * Main compilation function that orchestrates the entire build process.
 * @param {Object} config - Configuration object from parseArgs
 */
function compile(config) {
  console.log('Markdown Compiler');
  console.log('Source:', config.source);
  console.log('Output:', config.output);
  if (config.target) console.log('Target:', config.target);
  if (config.force) console.log('Force: rebuilding all files');
  console.log('');

  os.mkdir(config.output, 0o755);

  // Use output templates dir if it exists, otherwise fall back to source templates
  const outputTemplatesDir = `${config.output}/templates`;
  const [outputTemplatesStat] = os.stat(outputTemplatesDir);
  const assetsSource = (outputTemplatesStat && (outputTemplatesStat.mode & os.S_IFDIR)) ? config.output : config.source;
  const templatesDir = `${assetsSource}/templates`;

  const globalVars = loadIndexConfig(assetsSource);

  if (assetsSource !== config.source) {
    console.log('Templates: using output templates dir');
  }

  const assets = collectAssets(assetsSource);
  const cssColors = extractCSSColors(assets.css);
  const templatesMtime = getNewestMtime(templatesDir);

  let files = findPublishableFiles(config.source, config.target || null);
  console.log('Found', files.length, 'publishable files');

  resolveFilenameConflicts(files);

  for (const file of files) {
    // Always extract summary so generators have it even for unchanged files
    file.summary = extractSummary(file);

    try {
      const outputPath = `${config.output}/${file.outputName}`;

      // Skip if output is newer than source and templates (unless --force)
      if (!config.force) {
        const [srcStat] = os.stat(file.path);
        const [outStat] = os.stat(outputPath);
        if (srcStat && outStat && outStat.mtime >= srcStat.mtime && outStat.mtime >= templatesMtime) {
          console.log('-', file.outputName, '(unchanged)');
          continue;
        }
      }

      const { content: footnoteContent, footnotesHtml } = processFootnotes(file.content);
      let contentProcessed = processAbbreviations(footnoteContent);
      contentProcessed = processWikilinks(contentProcessed);

      const contentHtml = parseMarkdown(contentProcessed) + footnotesHtml;
      const tablesHtml = processTables(contentHtml);
      const chartsHtml = processSVGCharts(tablesHtml, config.source, cssColors);
      const highlightedHtml = highlightCode(chartsHtml);
      const linkedHtml = makeUrlsClickable(highlightedHtml);
      const embeddedHtml = embedImages(linkedHtml, config.source);

      const template = selectTemplate(file, templatesDir);

      // Build tags HTML and plain list from normalized tag array
      const tags = normalizeTagArray(file.data.tags);
      const tagsHtml = tags.map(tag => {
        const sanitized = sanitizeFilename(tag);
        return `<a href="tag-${sanitized}.html" class="tag">${tag}</a>`;
      }).join(' ');
      const tagList = tags.join(', ');

      const vars = Object.assign({}, globalVars, file.data, {
        content: embeddedHtml,
        summary: file.summary,
        summary_text: file.summary.replace(/<[^>]+>/g, ''),
        date: formatPrettyDate(file.data.date),
        page_slug: file.outputName,
        tags: tagsHtml,
        tag_list: tagList
      });

      let finalHtml = compileTemplate(template, vars, templatesDir);
      finalHtml = embedAssets(finalHtml, assets);

      writeFile(outputPath, finalHtml);
      console.log('✓', file.outputName);
    } catch (e) {
      console.log('✗', file.path, ':', e.message);
    }
  }

  console.log('');
  console.log('Compilation complete!');

  generateIndex(files, config.output, templatesDir, globalVars, assets);
  generateTagPages(files, config.output, templatesDir, globalVars, assets);
  generateSearchPage(files, config.output, templatesDir, globalVars, assets);
  generateAboutPage(files, config.output, templatesDir, globalVars, assets);
  generateRSSFeed(files, config.output, templatesDir, globalVars, assets);
}

/**
 * Watches a source directory for file changes and recompiles on each change.
 * Runs until the process is killed.
 * @param {Object} config - Configuration object from parseArgs
 */
function watch(config) {
  const mtimes = {};

  function getModTime(path) {
    const [stat, err] = os.stat(path);
    return err ? 0 : stat.mtime;
  }

  function scanDir(dir, files = []) {
    const [entries] = os.readdir(dir);
    if (!entries) return files;

    for (const entry of entries) {
      if (entry === '.' || entry === '..') continue;
      const path = `${dir}/${entry}`;
      const [stat] = os.stat(path);
      if (!stat) continue;

      if (stat.mode & os.S_IFDIR) {
        scanDir(path, files);
      } else {
        files.push(path);
      }
    }
    return files;
  }

  console.log('Watching', config.source, 'for changes...');
  console.log('Press Ctrl+C to stop');
  console.log('');

  compile(config);

  const files = scanDir(config.source);
  for (const file of files) {
    mtimes[file] = getModTime(file);
  }

  while (true) {
    os.sleep(1000);

    const currentFiles = scanDir(config.source);
    let changed = false;
    const changedFiles = [];

    for (const file of currentFiles) {
      const mtime = getModTime(file);
      if (!mtimes[file] || mtimes[file] !== mtime) {
        changed = true;
        changedFiles.push(file);
        mtimes[file] = mtime;
      }
    }

    if (changed) {
      console.log('\n--- Changes detected in:', changedFiles.join(', '), '---\n');
      try {
        compile(config);
      } catch (e) {
        console.log('Error during compilation:', e.message);
      }
    }
  }
}

/**
 * Entry point. Parses CLI arguments and dispatches to the appropriate command.
 */
function main() {
  const config = parseArgs(scriptArgs);

  if (config.command === 'compile-file') {
    compileFile(config.inputFile, config.output);
    return;
  }

  if (config.command === 'to-json') {
    toJson(config.inputFile, config.output);
    return;
  }

  if (config.command === 'create-notebook') {
    createNewNotebook(config.targetPath);
    return;
  }

  if (config.watch) {
    watch(config);
    return;
  }

  compile(config);
}

main();
