/**
 * @fileoverview File system operations for discovering and parsing markdown files.
 * Handles recursive directory traversal and filtering publishable content.
 */

import * as os from 'os';
import { parseMatterFromFile } from '../../md-yaml.js';

/**
 * Recursively walks a directory tree and collects all markdown file paths.
 * @param {string} dir - Directory path to walk
 * @param {Array<string>} files - Accumulator array for file paths
 * @returns {Array<string>} Array of markdown file paths
 */
export function walkDirectory(dir, files = []) {
  try {
    const result = os.readdir(dir);
    
    if (!result || result[1] !== 0) {
      return files;
    }
    
    const entriesStr = String(result[0]);
    const entries = entriesStr.split(',');
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry === '.' || entry === '..' || !entry) continue;
      
      const fullPath = dir + '/' + entry;
      const [st, err] = os.stat(fullPath);
      
      if (!err && (st.mode & os.S_IFDIR)) {
        walkDirectory(fullPath, files);
      } else if (fullPath.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // Directory error
  }
  
  return files;
}

/**
 * Recursively searches for a file by name in a directory tree.
 * @param {string} dir - Directory path to search
 * @param {string} filename - Filename to find
 * @returns {string|null} Full path to first matching file, or null if not found
 */
export function findFileRecursive(dir, filename) {
  try {
    const result = os.readdir(dir);
    
    if (!result || result[1] !== 0) {
      return null;
    }
    
    const entriesStr = String(result[0]);
    const entries = entriesStr.split(',');
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      if (entry === '.' || entry === '..' || !entry) continue;
      
      const fullPath = dir + '/' + entry;
      const [st, err] = os.stat(fullPath);
      
      if (!err && (st.mode & os.S_IFDIR)) {
        const found = findFileRecursive(fullPath, filename);
        if (found) return found;
      } else if (entry === filename) {
        return fullPath;
      }
    }
  } catch (e) {
    // Directory error
  }
  
  return null;
}

/**
 * Finds all markdown files with publish: true in their front matter.
 * @param {string} sourceDir - Source directory to search
 * @returns {Array<Object>} Array of file objects with path, data, and content
 */
export function findPublishableFiles(sourceDir) {
  const allFiles = walkDirectory(sourceDir);
  const publishable = [];
  
  for (const filepath of allFiles) {
    try {
      const parsed = parseMatterFromFile(filepath);
      if (parsed.data && parsed.data.publish === true) {
        publishable.push({
          path: filepath,
          data: parsed.data,
          content: parsed.content
        });
      }
    } catch (e) {
      console.log('Error parsing', filepath, ':', e.message);
    }
  }
  
  return publishable;
}
