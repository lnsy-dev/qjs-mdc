/**
 * @fileoverview CSS custom property parser for extracting color variables
 */

/**
 * Extract CSS custom properties from CSS content
 * @param {string[]} cssArray - Array of CSS file contents
 * @returns {Object} Object with color properties
 */
export function extractCSSColors(cssArray) {
  const colors = {};
  const colorProps = ['--color-primary', '--color-secondary', '--color-tertiary', '--color-quaternary'];
  
  for (const css of cssArray) {
    for (const prop of colorProps) {
      const regex = new RegExp(`${prop.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\s*:\\s*([^;]+);`, 'i');
      const match = css.match(regex);
      if (match) {
        colors[prop] = match[1].trim();
      }
    }
  }
  
  return Object.keys(colors).length > 0 ? colors : null;
}
