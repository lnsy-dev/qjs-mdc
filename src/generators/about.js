/**
 * @fileoverview About page generator.
 */

import * as std from 'std';
import { loadTemplate, compileTemplate } from '../templates/engine.js';
import { embedAssets } from '../assets/handler.js';

/**
 * Generates about page from template.
 * @param {Array<Object>} files - Array of file objects (unused)
 * @param {string} outputDir - Output directory path
 * @param {string} templatesDir - Templates directory path
 * @param {Object} globalVars - Global variables from index.json
 * @param {Object} assets - Assets object with css and js arrays
 */
export function generateAboutPage(files, outputDir, templatesDir, globalVars, assets) {
  const template = loadTemplate(templatesDir, 'about.html') || loadTemplate(templatesDir, 'default.html');
  const vars = Object.assign({}, globalVars, {
    title: 'About'
  });
  
  let html = compileTemplate(template, vars, templatesDir);
  html = embedAssets(html, assets);
  
  const f = std.open(`${outputDir}/about.html`, 'w');
  f.puts(html);
  f.close();
  
  console.log('✓ about.html');
}
