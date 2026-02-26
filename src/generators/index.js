/**
 * @fileoverview Index page generator with pagination support.
 * Creates paginated listing of all posts sorted by date.
 */

import * as std from 'std';
import { loadTemplate, compileTemplate } from '../templates/engine.js';
import { embedAssets } from '../assets/handler.js';

/**
 * Generates paginated index pages for all posts.
 * @param {Array<Object>} files - Array of file objects with data and outputName
 * @param {string} outputDir - Output directory path
 * @param {string} templatesDir - Templates directory path
 * @param {Object} globalVars - Global variables from index.json
 * @param {Object} assets - Assets object with css and js arrays
 */
export function generateIndex(files, outputDir, templatesDir, globalVars, assets) {
  const postsPerPage = 10;
  const sortedFiles = files.slice().sort((a, b) => {
    const dateA = a.data.date ? new Date(a.data.date) : new Date(0);
    const dateB = b.data.date ? new Date(b.data.date) : new Date(0);
    return dateB - dateA;
  });
  
  const totalPages = Math.ceil(sortedFiles.length / postsPerPage);
  
  for (let page = 1; page <= totalPages; page++) {
    const start = (page - 1) * postsPerPage;
    const end = start + postsPerPage;
    const pagePosts = sortedFiles.slice(start, end);
    
    let postsList = '<ul class="post-list">\n';
    for (const post of pagePosts) {
      postsList += `  <li>
    <h3><a href="${post.outputName}">${post.data.title || 'Untitled'}</a></h3>
    <p>${post.summary}</p>
    <small>${post.data.date || ''}</small>
  </li>\n`;
    }
    postsList += '</ul>\n';
    
    let pagination = '<div class="pagination">\n';
    if (page > 1) {
      const prevPage = page === 2 ? 'index.html' : `index-${page - 1}.html`;
      pagination += `  <a href="${prevPage}">← Previous</a>\n`;
    }
    pagination += `  <span>Page ${page} of ${totalPages}</span>\n`;
    if (page < totalPages) {
      pagination += `  <a href="index-${page + 1}.html">Next →</a>\n`;
    }
    pagination += '</div>\n';
    
    const template = loadTemplate(templatesDir, 'index.html') || loadTemplate(templatesDir, 'default.html');
    const vars = Object.assign({}, globalVars, {
      title: 'Blog Posts',
      content: postsList + pagination
    });
    
    let html = compileTemplate(template, vars, templatesDir);
    html = embedAssets(html, assets);
    
    const filename = page === 1 ? 'index.html' : `index-${page}.html`;
    const f = std.open(`${outputDir}/${filename}`, 'w');
    f.puts(html);
    f.close();
    
    console.log('✓', filename);
  }
}
