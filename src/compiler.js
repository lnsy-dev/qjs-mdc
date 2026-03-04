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

import * as std from 'std';
import * as os from 'os';
import { parse as parseMarkdown } from '../lib/markdown.js';
import { parseArgs } from './utils/cli.js';
import { findPublishableFiles } from './utils/file-ops.js';
import { resolveFilenameConflicts } from './utils/filename.js';
import { loadIndexConfig, selectTemplate, compileTemplate } from './templates/engine.js';
import { processAbbreviations, processWikilinks, extractSummary, highlightCode, makeUrlsClickable } from './content/processor.js';
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
import { formatPrettyDate } from './utils/date-format.js';

/**
 * Main compilation function that orchestrates the entire build process.
 */
function compile(config) {
  console.log('Markdown Compiler');
  console.log('Source:', config.source);
  console.log('Output:', config.output);
  console.log('');
  
  // Create output directory
  os.mkdir(config.output, 0o755);
  
  // Load global config
  const globalVars = loadIndexConfig(config.source);
  const templatesDir = `${config.source}/templates`;
  
  // Collect CSS and JS assets
  const assets = collectAssets(config.source);
  
  // Extract CSS colors for SVG rendering
  const cssColors = extractCSSColors(assets.css);
  
  // Find and process files
  let files = findPublishableFiles(config.source);
  console.log('Found', files.length, 'publishable files');
  
  // Resolve filename conflicts
  files = resolveFilenameConflicts(files);
  
  // Compile each file
  for (const file of files) {
    // Always extract summary so generators have it even for unchanged files
    file.summary = extractSummary(file);

    try {
      const outputPath = `${config.output}/${file.outputName}`;

      // Skip if output is newer than source
      const [srcStat] = os.stat(file.path);
      const [outStat] = os.stat(outputPath);
      if (srcStat && outStat && outStat.mtime >= srcStat.mtime) {
        console.log('-', file.outputName, '(unchanged)');
        continue;
      }
      
      // Process abbreviations and wikilinks BEFORE markdown parsing
      let contentProcessed = processAbbreviations(file.content);
      contentProcessed = processWikilinks(contentProcessed);
      
      // Parse markdown to HTML
      const contentHtml = parseMarkdown(contentProcessed);

      // Process markdown tables into <table> elements
      const tablesHtml = processTables(contentHtml);

      // Process SVG charts
      const chartsHtml = processSVGCharts(tablesHtml, config.source, cssColors);
      
      // Highlight code
      const highlightedHtml = highlightCode(chartsHtml);
      
      // Make URLs clickable
      const linkedHtml = makeUrlsClickable(highlightedHtml);
      
      // Embed images
      const embeddedHtml = embedImages(linkedHtml, config.source);
      
      // Select template
      const template = selectTemplate(file, templatesDir);
      
      // Prepare variables
      const vars = Object.assign({}, globalVars, file.data, {
        content: embeddedHtml,
        summary: file.summary,
        date: formatPrettyDate(file.data.date),
        page_slug: file.outputName
      });
      
      // Compile template
      let finalHtml = compileTemplate(template, vars, templatesDir);
      
      // Embed CSS and JS assets
      finalHtml = embedAssets(finalHtml, assets);
      
      // Write output
      const f = std.open(outputPath, 'w');
      f.puts(finalHtml);
      f.close();
      
      console.log('✓', file.outputName);
    } catch (e) {
      console.log('✗', file.path, ':', e.message);
    }
  }
  
  console.log('');
  console.log('Compilation complete!');
  
  // Generate paginated index
  generateIndex(files, config.output, templatesDir, globalVars, assets);
  
  // Generate tag pages
  generateTagPages(files, config.output, templatesDir, globalVars, assets);
  
  // Generate search page
  generateSearchPage(files, config.output, templatesDir, globalVars, assets);
  
  // Generate about page
  generateAboutPage(files, config.output, templatesDir, globalVars, assets);
  
  // Generate RSS feed
  generateRSSFeed(files, config.output, templatesDir, globalVars, assets);
}

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
  
  // Initial compile
  compile(config);
  
  // Initialize mtimes
  const files = scanDir(config.source);
  for (const file of files) {
    mtimes[file] = getModTime(file);
  }
  
  // Watch loop
  while (true) {
    os.sleep(1000);
    
    const currentFiles = scanDir(config.source);
    let changed = false;
    let changedFiles = [];
    
    for (const file of currentFiles) {
      const mtime = getModTime(file);
      if (!mtimes[file]) {
        changed = true;
        changedFiles.push(file);
        mtimes[file] = mtime;
      } else if (mtimes[file] !== mtime) {
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

function main() {
  const config = parseArgs(scriptArgs);
  
  // Handle create-new-notebook command
  if (config.command === 'create-notebook') {
    createNewNotebook(config.targetPath);
    return;
  }
  
  // Handle watch mode
  if (config.watch) {
    watch(config);
    return;
  }
  
  // Default: single compilation
  compile(config);
}

main();
