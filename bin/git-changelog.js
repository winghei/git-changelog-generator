#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the directory where this package is installed
const packageDir = path.dirname(__dirname);

// Default to shell script, but allow switching to Python
const args = process.argv.slice(2);
let useShell = true;
let usePython = false;

// Check for --python flag
const pythonIndex = args.indexOf('--python');
if (pythonIndex !== -1) {
  usePython = true;
  useShell = false;
  args.splice(pythonIndex, 1); // Remove the --python flag
}

// Check for --help or -h to show combined help
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Git Changelog Generator

USAGE:
  git-changelog [OPTIONS]
  git-changelog --python [OPTIONS]  # Use Python script instead of shell script

SHELL SCRIPT OPTIONS (default):
  -f, --format FORMAT     Output format: json, text (default: json)
  -s, --since DATE        Show commits since date
  -u, --until DATE        Show commits until date
  -b, --branch BRANCH     Branch to analyze (default: HEAD)
  -n, --max-count NUM     Maximum number of commits
  -o, --output FILE       Output file (default: stdout)
  -t, --title TITLE       Title for changelog
  --include-time         Include commit time

PYTHON SCRIPT OPTIONS (--python):
  --since DATE           Show commits since date
  --until DATE           Show commits until date
  --branch BRANCH        Branch to analyze (default: HEAD)
  --max-count NUM        Maximum number of commits
  --format FORMAT        Output format: markdown, simple, json (default: markdown)
  --title TITLE          Title for changelog
  --output FILE          Output file (default: stdout)

EXAMPLES:
  git-changelog --since "1 week ago"
  git-changelog --python --format markdown --since "1 month ago"
  git-changelog --format json --output changelog.json
  
PARSER:
  After generating JSON output, open the web parser:
  - Navigate to node_modules/git-changelog-generator/parser/index.html
  - Or copy the parser/ directory to your project
`);
  process.exit(0);
}

// Determine which script to run
let scriptPath, scriptArgs;

if (usePython) {
  scriptPath = path.join(packageDir, 'git_changelog.py');
  scriptArgs = args;
  
  // Check if Python script exists and is executable
  if (!fs.existsSync(scriptPath)) {
    console.error('Error: Python script not found');
    process.exit(1);
  }
  
  // Spawn Python script
  const child = spawn('python3', [scriptPath, ...scriptArgs], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  child.on('error', (error) => {
    if (error.code === 'ENOENT') {
      console.error('Error: python3 not found. Please install Python 3.');
    } else {
      console.error('Error running Python script:', error.message);
    }
    process.exit(1);
  });
  
  child.on('close', (code) => {
    process.exit(code);
  });
  
} else {
  scriptPath = path.join(packageDir, 'git_changelog.sh');
  scriptArgs = args;
  
  // Check if shell script exists and is executable
  if (!fs.existsSync(scriptPath)) {
    console.error('Error: Shell script not found');
    process.exit(1);
  }
  
  // Spawn shell script
  const child = spawn('bash', [scriptPath, ...scriptArgs], {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  child.on('error', (error) => {
    console.error('Error running shell script:', error.message);
    process.exit(1);
  });
  
  child.on('close', (code) => {
    process.exit(code);
  });
} 