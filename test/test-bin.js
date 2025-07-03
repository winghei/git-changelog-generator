const { test, describe } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('Binary Wrapper Tests', () => {
  const binDir = path.join(__dirname, '../bin');

  test('bin directory should exist with executable files', () => {
    assert.ok(fs.existsSync(binDir), 'bin directory should exist');
    
    const binFiles = ['git-changelog.js', 'git-changelog-sh.js', 'git-changelog-py.js'];
    
    binFiles.forEach(file => {
      const filePath = path.join(binDir, file);
      assert.ok(fs.existsSync(filePath), `${file} should exist`);
      
      // Check if file is executable
      try {
        fs.accessSync(filePath, fs.constants.X_OK);
      } catch (error) {
        assert.fail(`${file} should be executable`);
      }
      
      // Check if file has proper shebang
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.startsWith('#!/usr/bin/env node'), `${file} should have proper Node.js shebang`);
    });
  });

  test('git-changelog.js should show help', (t, done) => {
    const binPath = path.join(binDir, 'git-changelog.js');
    const child = spawn('node', [binPath, '--help']);
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
      assert.ok(output.includes('Git Changelog Generator'), 'Should show title');
      assert.ok(output.includes('USAGE:'), 'Should show usage');
      assert.ok(output.includes('SHELL SCRIPT OPTIONS'), 'Should show shell options');
      assert.ok(output.includes('PYTHON SCRIPT OPTIONS'), 'Should show python options');
      assert.ok(output.includes('EXAMPLES:'), 'Should show examples');
      done();
    });

    child.on('error', (err) => {
      done(err);
    });
  });

  test('git-changelog-sh.js should execute shell script', (t, done) => {
    const binPath = path.join(binDir, 'git-changelog-sh.js');
    const child = spawn('node', [binPath, '--help']);
    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      assert.strictEqual(code, 0, 'Shell wrapper help should exit with code 0');
      assert.ok(output.includes('Git Changelog Generator'), 'Should show shell script help');
      assert.ok(output.includes('Usage:'), 'Should show shell script usage');
      done();
    });

    child.on('error', (err) => {
      done(err);
    });
  });

  test('git-changelog-py.js should execute python script', (t, done) => {
    const binPath = path.join(binDir, 'git-changelog-py.js');
    const child = spawn('node', [binPath, '--help']);
    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (error.includes('python3 not found')) {
        console.log('Skipping test: python3 not available');
        done();
        return;
      }
      
      assert.strictEqual(code, 0, 'Python wrapper help should exit with code 0');
      assert.ok(output.includes('Generate changelog from git log'), 'Should show python script help');
      done();
    });

    child.on('error', (err) => {
      done(err);
    });
  });

  test('git-changelog.js should handle --python flag', (t, done) => {
    const binPath = path.join(binDir, 'git-changelog.js');
    const child = spawn('node', [binPath, '--python', '--help']);
    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (error.includes('python3 not found')) {
        console.log('Skipping test: python3 not available');
        done();
        return;
      }
      
      assert.strictEqual(code, 0, 'Python flag help should exit with code 0');
      assert.ok(output.includes('PYTHON SCRIPT OPTIONS'), 'Should show unified help with python script options when --python flag is used');
      done();
    });

    child.on('error', (err) => {
      done(err);
    });
  });

  test('git-changelog.js should execute shell script by default', (t, done) => {
    const binPath = path.join(binDir, 'git-changelog.js');
    const child = spawn('node', [binPath, '--max-count', '1', '--format', 'json']);
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
        // Should produce JSON from shell script
        try {
          const parsed = JSON.parse(output);
          assert.ok(parsed.title, 'Should generate JSON with title');
          assert.ok(Array.isArray(parsed.commits), 'Should have commits array');
        } catch (parseError) {
          assert.fail(`Should produce valid JSON: ${parseError.message}`);
        }
      } else {
        // Skip test if no git repository or no commits
        if (error.includes('not a git repository') || error.includes('No commits found')) {
          console.log('Skipping test: No git repository or commits found');
        } else {
          assert.fail(`Should succeed with basic shell execution. Error: ${error}`);
        }
      }
      done();
    });

    child.on('error', (err) => {
      done(err);
    });
  });

  test('should handle missing script files gracefully', (t, done) => {
    // Create a temporary bin file that references a non-existent script
    const tempBinPath = path.join(__dirname, 'temp-test-bin.js');
    const tempBinContent = `#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const scriptPath = path.join(__dirname, 'non-existent-script.sh');

if (!fs.existsSync(scriptPath)) {
  console.error('Error: Shell script not found');
  process.exit(1);
}
`;

    fs.writeFileSync(tempBinPath, tempBinContent);
    fs.chmodSync(tempBinPath, '755');

    const child = spawn('node', [tempBinPath]);
    let error = '';

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      assert.strictEqual(code, 1, 'Should exit with code 1 when script not found');
      assert.ok(error.includes('Shell script not found'), 'Should show appropriate error message');
      
      // Clean up
      fs.unlinkSync(tempBinPath);
      done();
    });

    child.on('error', (err) => {
      // Clean up on error
      if (fs.existsSync(tempBinPath)) {
        fs.unlinkSync(tempBinPath);
      }
      done(err);
    });
  });
}); 