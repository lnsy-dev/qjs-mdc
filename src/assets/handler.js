/**
 * @fileoverview Asset handling for CSS, JavaScript, and image embedding.
 * Collects assets from source directory and embeds them into HTML output.
 */

import * as std from 'std';
import * as os from 'os';

/**
 * Recursively collects all CSS and JS files from source directory.
 * @param {string} sourceDir - Source directory path
 * @returns {Object} Object with css and js arrays containing file contents
 */
export function collectAssets(sourceDir) {
  const assets = { css: [], js: [] };
  
  function scan(dir) {
    try {
      const result = os.readdir(dir);
      if (!result || result[1] !== 0) return;
      
      const entries = String(result[0]).split(',');
      
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (entry === '.' || entry === '..' || !entry || entry === 'templates') continue;
        
        const fullPath = dir + '/' + entry;
        const [st, err] = os.stat(fullPath);
        
        if (!err && (st.mode & os.S_IFDIR)) {
          scan(fullPath);
        } else if (fullPath.endsWith('.css')) {
          const content = std.loadFile(fullPath);
          if (content) assets.css.push(content);
        } else if (fullPath.endsWith('.js') && !fullPath.includes('compiler.js')) {
          const content = std.loadFile(fullPath);
          if (content) assets.js.push(content);
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }
  
  scan(sourceDir);
  return assets;
}

/**
 * Embeds CSS and JS assets into HTML head section.
 * @param {string} html - HTML content
 * @param {Object} assets - Assets object with css and js arrays
 * @returns {string} HTML with embedded assets
 */
export function embedAssets(html, assets) {
  // Embed CSS
  if (assets.css.length > 0) {
    const cssBlock = '<style>\n' + assets.css.join('\n') + '\n</style>';
    html = html.replace('</head>', cssBlock + '\n</head>');
  }
  
  // Embed JS
  if (assets.js.length > 0) {
    const jsBlock = '<script>\n' + assets.js.join('\n') + '\n</script>';
    html = html.replace('</head>', jsBlock + '\n</head>');
  }
  
  return html;
}

/**
 * Embeds images as inline SVG or base64 data URIs.
 * Handles both local files and external URLs.
 * @param {string} html - HTML content with img tags
 * @param {string} sourceDir - Source directory path for resolving local images
 * @returns {string} HTML with embedded images
 */
export function embedImages(html, sourceDir) {
  return html.replace(/<img\s+([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi, (match, before, src, after) => {
    if (src.startsWith('data:')) return match;
    
    let imageData;
    
    // External URL
    if (src.startsWith('http://') || src.startsWith('https://')) {
      try {
        const result = std.urlGet(src, { binary: true });
        if (result) {
          imageData = result;
        }
      } catch (e) {
        return match;
      }
    } else {
      // Local file
      const imagePath = src.startsWith('/') ? sourceDir + src : sourceDir + '/' + src;
      const content = std.loadFile(imagePath);
      if (!content) return match;
      imageData = content;
    }
    
    if (!imageData) return match;
    
    // Check if SVG
    if (src.endsWith('.svg') || (typeof imageData === 'string' && imageData.trim().startsWith('<svg'))) {
      return imageData;
    }
    
    // Base64 encode for other images
    const base64 = btoa(imageData);
    const ext = src.split('.').pop().toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    const mime = mimeTypes[ext] || 'image/png';
    
    return `<img ${before}src="data:${mime};base64,${base64}"${after}>`;
  });
}
