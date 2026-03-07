/**
 * @fileoverview About page generator.
 */

import { loadTemplate, compileTemplate } from '../templates/engine.js';
import { embedAssets } from '../assets/handler.js';
import { writeFile } from '../utils/file-ops.js';

/**
 * Generates about page from template.
 * @param {Array<Object>} _files - Unused; present for consistent generator signature
 * @param {string} outputDir - Output directory path
 * @param {string} templatesDir - Templates directory path
 * @param {Object} globalVars - Global variables from index.json
 * @param {Object} assets - Assets object with css and js arrays
 */
export function generateAboutPage(_files, outputDir, templatesDir, globalVars, assets) {
  const template = loadTemplate(templatesDir, 'about.html') || loadTemplate(templatesDir, 'default.html');
  const vars = Object.assign({}, globalVars, {
    title: 'About'
  });

  let html = compileTemplate(template, vars, templatesDir);
  html = embedAssets(html, assets);

  writeFile(`${outputDir}/about.html`, html);
  console.log('✓ about.html');
}
