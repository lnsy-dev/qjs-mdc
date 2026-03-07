/**
 * @fileoverview File system operations for discovering and parsing markdown files.
 * Handles recursive directory traversal and filtering publishable content.
 */

import * as std from 'std';
import { parseMatterFromFile } from '../../lib/md-yaml.js';

function runCommand(cmd) {
  const pipe = std.popen(cmd, 'r');
  if (!pipe) return '';
  const output = pipe.readAsString();
  pipe.close();
  return output;
}

/**
 * Recursively walks a directory tree and collects all markdown file paths.
 * Uses `find` to skip dot-folders and return only .md files.
 * @param {string} dir - Directory path to walk
 * @returns {Array<string>} Array of markdown file paths
 */
export function walkDirectory(dir) {
  const output = runCommand(`find '${dir}' -not -path '*/.*' -name '*.md'`);
  return output.trim().split('\n').filter(f => f.length > 0);
}

/**
 * Recursively searches for a file by name in a directory tree.
 * @param {string} dir - Directory path to search
 * @param {string} filename - Filename to find
 * @returns {string|null} Full path to first matching file, or null if not found
 */
export function findFileRecursive(dir, filename) {
  const output = runCommand(`find '${dir}' -not -path '*/.*' -name '${filename}' 2>/dev/null | head -1`);
  return output.trim() || null;
}

/**
 * Finds all markdown files with publish: true in their front matter.
 * Uses grep to pre-filter candidates before parsing, avoiding full directory traversal.
 * Handles both space- and tab-indented YAML front matter.
 * @param {string} sourceDir - Source directory to search
 * @param {string|null} target - Optional target value to filter by (matches front matter `target` field)
 * @returns {Array<Object>} Array of file objects with path, data, and content
 */
export function findPublishableFiles(sourceDir, target = null) {
  // Use grep to find only .md files containing 'publish: true', excluding dot-folders.
  // Pattern handles leading spaces or tabs (tab-indented YAML front matter).
  let cmd = `grep -rlE --include='*.md' '^[[:space:]]*publish:[[:space:]]*true' '${sourceDir}' | grep -v '/\\.'`;

  if (target !== null) {
    cmd += ` | xargs grep -lE '^[[:space:]]*target:[[:space:]]*${target}[[:space:]]*$'`;
  }

  const output = runCommand(cmd);
  const candidateFiles = output.trim().split('\n').filter(f => f.length > 0);
  const publishable = [];

  for (const filepath of candidateFiles) {
    try {
      const parsed = parseMatterFromFile(filepath);
      if (parsed.data && parsed.data.publish === true) {
        if (target !== null && parsed.data.target !== target) {
          continue;
        }
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
