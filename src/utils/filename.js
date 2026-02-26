/**
 * @fileoverview Filename sanitization and conflict resolution utilities.
 */

/**
 * Sanitizes a filename by converting to lowercase and replacing non-alphanumeric characters.
 * @param {string} name - Original filename
 * @returns {string} Sanitized filename
 */
export function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Resolves filename conflicts by appending numbers to duplicate names.
 * Modifies the files array in place by adding outputName property.
 * @param {Array<Object>} files - Array of file objects with data and path
 * @returns {Array<Object>} Modified files array with outputName property
 */
export function resolveFilenameConflicts(files) {
  const usedNames = new Map();
  
  for (const file of files) {
    const basename = file.data.title || file.path.split('/').pop().replace(/\.md$/, '');
    let sanitized = sanitizeFilename(basename);
    
    if (usedNames.has(sanitized)) {
      const count = usedNames.get(sanitized) + 1;
      usedNames.set(sanitized, count);
      sanitized = `${sanitized}-${count}`;
    } else {
      usedNames.set(sanitized, 1);
    }
    
    file.outputName = sanitized + '.html';
  }
  
  return files;
}
