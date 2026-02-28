/**
 * @fileoverview RSS feed generator for blog posts.
 * Creates RSS 2.0 XML feed with most recent posts.
 */

import * as std from 'std';

/**
 * Escapes XML special characters.
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Formats date to RFC 822 format for RSS.
 * @param {string} dateStr - Date string from front matter
 * @returns {string} RFC 822 formatted date
 */
function formatRFC822(dateStr) {
  if (!dateStr) return new Date().toUTCString();
  const date = new Date(dateStr);
  return date.toUTCString();
}

/**
 * Generates RSS feed for blog posts.
 * @param {Array<Object>} files - Array of file objects with data, outputName, and summary
 * @param {string} outputDir - Output directory path
 * @param {string} templatesDir - Templates directory path (unused)
 * @param {Object} globalVars - Global variables from index.json
 * @param {Object} assets - Assets object (unused)
 */
export function generateRSSFeed(files, outputDir, templatesDir, globalVars, assets) {
  // Sort by date descending and limit to 20
  const sortedFiles = files.slice().sort((a, b) => {
    const dateA = a.data.date ? new Date(a.data.date) : new Date(0);
    const dateB = b.data.date ? new Date(b.data.date) : new Date(0);
    return dateB - dateA;
  }).slice(0, 20);
  
  // Build RSS XML
  let rss = '<?xml version="1.0" encoding="UTF-8"?>\n';
  rss += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
  rss += '  <channel>\n';
  
  // Channel metadata
  const siteTitle = globalVars.site_name || globalVars.siteName || 'Blog';
  const siteUrl = globalVars.site_url || globalVars.siteUrl || '';
  const siteDesc = globalVars.site_description || globalVars.siteDescription || globalVars.description || '';
  
  rss += `    <title>${escapeXml(siteTitle)}</title>\n`;
  rss += `    <link>${escapeXml(siteUrl)}</link>\n`;
  rss += `    <description>${escapeXml(siteDesc)}</description>\n`;
  rss += `    <atom:link href="${escapeXml(siteUrl)}/rss.xml" rel="self" type="application/rss+xml" />\n`;
  rss += `    <lastBuildDate>${formatRFC822(new Date().toISOString())}</lastBuildDate>\n`;
  
  // Generate items
  for (const file of sortedFiles) {
    rss += '    <item>\n';
    rss += `      <title>${escapeXml(file.data.title || 'Untitled')}</title>\n`;
    rss += `      <link>${escapeXml(siteUrl)}/${escapeXml(file.outputName)}</link>\n`;
    rss += `      <guid>${escapeXml(siteUrl)}/${escapeXml(file.outputName)}</guid>\n`;
    rss += `      <description>${escapeXml(file.summary || '')}</description>\n`;
    rss += `      <pubDate>${formatRFC822(file.data.date)}</pubDate>\n`;
    
    if (file.data.author) {
      rss += `      <author>${escapeXml(file.data.author)}</author>\n`;
    }
    
    // Add categories (tags)
    const tags = file.data.tags || [];
    const tagArray = Array.isArray(tags) ? tags : [tags];
    for (const tag of tagArray) {
      if (tag) {
        rss += `      <category>${escapeXml(String(tag))}</category>\n`;
      }
    }
    
    rss += '    </item>\n';
  }
  
  rss += '  </channel>\n';
  rss += '</rss>\n';
  
  // Write RSS file
  const f = std.open(`${outputDir}/rss.xml`, 'w');
  f.puts(rss);
  f.close();
  
  console.log('✓ rss.xml');
}
