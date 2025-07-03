const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Git Changelog Generator Node.js API
 */
class GitChangelogGenerator {
  constructor() {
    this.packageDir = __dirname;
  }

  /**
   * Generate changelog using shell script
   * @param {Object} options - Options for changelog generation
   * @returns {Promise<string>} - Generated changelog content
   */
  generateShell(options = {}) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(this.packageDir, 'git_changelog.sh');
      const args = this._buildShellArgs(options);
      
      let output = '';
      let error = '';
      
      const child = spawn('bash', [scriptPath, ...args], {
        cwd: options.cwd || process.cwd()
      });
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(error || `Process exited with code ${code}`));
        }
      });
      
      child.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Generate changelog using Python script
   * @param {Object} options - Options for changelog generation
   * @returns {Promise<string>} - Generated changelog content
   */
  generatePython(options = {}) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(this.packageDir, 'git_changelog.py');
      const args = this._buildPythonArgs(options);
      
      let output = '';
      let error = '';
      
      const child = spawn('python3', [scriptPath, ...args], {
        cwd: options.cwd || process.cwd()
      });
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(error || `Process exited with code ${code}`));
        }
      });
      
      child.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Get path to the web parser
   * @returns {string} - Path to parser/index.html
   */
  getParserPath() {
    return path.join(this.packageDir, 'parser', 'index.html');
  }

  /**
   * Open the web parser in the default browser
   * @returns {Promise<boolean>} - Success status
   */
  openParser() {
    return new Promise((resolve, reject) => {
      const parserPath = this.getParserPath();
      
      // Check if parser exists
      if (!require('fs').existsSync(parserPath)) {
        reject(new Error(`Parser not found at: ${parserPath}`));
        return;
      }

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
          reject(new Error(`Unsupported platform: ${process.platform}`));
          return;
      }

      // Open the parser in the default browser
      const child = spawn(openCommand, args, {
        stdio: 'ignore',
        detached: true
      });

      child.unref();

      child.on('error', (error) => {
        reject(error);
      });

      // Consider it successful if no immediate error
      setTimeout(() => {
        resolve(true);
      }, 100);
    });
  }

  /**
   * Generate changelog and parse as JSON
   * @param {Object} options - Options for changelog generation
   * @returns {Promise<Object>} - Parsed changelog JSON
   */
  async generateJSON(options = {}) {
    const shellOptions = { ...options, format: 'json' };
    const output = await this.generateShell(shellOptions);
    try {
      return JSON.parse(output);
    } catch (error) {
      throw new Error(`Failed to parse JSON output: ${error.message}`);
    }
  }

  _buildShellArgs(options) {
    const args = [];
    
    if (options.format) {
      args.push('--format', options.format);
    }
    if (options.since) {
      args.push('--since', options.since);
    }
    if (options.until) {
      args.push('--until', options.until);
    }
    if (options.branch) {
      args.push('--branch', options.branch);
    }
    if (options.maxCount) {
      args.push('--max-count', options.maxCount.toString());
    }
    if (options.output) {
      args.push('--output', options.output);
    }
    if (options.title) {
      args.push('--title', options.title);
    }
    if (options.includeTime) {
      args.push('--include-time');
    }
    
    return args;
  }

  _buildPythonArgs(options) {
    const args = [];
    
    if (options.since) {
      args.push('--since', options.since);
    }
    if (options.until) {
      args.push('--until', options.until);
    }
    if (options.branch) {
      args.push('--branch', options.branch);
    }
    if (options.maxCount) {
      args.push('--max-count', options.maxCount.toString());
    }
    if (options.format) {
      args.push('--format', options.format);
    }
    if (options.title) {
      args.push('--title', options.title);
    }
    if (options.output) {
      args.push('--output', options.output);
    }
    
    return args;
  }

  /**
   * Create a git tag and generate changelog
   * @param {string} version - Version to tag (e.g., "1.2.3")
   * @param {Object} options - Configuration options
   * @param {string} [options.message] - Tag message (default: "Release VERSION")
   * @param {string} [options.prefix="v"] - Tag prefix
   * @param {string} [options.format="markdown"] - Changelog format
   * @param {string} [options.output] - Changelog output file
   * @param {boolean} [options.dryRun=false] - Show what would be done without executing
   * @param {boolean} [options.force=false] - Force tag creation (overwrite existing)
   * @param {boolean} [options.annotated=true] - Create annotated tag
   * @param {boolean} [options.push=false] - Push tag to origin
   * @param {boolean} [options.usePython=false] - Use Python script for changelog
   * @param {boolean} [options.sinceLastTag=true] - Generate changelog since last tag
   * @returns {Promise<Object>} Result object with tag and changelog info
   */
  async createTagAndChangelog(version, options = {}) {
    const {
      message,
      prefix = 'v',
      format = 'markdown',
      output,
      dryRun = false,
      force = false,
      annotated = true,
      push = false,
      usePython = false,
      sinceLastTag = true,
      since,
      until,
      maxCount
    } = options;

    const tagScript = path.join(this.packageDir, 'git_tag_changelog.sh');
    const args = [];

    // Add version
    if (version) {
      args.push(version);
    }

    // Add options
    if (message) {
      args.push('--message', message);
    }
    if (prefix !== 'v') {
      args.push('--prefix', prefix);
    }
    if (format !== 'markdown') {
      args.push('--format', format);
    }
    if (output) {
      args.push('--output', output);
    }
    if (dryRun) {
      args.push('--dry-run');
    }
    if (force) {
      args.push('--force');
    }
    if (!annotated) {
      args.push('--lightweight');
    }
    if (push) {
      args.push('--push');
    }
    if (usePython) {
      args.push('--python');
    }
    if (sinceLastTag) {
      args.push('--since-last-tag');
    }
    if (since) {
      args.push('--since', since);
    }
    if (until) {
      args.push('--until', until);
    }
    if (maxCount) {
      args.push('--max-count', maxCount.toString());
    }

    try {
      const result = await this._executeCommand('bash', [tagScript, ...args]);
      
      const tagName = `${prefix}${version}`;
      const changelogFile = output || `CHANGELOG-${version}.${format === 'markdown' ? 'md' : format === 'json' ? 'json' : 'txt'}`;
      
      return {
        success: true,
        version,
        tag: tagName,
        changelog: changelogFile,
        dryRun,
        output: result.stdout,
        error: result.stderr
      };
    } catch (error) {
      return {
        success: false,
        version,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  /**
   * Auto-increment version and create tag with changelog
   * @param {string} incrementType - Type of increment: "major", "minor", "patch"
   * @param {Object} options - Configuration options (same as createTagAndChangelog)
   * @returns {Promise<Object>} Result object with tag and changelog info
   */
  async autoIncrementTag(incrementType, options = {}) {
    const tagScript = path.join(this.packageDir, 'git_tag_changelog.sh');
    const args = ['--auto-increment', incrementType];

    // Add all other options
    const {
      message,
      prefix = 'v',
      format = 'markdown',
      output,
      dryRun = false,
      force = false,
      annotated = true,
      push = false,
      usePython = false,
      sinceLastTag = true,
      since,
      until,
      maxCount
    } = options;

    if (message) {
      args.push('--message', message);
    }
    if (prefix !== 'v') {
      args.push('--prefix', prefix);
    }
    if (format !== 'markdown') {
      args.push('--format', format);
    }
    if (output) {
      args.push('--output', output);
    }
    if (dryRun) {
      args.push('--dry-run');
    }
    if (force) {
      args.push('--force');
    }
    if (!annotated) {
      args.push('--lightweight');
    }
    if (push) {
      args.push('--push');
    }
    if (usePython) {
      args.push('--python');
    }
    if (sinceLastTag) {
      args.push('--since-last-tag');
    }
    if (since) {
      args.push('--since', since);
    }
    if (until) {
      args.push('--until', until);
    }
    if (maxCount) {
      args.push('--max-count', maxCount.toString());
    }

    try {
      const result = await this._executeCommand('bash', [tagScript, ...args]);
      
      // Extract version from output (it will be logged)
      const versionMatch = result.stderr.match(/Version: (\d+\.\d+\.\d+)/);
      const version = versionMatch ? versionMatch[1] : 'unknown';
      const tagName = `${prefix}${version}`;
      const changelogFile = output || `CHANGELOG-${version}.${format === 'markdown' ? 'md' : format === 'json' ? 'json' : 'txt'}`;
      
      return {
        success: true,
        version,
        tag: tagName,
        changelog: changelogFile,
        incrementType,
        dryRun,
        output: result.stdout,
        error: result.stderr
      };
    } catch (error) {
      return {
        success: false,
        incrementType,
        error: error.message,
        output: error.stdout || '',
        stderr: error.stderr || ''
      };
    }
  }

  /**
   * Helper method to execute shell commands
   * @private
   */
  _executeCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      let output = '';
      let error = '';
      
      const child = spawn(command, args, {
        cwd: options.cwd || process.cwd(),
        ...options
      });
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout: output, stderr: error, code });
        } else {
          const err = new Error(error || `Process exited with code ${code}`);
          err.stdout = output;
          err.stderr = error;
          err.code = code;
          reject(err);
        }
      });
      
      child.on('error', (err) => {
        reject(err);
      });
    });
  }
}

module.exports = GitChangelogGenerator; 