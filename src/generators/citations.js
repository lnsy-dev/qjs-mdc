/**
 * @fileoverview Citation page generator for unpublished references.
 * Creates citation pages for files with publish: false in front matter.
 */

import * as std from 'std';
import { parse as parseMarkdown } from '../../lib/markdown.js';
import { parseMatterFromFile } from '../../lib/md-yaml.js';
import { loadTemplate, compileTemplate } from '../templates/engine.js';
import { embedAssets } from '../assets/handler.js';
import { sanitizeFilename } from '../utils/filename.js';
import { walkDirectory } from '../utils/file-ops.js';

/**
 * Generates citation pages for unpublished markdown files.
 * @param {string} sourceDir - Source directory path
 * @param {string} outputDir - Output directory path
 * @param {string} templatesDir - Templates directory path
 * @param {Object} globalVars - Global variables from index.json
 * @param {Object} assets - Assets object with css and js arrays
 */
export function generateCitationPages(sourceDir, outputDir, templatesDir, globalVars, assets) {
  const allFiles = walkDirectory(sourceDir);
  const citationFiles = new Map();
  
  for (const filepath of allFiles) {
    try {
      const parsed = parseMatterFromFile(filepath);
      if (parsed.data && parsed.data.publish === false) {
        const basename = filepath.split('/').pop().replace(/\.md$/, '');
        const sanitized = sanitizeFilename(parsed.data.title || basename);
        citationFiles.set(sanitized, {
          path: filepath,
          data: parsed.data,
          content: parsed.content
        });
      }
    } catch (e) {
      // Skip files that can't be parsed
    }
  }
  
  // Generate citation pages for unpublished files
  for (const [filename, file] of citationFiles) {
    const citationHtml = `<div class="citation">
  <h2>${file.data.title || 'Untitled'}</h2>
  ${file.data.author ? `<p><strong>Author:</strong> ${file.data.author}</p>` : ''}
  ${file.data.year ? `<p><strong>Year:</strong> ${file.data.year}</p>` : ''}
  ${file.data.source ? `<p><strong>Source:</strong> ${file.data.source}</p>` : ''}
  ${file.data.url ? `<p><strong>URL:</strong> <a href="${file.data.url}">${file.data.url}</a></p>` : ''}
  <div class="citation-content">
    ${parseMarkdown(file.content)}
  </div>
</div>`;
    
    const template = loadTemplate(templatesDir, 'citation.html') || loadTemplate(templatesDir, 'default.html');
    const vars = Object.assign({}, globalVars, file.data, {
      title: file.data.title || 'Citation',
      content: citationHtml
    });
    
    let html = compileTemplate(template, vars, templatesDir);
    html = embedAssets(html, assets);
    
    const outputFilename = `${filename}.html`;
    const f = std.open(`${outputDir}/${outputFilename}`, 'w');
    f.puts(html);
    f.close();
    
    console.log('✓', outputFilename, '(citation)');
  }
}
