/**
 * @fileoverview Create new notebook from template with user customization
 */

import * as std from 'std';
import * as os from 'os';
import { NOTEBOOK_TEMPLATE } from '../templates/notebook-template.js';

function promptUser(question) {
  std.out.printf('%s: ', question);
  std.out.flush();
  const line = std.in.getline();
  return line ? line.trim() : '';
}

function runQuestionnaire() {
  console.log('Create New Notebook');
  console.log('==================\n');

  const siteName = promptUser('Site name');
  const siteDescription = promptUser('Site description');
  const siteUrl = promptUser('Site URL (e.g. https://example.com/blog)');
  const author = promptUser('Author name');
  const twitterHandle = promptUser('Twitter/X handle (e.g. @username, optional)');
  const ogImage = promptUser('Default social image URL (optional)');

  return {
    site_name: siteName || 'My Notebook',
    site_description: siteDescription || 'A notebook built with qjs-md',
    site_url: siteUrl || 'https://example.com',
    author: author || 'Anonymous',
    twitter_handle: twitterHandle || '',
    og_image: ogImage || ''
  };
}

function replaceTemplateVars(content, vars) {
  let result = content;
  result = result.replace(/\{\{site_name\}\}/g, vars.site_name);
  result = result.replace(/\{\{site_description\}\}/g, vars.site_description);
  result = result.replace(/\{\{site_url\}\}/g, vars.site_url);
  result = result.replace(/\{\{author\}\}/g, vars.author);
  result = result.replace(/\{\{twitter_handle\}\}/g, vars.twitter_handle);
  result = result.replace(/\{\{og_image\}\}/g, vars.og_image);
  return result;
}

function ensureDir(path) {
  const parts = path.split('/');
  let current = '';
  
  for (const part of parts) {
    if (!part) continue;
    current += (current ? '/' : '') + part;
    
    const [st] = os.stat(current);
    if (!st) {
      os.mkdir(current, 0o755);
    }
  }
}

function createNotebook(targetPath, answers) {
  console.log(`\nCreating notebook at: ${targetPath}`);
  
  // Create target directory
  ensureDir(targetPath);
  
  let fileCount = 0;
  
  // Process each template file
  for (const [relativePath, content] of Object.entries(NOTEBOOK_TEMPLATE)) {
    const fullPath = `${targetPath}/${relativePath}`;
    
    // Ensure parent directory exists
    const dirPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
    if (dirPath) {
      ensureDir(dirPath);
    }
    
    // Replace template variables
    const processedContent = replaceTemplateVars(content, answers);
    
    // Write file
    const f = std.open(fullPath, 'w');
    if (!f) {
      console.error(`Failed to create ${fullPath}`);
      continue;
    }
    f.puts(processedContent);
    f.close();
    
    fileCount++;
  }
  
  console.log(`✓ Created ${fileCount} files`);
  console.log(`\nYour notebook is ready! To build it, run:`);
  console.log(`  ./mdc ${targetPath} --output ${targetPath}/dist`);
}

export function createNewNotebook(targetPath) {
  if (!targetPath) {
    console.error('Error: Target path is required');
    std.exit(1);
  }
  
  // Check if target already exists
  const [st] = os.stat(targetPath);
  if (st) {
    console.error(`Error: Directory ${targetPath} already exists`);
    std.exit(1);
  }
  
  const answers = runQuestionnaire();
  createNotebook(targetPath, answers);
}
