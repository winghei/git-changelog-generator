#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

// Get script directory
const projectRoot = path.dirname(__dirname);
const tagScript = path.join(projectRoot, 'git_tag_changelog.sh');

// Pass all arguments to the shell script
const args = process.argv.slice(2);

// Spawn the shell script
const child = spawn('bash', [tagScript, ...args], {
  stdio: 'inherit',
  cwd: process.cwd()
});

child.on('exit', (code) => {
  process.exit(code);
});

child.on('error', (error) => {
  console.error('Error executing git-tag-changelog:', error.message);
  process.exit(1);
}); 