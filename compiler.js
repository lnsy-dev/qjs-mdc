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
import { parse as parseMarkdown } from './lib/markdown.js';
import { parseArgs } from './src/utils/cli.js';
import { findPublishableFiles } from './src/utils/file-ops.js';
import { resolveFilenameConflicts } from './src/utils/filename.js';
import { loadIndexConfig, selectTemplate, compileTemplate } from './src/templates/engine.js';
import { processAbbreviations, processWikilinks, extractSummary, highlightCode, makeUrlsClickable } from './src/content/processor.js';
import { collectAssets, embedAssets, embedImages } from './src/assets/handler.js';
import { generateIndex } from './src/generators/index.js';
import { generateTagPages } from './src/generators/tags.js';
import { generateSearchPage } from './src/generators/search.js';
import { generateRSSFeed } from './src/generators/rss.js';
import { processSVGCharts } from './src/plugins/svg-charts.js';
import { extractCSSColors } from './src/utils/css-parser.js';
import { createNewNotebook } from './src/commands/create-notebook.js';
import { formatPrettyDate } from './src/utils/date-format.js';

/**
 * Main compilation function that orchestrates the entire build process.
 */
function main() {
  const config = parseArgs(scriptArgs);
  
  // Handle create-new-notebook command
  if (config.command === 'create-notebook') {
    createNewNotebook(config.targetPath);
    return;
  }
  
  // Default: compile command
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
    try {
      // Extract summary
      file.summary = extractSummary(file);
      
      // Process abbreviations and wikilinks BEFORE markdown parsing
      let contentProcessed = processAbbreviations(file.content);
      contentProcessed = processWikilinks(contentProcessed);
      
      // Parse markdown to HTML
      const contentHtml = parseMarkdown(contentProcessed);
      
      // Process SVG charts
      const chartsHtml = processSVGCharts(contentHtml, config.source, cssColors);
      
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
        date: formatPrettyDate(file.data.date)
      });
      
      // Compile template
      let finalHtml = compileTemplate(template, vars, templatesDir);
      
      // Embed CSS and JS assets
      finalHtml = embedAssets(finalHtml, assets);
      
      // Write output
      const outputPath = `${config.output}/${file.outputName}`;
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
  
  // Generate RSS feed
  generateRSSFeed(files, config.output, templatesDir, globalVars, assets);
}

main();
