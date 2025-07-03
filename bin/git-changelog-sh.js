#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the directory where this package is installed
const packageDir = path.dirname(__dirname);
const scriptPath = path.join(packageDir, 'git_changelog.sh');

// Pass all arguments to the shell script
const args = process.argv.slice(2);

// Check if shell script exists
if (!fs.existsSync(scriptPath)) {
  console.error('Error: git_changelog.sh not found');
  process.exit(1);
}

// Spawn shell script
const child = spawn('bash', [scriptPath, ...args], {
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