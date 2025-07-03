const { test, describe } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('Shell Script Tests', () => {
  const shellScript = path.join(__dirname, '../git_changelog.sh');

  test('shell script should exist and be executable', () => {
    assert.ok(fs.existsSync(shellScript), 'Shell script should exist');
    
    // Check if file is executable
    try {
      fs.accessSync(shellScript, fs.constants.X_OK);
    } catch (error) {
      assert.fail('Shell script should be executable');
    }
  });

  test('should show help when --help flag is used', (t, done) => {
    const child = spawn('bash', [shellScript, '--help']);
    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      assert.strictEqual(code, 0, 'Help command should exit with code 0');
      assert.ok(output.includes('Git Changelog Generator'), 'Help should contain title');
      assert.ok(output.includes('Usage:'), 'Help should contain usage information');
      assert.ok(output.includes('OPTIONS:'), 'Help should contain options');
      assert.ok(output.includes('EXAMPLES:'), 'Help should contain examples');
      done();
    });

    child.on('error', (err) => {
      done(err);
    });
  });

  test('should handle invalid format option', (t, done) => {
    const child = spawn('bash', [shellScript, '--format', 'invalid']);
    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      assert.strictEqual(code, 1, 'Invalid format should exit with code 1');
      assert.ok(output.includes('Format must be \'json\' or \'text\''), 'Should show format error message');
      done();
    });

    child.on('error', (err) => {
      done(err);
    });
  });

  test('should generate JSON output with basic options', (t, done) => {
    const child = spawn('bash', [shellScript, '--max-count', '1', '--format', 'json']);
    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        // Should produce valid JSON
        try {
          const parsed = JSON.parse(output);
          assert.ok(parsed.title, 'JSON should have title');
          assert.ok(Array.isArray(parsed.commits), 'JSON should have commits array');
          assert.ok(parsed.generated_on, 'JSON should have generated_on timestamp');
        } catch (parseError) {
          assert.fail(`Output should be valid JSON: ${parseError.message}`);
        }
      } else {
        // Skip test if no git repository or no commits
        if (error.includes('not a git repository') || error.includes('No commits found')) {
          console.log('Skipping test: No git repository or commits found');
        } else {
          assert.fail(`Script should succeed with basic options. Error: ${error}`);
        }
      }
      done();
    });

    child.on('error', (err) => {
      done(err);
    });
  });

  test('should generate text output format', (t, done) => {
    const child = spawn('bash', [shellScript, '--max-count', '1', '--format', 'text']);
    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        assert.ok(output.includes('Generated on:'), 'Text output should include generation timestamp');
        assert.ok(output.length > 0, 'Should produce some output');
      } else {
        // Skip test if no git repository or no commits
        if (error.includes('not a git repository') || error.includes('No commits found')) {
          console.log('Skipping test: No git repository or commits found');
        } else {
          assert.fail(`Script should succeed with basic options. Error: ${error}`);
        }
      }
      done();
    });

    child.on('error', (err) => {
      done(err);
    });
  });

  test('should save output to file when --output is specified', (t, done) => {
    const outputFile = path.join(__dirname, 'test-output.json');
    
    // Clean up any existing test file
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }

    const child = spawn('bash', [shellScript, '--max-count', '1', '--format', 'json', '--output', outputFile]);
    let error = '';

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        // Check if file was created
        assert.ok(fs.existsSync(outputFile), 'Output file should be created');
        
        // Check if file contains valid JSON
        try {
          const content = fs.readFileSync(outputFile, 'utf8');
          const parsed = JSON.parse(content);
          assert.ok(parsed.title, 'Output file should contain valid JSON');
        } catch (parseError) {
          assert.fail(`Output file should contain valid JSON: ${parseError.message}`);
        }
        
        // Clean up
        if (fs.existsSync(outputFile)) {
          fs.unlinkSync(outputFile);
        }
      } else {
        // Skip test if no git repository or no commits
        if (error.includes('not a git repository') || error.includes('No commits found')) {
          console.log('Skipping test: No git repository or commits found');
        } else {
          assert.fail(`Script should succeed with output file. Error: ${error}`);
        }
      }
      done();
    });

    child.on('error', (err) => {
      // Clean up on error
      if (fs.existsSync(outputFile)) {
        fs.unlinkSync(outputFile);
      }
      done(err);
    });
  });

  test('should handle title option', (t, done) => {
    const child = spawn('bash', [shellScript, '--max-count', '1', '--format', 'json', '--title', 'Test Title']);
    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          const parsed = JSON.parse(output);
          assert.ok(parsed.title.includes('Test Title'), 'JSON should include custom title');
        } catch (parseError) {
          assert.fail(`Output should be valid JSON: ${parseError.message}`);
        }
      } else {
        // Skip test if no git repository or no commits
        if (error.includes('not a git repository') || error.includes('No commits found')) {
          console.log('Skipping test: No git repository or commits found');
        } else {
          assert.fail(`Script should succeed with title option. Error: ${error}`);
        }
      }
      done();
    });

    child.on('error', (err) => {
      done(err);
    });
  });

  test('should handle unknown option gracefully', (t, done) => {
    const child = spawn('bash', [shellScript, '--unknown-option']);
    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      assert.strictEqual(code, 1, 'Unknown option should exit with code 1');
      assert.ok(output.includes('Unknown option:'), 'Should show unknown option error');
      done();
    });

    child.on('error', (err) => {
      done(err);
    });
  });
}); 