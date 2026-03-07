/**
 * @fileoverview Filename sanitization, conflict resolution, and tag normalization utilities.
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
 * Normalizes a tags value from front matter into a clean array of non-empty strings.
 * Accepts a single tag string, an array of tags, or undefined/null.
 * @param {string|Array<string>|undefined} tags - Raw tags value from front matter
 * @returns {Array<string>} Normalized array of non-empty tag strings
 */
export function normalizeTagArray(tags) {
  const arr = Array.isArray(tags) ? tags : [tags];
  return arr.filter(Boolean).map(String);
}

/**
 * Assigns output filenames to each file, resolving conflicts by appending a counter.
 * Mutates each file object in place by adding an `outputName` property.
 * @param {Array<Object>} files - Array of file objects with data and path
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
}
