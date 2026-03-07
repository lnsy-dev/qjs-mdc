/**
 * @fileoverview Tag page generator for organizing posts by tags.
 * Creates individual tag pages and a master tags index with search.
 */

import { loadTemplate, compileTemplate, substituteVariables, DEFAULT_STUB_TEMPLATE } from '../templates/engine.js';
import { embedAssets } from '../assets/handler.js';
import { sanitizeFilename, normalizeTagArray } from '../utils/filename.js';
import { writeFile } from '../utils/file-ops.js';
import { formatPrettyDate } from '../utils/date-format.js';

/**
 * Client-side tag filter script. Injected into the tags index page.
 * Filters the visible list items by matching their text against the search input.
 * @type {string}
 */
const TAG_FILTER_SCRIPT = `
<script>
document.getElementById('tag-search').addEventListener('input', function(e) {
  const search = e.target.value.toLowerCase();
  const items = document.querySelectorAll('#tags-list li');
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(search) ? '' : 'none';
  });
});
</script>
`;

/**
 * Builds a tag-to-files map from an array of file objects.
 * @param {Array<Object>} files - Array of file objects with data.tags
 * @returns {Map<string, Array<Object>>} Map of lowercase tag key to array of files
 */
function buildTagMap(files) {
  const tagMap = new Map();
  for (const file of files) {
    for (const tag of normalizeTagArray(file.data.tags)) {
      const tagKey = tag.toLowerCase();
      if (!tagMap.has(tagKey)) tagMap.set(tagKey, []);
      tagMap.get(tagKey).push(file);
    }
  }
  return tagMap;
}

/**
 * Generates tag pages and tags index with search functionality.
 * @param {Array<Object>} files - Array of file objects with data and outputName
 * @param {string} outputDir - Output directory path
 * @param {string} templatesDir - Templates directory path
 * @param {Object} globalVars - Global variables from index.json
 * @param {Object} assets - Assets object with css and js arrays
 */
export function generateTagPages(files, outputDir, templatesDir, globalVars, assets) {
  const tagMap = buildTagMap(files);
  const stubTemplate = loadTemplate(templatesDir, 'stub.html') || DEFAULT_STUB_TEMPLATE;

  // Generate individual tag pages
  for (const [tag, posts] of tagMap) {
    const sanitized = sanitizeFilename(tag);
    let postsList = `<h2>Posts tagged: ${tag}</h2>\n<ul class="post-list">\n`;

    for (const post of posts) {
      postsList += substituteVariables(stubTemplate, {
        url: post.outputName,
        title: post.data.title || 'Untitled',
        summary: post.summary || '',
        date: formatPrettyDate(post.data.date)
      });
    }
    postsList += '</ul>\n';

    const template = loadTemplate(templatesDir, 'tag.html') || loadTemplate(templatesDir, 'default.html');
    const vars = Object.assign({}, globalVars, {
      title: `Tag: ${tag}`,
      content: postsList
    });

    let html = compileTemplate(template, vars, templatesDir);
    html = embedAssets(html, assets);

    const filename = `tag-${sanitized}.html`;
    writeFile(`${outputDir}/${filename}`, html);
    console.log('✓', filename);
  }

  // Generate tags index page
  let tagsList = '<h2>All Tags</h2>\n<input type="text" id="tag-search" placeholder="Search tags..." />\n<ul id="tags-list" class="tags-list">\n';

  for (const tag of Array.from(tagMap.keys()).sort()) {
    const sanitized = sanitizeFilename(tag);
    const count = tagMap.get(tag).length;
    tagsList += `  <li><a href="tag-${sanitized}.html">${tag}</a> (${count})</li>\n`;
  }
  tagsList += '</ul>\n';
  tagsList += TAG_FILTER_SCRIPT;

  const template = loadTemplate(templatesDir, 'tags.html') || loadTemplate(templatesDir, 'default.html');
  const vars = Object.assign({}, globalVars, {
    title: 'Tags',
    content: tagsList
  });

  let html = compileTemplate(template, vars, templatesDir);
  html = embedAssets(html, assets);

  writeFile(`${outputDir}/tags.html`, html);
  console.log('✓ tags.html');
}
