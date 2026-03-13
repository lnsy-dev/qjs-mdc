/**
 * @fileoverview to-json command: converts a markdown file to a JSON AST document.
 *
 * Usage:
 *   mdc to-json <source.md> [--output <out.json>]
 *
 * Output defaults to <source>.json if --output is omitted.
 */

import { parseMatterFromFile } from '../../lib/md-yaml.js';
import { parseToAST } from '../../lib/md-ast.js';
import { writeFile } from '../utils/file-ops.js';

function resolveOutputPath(inputPath, outputArg) {
  if (outputArg) return outputArg;
  return inputPath.replace(/\.md$/i, '') + '.json';
}

export function toJson(inputPath, outputPath) {
  const parsed = parseMatterFromFile(inputPath);
  const content = parseToAST(parsed.content);
  const result = { frontMatter: parsed.data || {}, content };
  const out = resolveOutputPath(inputPath, outputPath);
  writeFile(out, JSON.stringify(result, null, 2));
  console.log('✓', out);
}
