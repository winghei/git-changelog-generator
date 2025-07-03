const { test, describe } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('Python Script Tests', () => {
  const pythonScript = path.join(__dirname, '../git_changelog.py');

  test('python script should exist', () => {
    assert.ok(fs.existsSync(pythonScript), 'Python script should exist');
  });

  test('should show help when --help flag is used', (t, done) => {
    const child = spawn('python3', [pythonScript, '--help']);
    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (error.includes('python3: command not found') || error.includes('No such file or directory')) {
        console.log('Skipping test: python3 not available');
        done();
        return;
      }
      
      assert.strictEqual(code, 0, 'Help command should exit with code 0');
      assert.ok(output.includes('Generate changelog from git log'), 'Help should contain description');
      assert.ok(output.includes('--since'), 'Help should contain --since option');
      assert.ok(output.includes('--format'), 'Help should contain --format option');
      done();
    });

    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        console.log('Skipping test: python3 not available');
        done();
      } else {
        done(err);
      }
    });
  });

  test('should generate markdown output by default', (t, done) => {
    const child = spawn('python3', [pythonScript, '--max-count', '1']);
    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (error.includes('python3: command not found') || error.includes('No such file or directory')) {
        console.log('Skipping test: python3 not available');
        done();
        return;
      }

      if (code === 0) {
        assert.ok(output.includes('# Changelog'), 'Should generate markdown with title');
        assert.ok(output.includes('Generated on'), 'Should include generation timestamp');
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
      if (err.code === 'ENOENT') {
        console.log('Skipping test: python3 not available');
        done();
      } else {
        done(err);
      }
    });
  });

  test('should generate JSON output when format is json', (t, done) => {
    const child = spawn('python3', [pythonScript, '--max-count', '1', '--format', 'json']);
    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (error.includes('python3: command not found') || error.includes('No such file or directory')) {
        console.log('Skipping test: python3 not available');
        done();
        return;
      }

      if (code === 0) {
        try {
          const parsed = JSON.parse(output);
          assert.ok(Array.isArray(parsed), 'JSON output should be an array of commits');
        } catch (parseError) {
          assert.fail(`Output should be valid JSON: ${parseError.message}`);
        }
      } else {
        // Skip test if no git repository or no commits
        if (error.includes('not a git repository') || error.includes('No commits found')) {
          console.log('Skipping test: No git repository or commits found');
        } else {
          assert.fail(`Script should succeed with JSON format. Error: ${error}`);
        }
      }
      done();
    });

    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        console.log('Skipping test: python3 not available');
        done();
      } else {
        done(err);
      }
    });
  });

  test('should generate simple output when format is simple', (t, done) => {
    const child = spawn('python3', [pythonScript, '--max-count', '1', '--format', 'simple']);
    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (error.includes('python3: command not found') || error.includes('No such file or directory')) {
        console.log('Skipping test: python3 not available');
        done();
        return;
      }

      if (code === 0) {
        assert.ok(output.includes('Changes ('), 'Simple format should show change count');
        assert.ok(output.includes('commits)'), 'Simple format should show commits info');
      } else {
        // Skip test if no git repository or no commits
        if (error.includes('not a git repository') || error.includes('No commits found')) {
          console.log('Skipping test: No git repository or commits found');
        } else {
          assert.fail(`Script should succeed with simple format. Error: ${error}`);
        }
      }
      done();
    });

    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        console.log('Skipping test: python3 not available');
        done();
      } else {
        done(err);
      }
    });
  });

  test('should save output to file when --output is specified', (t, done) => {
    const outputFile = path.join(__dirname, 'test-python-output.md');
    
    // Clean up any existing test file
    if (fs.existsSync(outputFile)) {
      fs.unlinkSync(outputFile);
    }

    const child = spawn('python3', [pythonScript, '--max-count', '1', '--format', 'markdown', '--output', outputFile]);
    let error = '';

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (error.includes('python3: command not found') || error.includes('No such file or directory')) {
        console.log('Skipping test: python3 not available');
        done();
        return;
      }

      if (code === 0) {
        // Check if file was created
        assert.ok(fs.existsSync(outputFile), 'Output file should be created');
        
        // Check if file contains markdown content
        const content = fs.readFileSync(outputFile, 'utf8');
        assert.ok(content.includes('# Changelog'), 'Output file should contain markdown');
        
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
      
      if (err.code === 'ENOENT') {
        console.log('Skipping test: python3 not available');
        done();
      } else {
        done(err);
      }
    });
  });

  test('should handle custom title', (t, done) => {
    const child = spawn('python3', [pythonScript, '--max-count', '1', '--title', 'Test Release']);
    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (error.includes('python3: command not found') || error.includes('No such file or directory')) {
        console.log('Skipping test: python3 not available');
        done();
        return;
      }

      if (code === 0) {
        assert.ok(output.includes('# Test Release'), 'Should include custom title');
      } else {
        // Skip test if no git repository or no commits
        if (error.includes('not a git repository') || error.includes('No commits found')) {
          console.log('Skipping test: No git repository or commits found');
        } else {
          assert.fail(`Script should succeed with custom title. Error: ${error}`);
        }
      }
      done();
    });

    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        console.log('Skipping test: python3 not available');
        done();
      } else {
        done(err);
      }
    });
  });

  test('should handle invalid format gracefully', (t, done) => {
    const child = spawn('python3', [pythonScript, '--format', 'invalid']);
    let error = '';

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (error.includes('python3: command not found') || error.includes('No such file or directory')) {
        console.log('Skipping test: python3 not available');
        done();
        return;
      }

      assert.strictEqual(code, 2, 'Invalid format should exit with code 2 (argparse error)');
      assert.ok(error.includes('invalid choice'), 'Should show invalid choice error');
      done();
    });

    child.on('error', (err) => {
      if (err.code === 'ENOENT') {
        console.log('Skipping test: python3 not available');
        done();
      } else {
        done(err);
      }
    });
  });
}); 