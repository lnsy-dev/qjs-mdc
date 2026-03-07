/**
 * @fileoverview Search page generator with fuzzy search functionality.
 * Creates search interface and search data JSON for client-side searching.
 */

import * as std from 'std';
import { loadTemplate, compileTemplate } from '../templates/engine.js';
import { embedAssets } from '../assets/handler.js';
import { writeFile } from '../utils/file-ops.js';

/**
 * Client-side search UI script. Injected into the search page as inline JS.
 * Depends on FuzzySearch being defined (loaded from fuzzy-search.js) and
 * a `search-data.json` file being present at the output root.
 * @type {string}
 */
const SEARCH_SCRIPT = `
let searchData = [];
let fuse;

fetch('search-data.json')
  .then(r => r.json())
  .then(data => {
    searchData = data;
    fuse = new FuzzySearch(data, { keys: ['title', 'summary'] });
  });

document.getElementById('search-input').addEventListener('input', function(e) {
  const query = e.target.value;
  const results = fuse ? fuse.search(query) : [];
  const resultsDiv = document.getElementById('search-results');

  if (!query) {
    resultsDiv.innerHTML = '';
    return;
  }

  if (results.length === 0) {
    resultsDiv.innerHTML = '<p>No results found.</p>';
    return;
  }

  let html = '<ul class="search-results">';
  for (const result of results.slice(0, 10)) {
    const post = result.item;
    html += '<li><h3><a href="' + post.url + '">' + post.title + '</a></h3>' +
            (post.summary ? '<p>' + post.summary + '</p>' : '') + '</li>';
  }
  html += '</ul>';
  resultsDiv.innerHTML = html;
});
`;

/**
 * Generates search page with fuzzy search functionality and search data JSON.
 * @param {Array<Object>} files - Array of file objects with data, outputName, and summary
 * @param {string} outputDir - Output directory path
 * @param {string} templatesDir - Templates directory path
 * @param {Object} globalVars - Global variables from index.json
 * @param {Object} assets - Assets object with css and js arrays
 */
export function generateSearchPage(files, outputDir, templatesDir, globalVars, assets) {
  const searchData = files.map(file => ({
    title: file.data.title || 'Untitled',
    summary: file.summary || '',
    url: file.outputName,
    tags: file.data.tags || []
  }));

  writeFile(`${outputDir}/search-data.json`, JSON.stringify(searchData));

  const fuzzySearchLib = std.loadFile('./lib/fuzzy-search.js');

  const searchHtml = `<h2>Search</h2>
<input type="text" id="search-input" placeholder="Search posts..." style="width: 100%; padding: 10px; font-size: 16px;" />
<div id="search-results" style="margin-top: 20px;"></div>

<script>
${fuzzySearchLib}
${SEARCH_SCRIPT}
</script>`;

  const template = loadTemplate(templatesDir, 'search.html') || loadTemplate(templatesDir, 'default.html');
  const vars = Object.assign({}, globalVars, {
    title: 'Search',
    content: searchHtml
  });

  let html = compileTemplate(template, vars, templatesDir);
  html = embedAssets(html, assets);

  writeFile(`${outputDir}/search.html`, html);
  console.log('✓ search.html');
  console.log('✓ search-data.json');
}
