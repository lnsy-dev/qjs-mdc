/**
 * @fileoverview Template engine for loading, compiling, and rendering HTML templates.
 * Supports variable substitution and template includes.
 */

import * as std from 'std';

/**
 * Loads a template file from the templates directory.
 * @param {string} templatesDir - Path to templates directory
 * @param {string} name - Template filename
 * @returns {string} Template content or empty string if not found
 */
export function loadTemplate(templatesDir, name) {
  const path = `${templatesDir}/${name}`;
  const content = std.loadFile(path);
  return content || '';
}

/**
 * Loads the global configuration from index.json.
 * @param {string} sourceDir - Source directory path
 * @returns {Object} Parsed JSON configuration or empty object
 */
export function loadIndexConfig(sourceDir) {
  const path = `${sourceDir}/index.json`;
  const content = std.loadFile(path);
  if (!content) return {};
  try {
    return JSON.parse(content);
  } catch (e) {
    return {};
  }
}

/**
 * Substitutes variables in template using {{variable}} syntax.
 * @param {string} template - Template string with {{variable}} placeholders
 * @param {Object} vars - Variables object for substitution
 * @returns {string} Template with variables substituted
 */
export function substituteVariables(template, vars) {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmed = key.trim();
    return vars[trimmed] !== undefined ? vars[trimmed] : '';
  });
}

/**
 * Compiles a template by processing includes and substituting variables.
 * First pass: compile {{*.html}} template includes
 * Second pass: compile data variables
 * @param {string} template - Template string
 * @param {Object} vars - Variables for substitution
 * @param {string} templatesDir - Path to templates directory
 * @returns {string} Fully compiled template
 */
export function compileTemplate(template, vars, templatesDir) {
  // First pass: compile {{*.html}} template includes
  let result = template.replace(/\{\{([^}]+\.html)\}\}/g, (match, filename) => {
    const trimmed = filename.trim();
    return loadTemplate(templatesDir, trimmed);
  });
  
  // Second pass: compile data variables
  result = substituteVariables(result, vars);
  
  return result;
}

/**
 * Selects the appropriate template for a file based on its type.
 * Priority: {type}.html > post.html > default.html
 * @param {Object} file - File object with data property
 * @param {string} templatesDir - Path to templates directory
 * @returns {string} Selected template content
 */
export function selectTemplate(file, templatesDir) {
  const type = file.data.type;
  
  if (type) {
    const typeTemplate = loadTemplate(templatesDir, `${type}.html`);
    if (typeTemplate) return typeTemplate;
  }
  
  const postTemplate = loadTemplate(templatesDir, 'post.html');
  if (postTemplate) return postTemplate;
  
  return loadTemplate(templatesDir, 'default.html');
}
