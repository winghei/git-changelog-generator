#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Check for help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Git Changelog Parser

USAGE:
    git-changelog-parser [--help]

DESCRIPTION:
    Opens the Git Changelog Parser web interface in your default browser.
    The parser allows you to visualize, filter, and analyze changelog JSON files.

OPTIONS:
    -h, --help    Show this help message

EXAMPLES:
    # Open the parser
    git-changelog-parser
    
    # Complete workflow
    git-changelog --format json --output changelog.json
    git-changelog-parser
    # Then drag and drop changelog.json into the parser

FEATURES:
    - Multiple file support with drag & drop
    - Advanced filtering by type, author, branch, bugs, files, date
    - Full-text search with highlighting
    - Inline editing of commit messages and bug IDs
    - Export functionality for modifications
    - Color-coded commit types
    - Responsive design
`);
  process.exit(0);
}

// Get script directory
const projectRoot = path.dirname(__dirname);
const parserPath = path.join(projectRoot, 'parser', 'index.html');

// Check if parser exists
if (!fs.existsSync(parserPath)) {
  console.error('❌ Parser not found at:', parserPath);
  process.exit(1);
}

console.log('🌐 Opening Git Changelog Parser...');
console.log('📁 Parser location:', parserPath);

// Determine the command to open the browser based on the platform
let openCommand;
let args = [parserPath];

switch (process.platform) {
  case 'darwin': // macOS
    openCommand = 'open';
    break;
  case 'win32': // Windows
    openCommand = 'start';
    args = ['', parserPath]; // start command needs empty first argument
    break;
  case 'linux': // Linux
    openCommand = 'xdg-open';
    break;
  default:
    console.error('❌ Unsupported platform:', process.platform);
    console.log('ℹ️  Please manually open:', parserPath);
    process.exit(1);
}

// Open the parser in the default browser
const child = spawn(openCommand, args, {
  stdio: 'ignore',
  detached: true
});

child.unref();

child.on('error', (error) => {
  console.error('❌ Failed to open parser:', error.message);
  console.log('ℹ️  Please manually open:', parserPath);
  process.exit(1);
});

console.log('✅ Parser opened in your default browser');
console.log('💡 Tip: Generate JSON changelog first with:');
console.log('   git-changelog --format json --output changelog.json');
console.log('   Then drag and drop the JSON file into the parser'); 