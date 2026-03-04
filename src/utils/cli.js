/**
 * @fileoverview Command-line interface utilities for parsing arguments and displaying help.
 */

import * as std from 'std';

/**
 * Prints the help message with usage instructions.
 */
export function printHelp() {
  console.log('Usage: mdc <command> [options]');
  console.log('');
  console.log('Commands:');
  console.log('  <source-directory> --output <output-directory>');
  console.log('    Compile markdown files with YAML front matter into static HTML');
  console.log('');
  console.log('  create-new-notebook <target-directory>');
  console.log('    Create a new notebook from template with guided setup');
  console.log('');
  console.log('Options:');
  console.log('  --output, -o    Output directory (required for compilation)');
  console.log('  --watch, -w     Watch source directory and recompile on changes');
  console.log('  --target, -t    Filter files by target value in YAML front matter');
  console.log('  --help, -h      Show this help message');
}

/**
 * Parses command-line arguments into a configuration object.
 * @param {string|Array<string>} args - Command-line arguments (scriptArgs)
 * @returns {Object} Configuration object with command type and parameters
 */
export function parseArgs(args) {
  // scriptArgs is a string in QuickJS, need to split it
  if (typeof args === 'string') {
    args = args.split(',');
  }
  
  if (!args || args.length < 2) {
    printHelp();
    std.exit(1);
  }

  const firstArg = args[1];
  
  // Check for help flag
  if (firstArg === '--help' || firstArg === '-h') {
    printHelp();
    std.exit(0);
  }
  
  // Check for create-new-notebook command
  if (firstArg === 'create-new-notebook') {
    if (!args[2]) {
      console.log('Error: Target directory is required for create-new-notebook');
      console.log('Usage: mdc create-new-notebook <target-directory>');
      std.exit(1);
    }
    
    return {
      command: 'create-notebook',
      targetPath: args[2]
    };
  }
  
  // Default: compilation command
  const config = {
    command: 'compile',
    source: null,
    output: null,
    watch: false,
    target: null
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--help' || arg === '-h') {
      printHelp();
      std.exit(0);
    } else if (arg === '--output' || arg === '-o') {
      config.output = args[++i];
    } else if (arg === '--watch' || arg === '-w') {
      config.watch = true;
    } else if (arg === '--target' || arg === '-t') {
      config.target = args[++i];
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
