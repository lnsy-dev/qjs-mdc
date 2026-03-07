/**
 * @fileoverview Index page generator with pagination support.
 * Creates paginated listing of all posts sorted by date.
 */

import { loadTemplate, compileTemplate, substituteVariables, DEFAULT_STUB_TEMPLATE } from '../templates/engine.js';
import { embedAssets } from '../assets/handler.js';
import { writeFile } from '../utils/file-ops.js';
import { formatPrettyDate } from '../utils/date-format.js';

const POSTS_PER_PAGE = 10;

/**
 * Generates paginated index pages for all posts.
 * @param {Array<Object>} files - Array of file objects with data and outputName
 * @param {string} outputDir - Output directory path
 * @param {string} templatesDir - Templates directory path
 * @param {Object} globalVars - Global variables from index.json
 * @param {Object} assets - Assets object with css and js arrays
 */
export function generateIndex(files, outputDir, templatesDir, globalVars, assets) {
  const sortedFiles = files.slice().sort((a, b) => {
    const dateA = a.data.date ? new Date(a.data.date) : new Date(0);
    const dateB = b.data.date ? new Date(b.data.date) : new Date(0);
    return dateB - dateA;
  });

  const totalPages = Math.ceil(sortedFiles.length / POSTS_PER_PAGE);
  const stubTemplate = loadTemplate(templatesDir, 'stub.html') || DEFAULT_STUB_TEMPLATE;
  const pageTemplate = loadTemplate(templatesDir, 'index.html') || loadTemplate(templatesDir, 'default.html');

  for (let page = 1; page <= totalPages; page++) {
    const start = (page - 1) * POSTS_PER_PAGE;
    const pagePosts = sortedFiles.slice(start, start + POSTS_PER_PAGE);

    let postsList = '<ul class="post-list">\n';
    for (const post of pagePosts) {
      postsList += substituteVariables(stubTemplate, {
        url: post.outputName,
        title: post.data.title || 'Untitled',
        summary: post.summary || '',
        date: formatPrettyDate(post.data.date)
      });
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

    const vars = Object.assign({}, globalVars, {
      title: globalVars.index_title || 'Blog Posts',
      content: postsList + pagination
    });

    let html = compileTemplate(pageTemplate, vars, templatesDir);
    html = embedAssets(html, assets);

    const filename = page === 1 ? 'index.html' : `index-${page}.html`;
    writeFile(`${outputDir}/${filename}`, html);
    console.log('✓', filename);
  }
}
