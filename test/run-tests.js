#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Test runner for Git Changelog Generator
 * Runs all test suites using Node.js built-in test runner
 */

const testDir = __dirname;
const testFiles = [
  'test-api.js',
  'test-shell.js', 
  'test-python.js',
  'test-bin.js'
];

console.log('🧪 Running Git Changelog Generator Test Suite\n');

async function runTest(testFile) {
  return new Promise((resolve) => {
    const testPath = path.join(testDir, testFile);
    
    if (!fs.existsSync(testPath)) {
      console.log(`❌ Test file not found: ${testFile}`);
      resolve(false);
      return;
    }

    console.log(`🔍 Running ${testFile}...`);
    
    const child = spawn('node', ['--test', testPath], {
      stdio: 'inherit'
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${testFile} passed\n`);
        resolve(true);
      } else {
        console.log(`❌ ${testFile} failed with exit code ${code}\n`);
        resolve(false);
      }
    });

    child.on('error', (error) => {
      console.log(`❌ Error running ${testFile}: ${error.message}\n`);
      resolve(false);
    });
  });
}

async function runAllTests() {
  console.log('📋 Test files to run:');
  testFiles.forEach(file => console.log(`  - ${file}`));
  console.log('');

  let passed = 0;
  let total = testFiles.length;

  for (const testFile of testFiles) {
    const success = await runTest(testFile);
    if (success) passed++;
  }

  console.log('📊 Test Results Summary:');
  console.log(`  Total tests: ${total}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${total - passed}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed');
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Git Changelog Generator Test Runner

Usage: node run-tests.js [options] [test-file]

Options:
  --help, -h     Show this help message
  --list         List all available test files

Examples:
  node run-tests.js                    # Run all tests
  node run-tests.js test-api.js        # Run specific test file
  node run-tests.js --list             # List test files
`);
  process.exit(0);
}

if (args.includes('--list')) {
  console.log('Available test files:');
  testFiles.forEach(file => console.log(`  - ${file}`));
  process.exit(0);
}

// If specific test file provided
if (args.length > 0) {
  const specificTest = args[0];
  if (testFiles.includes(specificTest)) {
    runTest(specificTest).then(success => {
      process.exit(success ? 0 : 1);
    });
  } else {
    console.log(`❌ Test file not found: ${specificTest}`);
    console.log('Available test files:');
    testFiles.forEach(file => console.log(`  - ${file}`));
    process.exit(1);
  }
} else {
  // Run all tests
  runAllTests();
} 