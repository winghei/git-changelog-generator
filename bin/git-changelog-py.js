#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get the directory where this package is installed
const packageDir = path.dirname(__dirname);
const scriptPath = path.join(packageDir, 'git_changelog.py');

// Pass all arguments to the Python script
const args = process.argv.slice(2);

// Check if Python script exists
if (!fs.existsSync(scriptPath)) {
  console.error('Error: git_changelog.py not found');
  process.exit(1);
}

// Spawn Python script
const child = spawn('python3', [scriptPath, ...args], {
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