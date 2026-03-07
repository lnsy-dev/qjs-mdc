/**
 * @fileoverview File system operations for discovering and parsing markdown files.
 * Handles recursive directory traversal and filtering publishable content.
 */

import * as std from 'std';
import * as os from 'os';
import { parseMatterFromFile } from '../../lib/md-yaml.js';

/**
 * Executes a shell command and returns its stdout as a string.
 * @param {string} cmd - Shell command to run
 * @returns {string} Command stdout, or empty string on failure
 */
function runCommand(cmd) {
  const pipe = std.popen(cmd, 'r');
  if (!pipe) return '';
  const output = pipe.readAsString();
  pipe.close();
  return output;
}

/**
 * Writes content to a file, creating or overwriting it.
 * @param {string} path - Absolute file path to write
 * @param {string} content - Content to write
 */
export function writeFile(path, content) {
  const f = std.open(path, 'w');
  f.puts(content);
  f.close();
}

/**
 * Returns the newest modification time among files in a directory (non-recursive).
 * @param {string} dir - Directory path to scan
 * @returns {number} Newest mtime in milliseconds, or 0 if directory is empty/missing
 */
export function getNewestMtime(dir) {
  const [entries] = os.readdir(dir);
  if (!entries) return 0;
  let newest = 0;
  for (const entry of entries) {
    if (entry === '.' || entry === '..') continue;
    const [stat] = os.stat(`${dir}/${entry}`);
    if (stat && stat.mtime > newest) newest = stat.mtime;
  }
  return newest;
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
