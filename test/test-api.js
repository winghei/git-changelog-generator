const { test, describe } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const GitChangelogGenerator = require('../index.js');

describe('GitChangelogGenerator API Tests', () => {
  let generator;

  test('should initialize GitChangelogGenerator', () => {
    generator = new GitChangelogGenerator();
    assert.ok(generator instanceof GitChangelogGenerator);
    assert.strictEqual(typeof generator.generateShell, 'function');
    assert.strictEqual(typeof generator.generatePython, 'function');
    assert.strictEqual(typeof generator.generateJSON, 'function');
    assert.strictEqual(typeof generator.getParserPath, 'function');
  });

  test('should return correct parser path', () => {
    generator = new GitChangelogGenerator();
    const parserPath = generator.getParserPath();
    assert.ok(parserPath.endsWith('parser/index.html'));
    assert.ok(fs.existsSync(path.dirname(parserPath))); // parser directory should exist
  });

  test('should build shell script arguments correctly', () => {
    generator = new GitChangelogGenerator();
    
    const options = {
      format: 'json',
      since: '1 week ago',
      until: '2023-12-31',
      branch: 'main',
      maxCount: 10,
      output: 'test.json',
      title: 'Test Changelog',
      includeTime: true
    };
    
    const args = generator._buildShellArgs(options);
    
    assert.ok(args.includes('--format'));
    assert.ok(args.includes('json'));
    assert.ok(args.includes('--since'));
    assert.ok(args.includes('1 week ago'));
    assert.ok(args.includes('--until'));
    assert.ok(args.includes('2023-12-31'));
    assert.ok(args.includes('--branch'));
    assert.ok(args.includes('main'));
    assert.ok(args.includes('--max-count'));
    assert.ok(args.includes('10'));
    assert.ok(args.includes('--output'));
    assert.ok(args.includes('test.json'));
    assert.ok(args.includes('--title'));
    assert.ok(args.includes('Test Changelog'));
    assert.ok(args.includes('--include-time'));
  });

  test('should build python script arguments correctly', () => {
    generator = new GitChangelogGenerator();
    
    const options = {
      since: '1 month ago',
      until: '2023-12-31',
      branch: 'develop',
      maxCount: 20,
      format: 'markdown',
      title: 'Release Notes',
      output: 'CHANGELOG.md'
    };
    
    const args = generator._buildPythonArgs(options);
    
    assert.ok(args.includes('--since'));
    assert.ok(args.includes('1 month ago'));
    assert.ok(args.includes('--until'));
    assert.ok(args.includes('2023-12-31'));
    assert.ok(args.includes('--branch'));
    assert.ok(args.includes('develop'));
    assert.ok(args.includes('--max-count'));
    assert.ok(args.includes('20'));
    assert.ok(args.includes('--format'));
    assert.ok(args.includes('markdown'));
    assert.ok(args.includes('--title'));
    assert.ok(args.includes('Release Notes'));
    assert.ok(args.includes('--output'));
    assert.ok(args.includes('CHANGELOG.md'));
  });

  test('should handle empty options for shell args', () => {
    generator = new GitChangelogGenerator();
    const args = generator._buildShellArgs({});
    assert.strictEqual(args.length, 0);
  });

  test('should handle empty options for python args', () => {
    generator = new GitChangelogGenerator();
    const args = generator._buildPythonArgs({});
    assert.strictEqual(args.length, 0);
  });

  test('should generate shell changelog with basic options', async () => {
    generator = new GitChangelogGenerator();
    
    try {
      const result = await generator.generateShell({
        maxCount: 1,
        format: 'json'
      });
      
      // Should return some output
      assert.ok(typeof result === 'string');
      assert.ok(result.length > 0);
      
      // Try to parse as JSON if format is json
      const parsed = JSON.parse(result);
      assert.ok(parsed.title);
      assert.ok(Array.isArray(parsed.commits));
    } catch (error) {
      // Skip test if git repository doesn't have commits or git is not available
      if (error.message.includes('No commits found') || error.message.includes('not a git repository')) {
        console.log('Skipping test: No git repository or commits found');
      } else {
        throw error;
      }
    }
  });

  test('should generate python changelog with basic options', async () => {
    generator = new GitChangelogGenerator();
    
    try {
      const result = await generator.generatePython({
        maxCount: 1,
        format: 'simple'
      });
      
      // Should return some output
      assert.ok(typeof result === 'string');
      assert.ok(result.length > 0);
    } catch (error) {
      // Skip test if git repository doesn't have commits, python is not available, or git is not available
      if (error.message.includes('No commits found') || 
          error.message.includes('python3 not found') ||
          error.message.includes('not a git repository')) {
        console.log('Skipping test: No git repository, commits, or python3 found');
      } else {
        throw error;
      }
    }
  });

  test('should generate and parse JSON correctly', async () => {
    generator = new GitChangelogGenerator();
    
    try {
      const result = await generator.generateJSON({
        maxCount: 1
      });
      
      // Should return parsed JSON object
      assert.ok(typeof result === 'object');
      assert.ok(result.title);
      assert.ok(Array.isArray(result.commits));
      assert.ok(result.generated_on);
    } catch (error) {
      // Skip test if git repository doesn't have commits or git is not available
      if (error.message.includes('No commits found') || error.message.includes('not a git repository')) {
        console.log('Skipping test: No git repository or commits found');
      } else {
        throw error;
      }
    }
  });

  test('should handle invalid JSON in generateJSON', async () => {
    generator = new GitChangelogGenerator();
    
    // Mock the generateShell method to return invalid JSON
    const originalGenerateShell = generator.generateShell;
    generator.generateShell = async () => 'invalid json';
    
    try {
      await generator.generateJSON({});
      assert.fail('Should have thrown an error for invalid JSON');
    } catch (error) {
      assert.ok(error.message.includes('Failed to parse JSON output'));
    } finally {
      // Restore original method
      generator.generateShell = originalGenerateShell;
    }
  });
}); 