/**
 * @fileoverview Tag page generator for organizing posts by tags.
 * Creates individual tag pages and a master tags index with search.
 */

import * as std from 'std';
import { loadTemplate, compileTemplate, substituteVariables } from '../templates/engine.js';
import { embedAssets } from '../assets/handler.js';
import { sanitizeFilename } from '../utils/filename.js';
import { formatPrettyDate } from '../utils/date-format.js';

/**
 * Generates tag pages and tags index with search functionality.
 * @param {Array<Object>} files - Array of file objects with data and outputName
 * @param {string} outputDir - Output directory path
 * @param {string} templatesDir - Templates directory path
 * @param {Object} globalVars - Global variables from index.json
 * @param {Object} assets - Assets object with css and js arrays
 */
export function generateTagPages(files, outputDir, templatesDir, globalVars, assets) {
  const tagMap = new Map();
  
  // Collect all tags
  for (const file of files) {
    const tags = file.data.tags || [];
    const tagArray = Array.isArray(tags) ? tags : [tags];
    
    for (const tag of tagArray) {
      if (!tag) continue;
      const tagKey = String(tag).toLowerCase();
      if (!tagMap.has(tagKey)) {
        tagMap.set(tagKey, []);
      }
      tagMap.get(tagKey).push(file);
    }
  }
  
  // Generate individual tag pages
  const stubTemplate = loadTemplate(templatesDir, 'stub.html') ||
    '<li class="post-stub"><h3><a href="{{url}}">{{title}}</a></h3><p class="post-summary">{{summary}}</p><small class="post-date">{{date}}</small></li>\n';
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
    const f = std.open(`${outputDir}/${filename}`, 'w');
    f.puts(html);
    f.close();
    
    console.log('✓', filename);
  }
  
  // Generate tags index page
  let tagsList = '<h2>All Tags</h2>\n<input type="text" id="tag-search" placeholder="Search tags..." />\n<ul id="tags-list" class="tags-list">\n';
  
  const sortedTags = Array.from(tagMap.keys()).sort();
  for (const tag of sortedTags) {
    const sanitized = sanitizeFilename(tag);
    const count = tagMap.get(tag).length;
    tagsList += `  <li><a href="tag-${sanitized}.html">${tag}</a> (${count})</li>\n`;
  }
  tagsList += '</ul>\n';
  
  tagsList += `<script>
document.getElementById('tag-search').addEventListener('input', function(e) {
  const search = e.target.value.toLowerCase();
  const items = document.querySelectorAll('#tags-list li');
  items.forEach(item => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(search) ? '' : 'none';
  });
});
</script>\n`;
  
  const template = loadTemplate(templatesDir, 'tags.html') || loadTemplate(templatesDir, 'default.html');
  const vars = Object.assign({}, globalVars, {
    title: 'Tags',
    content: tagsList
  });
  
  let html = compileTemplate(template, vars, templatesDir);
  html = embedAssets(html, assets);
  
  const f = std.open(`${outputDir}/tags.html`, 'w');
  f.puts(html);
  f.close();
  
  console.log('✓ tags.html');
}
