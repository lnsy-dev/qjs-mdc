/**
 * @fileoverview Command-line interface utilities for parsing arguments and displaying help.
 */

import * as std from 'std';

/**
 * Prints the help message with usage instructions.
 */
export function printHelp() {
  console.log('Usage: mdc <source-directory> --output <output-directory>');
  console.log('');
  console.log('Compile markdown files with YAML front matter into static HTML.');
  console.log('');
  console.log('Options:');
  console.log('  --output, -o    Output directory (required)');
  console.log('  --help, -h      Show this help message');
}

/**
 * Parses command-line arguments into a configuration object.
 * @param {string|Array<string>} args - Command-line arguments (scriptArgs)
 * @returns {Object} Configuration object with source and output paths
 */
export function parseArgs(args) {
  // scriptArgs is a string in QuickJS, need to split it
  if (typeof args === 'string') {
    args = args.split(',');
  }
  
  if (!args || args.length < 3) {
    printHelp();
    std.exit(1);
  }

  const config = {
    source: null,
    output: null
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      printHelp();
      std.exit(0);
    } else if (arg === '--output' || arg === '-o') {
      config.output = args[++i];
    } else if (!config.source) {
      config.source = arg;
    }
  }

  if (!config.source) {
    console.log('Error: Source directory is required');
    printHelp();
    std.exit(1);
  }

  if (!config.output) {
    console.log('Error: Output directory is required (use --output)');
    printHelp();
    std.exit(1);
  }

  return config;
}
