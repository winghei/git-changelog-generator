# Git Changelog Generator

A comprehensive collection of tools to generate, format, and visualize changelogs from git commit history. This toolkit includes command-line generators and an advanced web-based parser for analyzing changelog data.

## Components

- `git_changelog.py` - Full-featured Python script with advanced categorization
- `git_changelog.sh` - Lightweight shell script for quick usage  
- `git_tag_changelog.sh` - Combined git tag and changelog generation tool
- `Makefile` - Convenient targets for common operations
- `parser/` - Web-based JSON parser and visualization tool

## Installation

### Global Installation (Recommended)
```bash
# Install globally from npm
npm install -g git-changelog-tool

# Now you can run from anywhere:
git-changelog --since "1 week ago"
git-tag-changelog --auto-increment patch
git-changelog-parser
```

### Local Installation
```bash
# Install locally in your project
npm install git-changelog-tool

# Run via npx
npx git-changelog --since "1 week ago"
npx git-tag-changelog 1.2.3
npx git-changelog-parser
```

### Direct Usage (No Installation)
```bash
# Clone the repository
git clone https://github.com/winghei/git-changelog-generator.git
cd git-changelog-generator
make install

# Use directly
./git_changelog.sh --since "1 week ago"
./git_tag_changelog.sh --auto-increment patch
```

## Quick Start

1. **Global Installation:**
   ```bash
   npm install -g git-changelog-tool
   git-changelog --since "1 week ago"
   ```

2. **Generate and visualize changelog:**
   ```bash
   git-changelog --since "1 month ago" --format json --output changelog.json
   git-changelog-parser  # Opens web parser in browser
   ```

3. **Create releases with tags and changelogs:**
   ```bash
   # Auto-increment patch version and create tag
   git-tag-changelog --auto-increment patch
   
   # Create specific version tag
   git-tag-changelog 1.2.3 --push
   ```

## Command-Line Tools

### Shell Script (`git_changelog.sh`)

The shell script provides quick changelog generation with JSON and text output formats:

```bash
# Last week's changes
./git_changelog.sh --since "1 week ago"

# Last 20 commits in JSON format
./git_changelog.sh --max-count 20 --format json --output recent_changes.json

# JSON with timestamp for precise time analysis
./git_changelog.sh --max-count 20 --format json --include-time --output recent_changes_with_time.json

# Changes between two dates
./git_changelog.sh --since "2023-12-01" --until "2023-12-31" --format text

# Changes on a specific branch
./git_changelog.sh --branch develop --since "1 week ago"
```

#### Shell Script Options

- `-f, --format` - Output format: `json` or `text` (default: json)
- `-s, --since` - Show commits since date (e.g., "2023-01-01" or "1 week ago")
- `-u, --until` - Show commits until date
- `-b, --branch` - Branch to analyze (default: HEAD)
- `-n, --max-count` - Maximum number of commits to include
- `-o, --output` - Output file (default: stdout)
- `-t, --title` - Title for the changelog (default: Changelog)
- `--include-time` - Include Unix timestamp field in JSON output for precise time information

### Git Tag and Changelog Tool (`git_tag_changelog.sh`)

The git tag and changelog tool combines version tagging with changelog generation for automated release workflows:

```bash
# Auto-increment version and create tag with changelog
./git_tag_changelog.sh --auto-increment patch

# Create specific version tag
./git_tag_changelog.sh 1.2.3 --message "Major release" --push

# Dry run to see what would happen
./git_tag_changelog.sh --auto-increment minor --dry-run

# Use Python script for changelog generation
./git_tag_changelog.sh 2.0.0 --python --format markdown
```

#### Tag and Changelog Options

- `VERSION` - Version to tag (e.g., "1.2.3")
- `--auto-increment TYPE` - Auto-increment version: major, minor, patch  
- `-m, --message MSG` - Tag message (default: "Release VERSION")
- `-p, --prefix PREFIX` - Tag prefix (default: "v")
- `-f, --format FORMAT` - Changelog format: markdown, json, simple (default: markdown)
- `-o, --output FILE` - Changelog output file (default: CHANGELOG-VERSION.md)
- `--since-last-tag` - Generate changelog since last tag (default: true)
- `--dry-run` - Show what would be done without executing
- `--force` - Force tag creation (overwrite existing)
- `--lightweight` - Create lightweight tag instead of annotated
- `--push` - Push tag to origin after creation
- `--python` - Use Python script for changelog generation

#### Workflow

1. Validates git repository and working tree
2. Determines version (provided or auto-incremented)
3. Generates changelog since last tag or specified date
4. Creates git tag (annotated or lightweight)
5. Optionally pushes tag to remote
6. Updates package.json version if present

### Python Script (`git_changelog.py`)

The Python script offers additional output formats including markdown:

```bash
# Comprehensive markdown changelog
python3 git_changelog.py --since "1 month ago" --format markdown --title "Release v2.1.0"

# JSON output for web parser
python3 git_changelog.py --since "1 week ago" --format json --output changes.json

# JSON with timestamp for precise time analysis
python3 git_changelog.py --since "1 week ago" --format json --include-time --output changes_with_time.json

# Simple text list
python3 git_changelog.py --max-count 50 --format simple
```

#### Python Script Options

- `--since` - Show commits since date
- `--until` - Show commits until date
- `--branch` - Branch to analyze (default: HEAD)
- `--max-count` - Maximum number of commits
- `--format` - Output format: `markdown`, `simple`, or `json` (default: markdown)
- `--include-time` - Include Unix timestamp in JSON output for precise time information
- `--title` - Title for the changelog
- `--output` - Output file (default: stdout)

### Using the Makefile

```bash
# Quick changelog for last 10 commits
make changelog

# Weekly changelog
make changelog-week

# Monthly changelog  
make changelog-month

# Clean generated files
make clean
```

## Web-Based Parser

The `parser/` directory contains a comprehensive HTML-based tool for visualizing and analyzing changelog JSON files.

### Parser Features

- **Multiple File Support**: Load and merge multiple changelog JSON files simultaneously
- **Drag & Drop Interface**: Simply drag JSON file(s) onto the interface
- **Smart Merging**: Automatically merges commits by hash, avoiding duplicates
- **Advanced Filtering**: Multi-select filters for types, authors, branches, bugs, files, and date ranges
- **Enhanced Search**: Full-text search across commit messages with highlighting
- **Flexible Layout**: Group data by component or commit type
- **Bug Tracking**: Add, edit, and filter by bug IDs with inline editing
- **Commit Editing**: Edit commit messages inline with modification tracking
- **Export Functionality**: Export original data, modifications only, or both
- **Color-coded Types**: Visual indicators for different commit types
- **Responsive Design**: Works on different screen sizes

### Using the Parser

#### Quick Start (Global Installation)
```bash
# Generate JSON changelog
git-changelog --since "1 week ago" --format json --output changelog.json

# Open parser in browser
git-changelog-parser

# Drag and drop changelog.json into the parser
```

#### Manual Setup
1. Open `parser/index.html` in any modern web browser (or use `make parser`)
2. Either:
   - **Drag and drop** one or more JSON files onto the interface, OR
   - **Click "Choose File"** and select your JSON file(s)
3. Use the filtering and search tools to analyze your changelog data
4. Edit commit messages and bug IDs as needed
5. Export your data with modifications

### Parser Filtering

The parser provides comprehensive filtering options:

- **Commit Types**: Select specific commit types (fix, feat, style, refactor, other)
- **Authors**: Filter by commit authors
- **Branches**: Include or exclude specific branches
- **Bug IDs**: Filter by associated bug identifiers
- **Files**: Filter by modified file paths
- **Date Range**: Set start and end dates
- **Search**: Full-text search across all commit data

## Output Formats

### JSON Format (Shell Script)
- Machine-readable format with comprehensive commit data
- Includes branches, files, bug tracking, and extended metadata
- Perfect for use with the web parser
- Supports bug mention parsing (`@bug:type` format)
- Optional timestamp field with `--include-time` flag for precise time information

### Text Format (Shell Script)
- Human-readable format with emoji categorization
- Organized by commit type with clear sections
- Shows commit details and extended descriptions

### Markdown Format (Python Script)
- Categorizes commits by type with emoji headers
- Links to commit hashes for GitHub/GitLab integration
- Ready for release notes and documentation

### Simple Format (Python Script)
- Plain text with bullet points
- Shows commit hash, author, date
- Good for quick reviews

## Commit Categorization

Both command-line tools automatically categorize commits based on:

1. **Conventional Commits** format (`feat:`, `fix:`, etc.)
2. **Keyword detection** in commit messages  
3. **Fallback** to "Other Changes" category

### Categories Include:

- 🚀 **Features** (`feat:` or keywords: feat, add, implement)
- 🐛 **Bug Fixes** (`fix:` or keywords: fix, bug, patch)
- 📚 **Documentation** (`docs:` or keywords: doc, readme)
- 💄 **Styles** (`style:` or keywords: style, format)
- ♻️ **Code Refactoring** (`refactor:` or keywords: refactor, restructure)
- ⚡ **Performance** (`perf:` or keywords: perf, optimize)
- ✅ **Tests** (`test:` or keywords: test, spec)
- 🔧 **Chores** (`chore:` or keywords: chore, update, bump)

## Bug Tracking

The shell script supports bug mention parsing in commit messages:

- Use `@bug:type` format in commit messages
- Supported types: `fn` (functional), `log` (logical), `flow` (workflow), `unit` (unit-test), `bound` (boundary), `security`, `perf` (performance)
- Bug mentions are extracted and included in JSON output
- Web parser allows editing and filtering by bug IDs

## Expected JSON Structure

Both tools generate/expect JSON in this format:

> **Note**: The `timestamp` field is only included when using the `--include-time` flag. It contains a Unix timestamp (seconds since epoch) for precise time analysis and sorting.

```json
{
  "title": "Changelog (since date)",
  "generated_on": "2025-06-30 09:46:56",
  "commits": [
    {
      "type": "fix|feat|style|refactor|other",
      "component": "component-name",
      "commit_log": "Commit message description", 
      "commit_hash": "abc123def",
      "date": "2025-06-27",
      "timestamp": 1753203154,
      "author": "Author Name",
      "branches": ["branch1", "branch2"],
      "bugs": ["BUG-123", "BUG-456"],
      "files": ["path/to/file1.js", "path/to/file2.ts"],
      "body": "Optional extended commit message body"
    }
  ]
}
```

## Workflow Examples

### Automated Release Process
```bash
# Method 1: Global CLI (after npm install -g)
git-tag-changelog --auto-increment patch --push

# Method 2: Local CLI (via npx)
npx git-tag-changelog --auto-increment patch --push

# Method 3: Using shell script directly
./git_tag_changelog.sh --auto-increment patch --push

# Method 4: Using Makefile targets  
make release-patch    # Auto-increment patch version
make release-minor    # Auto-increment minor version  
make release-major    # Auto-increment major version

# Method 5: Custom version
make tag-and-changelog VERSION=2.1.0

# Method 6: Using Node.js API
const GitChangelogGenerator = require('git-changelog-generator');
const generator = new GitChangelogGenerator();

// Create tag and changelog
const result = await generator.createTagAndChangelog('1.2.3', {
  message: 'Release v1.2.3',
  push: true,
  format: 'markdown'
});

// Auto-increment version
const result = await generator.autoIncrementTag('patch', {
  dryRun: false,
  push: true
});
```

### Complete Workflow (Global Installation)
```bash
# 1. Generate changelog and open parser
git-changelog --since "1 week ago" --format json --output weekly.json
git-changelog-parser

# 2. In the parser: drag and drop weekly.json
# 3. Filter, edit, and analyze the data
# 4. Export the results

# Alternative: Everything in one flow
git-changelog --format json --output changelog.json && git-changelog-parser
```

### Weekly Team Report
```bash
# Generate JSON changelog for the week
git-changelog --since "last monday" --output weekly.json

# Open parser to analyze
git-changelog-parser
# Filter by author to see individual contributions
# Export summary for team meeting
```

### Release Notes
```bash
# Generate markdown changelog for release
python3 git_changelog.py --since "v1.0.0" --format markdown --title "Release v1.1.0" --output RELEASE_NOTES.md

# Generate detailed JSON for analysis
./git_changelog.sh --since "v1.0.0" --output release_data.json

# Use parser to review and edit commit messages before publishing
```

### Bug Analysis
```bash
# Generate JSON with bug tracking
./git_changelog.sh --since "1 month ago" --output bugs.json

# Use parser to:
# - Filter by bug types
# - Add missing bug IDs
# - Export clean dataset
```

## Tips

- Use `--since "last monday"` for weekly reports
- Use `--since "1 month ago"` for release notes  
- Combine command-line generation with web parser analysis
- Use JSON format for comprehensive data, markdown for documentation
- The web parser works great for collaborative changelog review
- Export parser modifications to maintain changelog quality

## Browser Compatibility

The web parser works in all modern browsers supporting:
- ES6 Classes
- FileReader API  
- Drag and Drop API
- CSS Grid/Flexbox
- Local Storage

## Dependencies

- **Command-line tools**: No external dependencies (bash, python3, git)
- **Web parser**: No external libraries (vanilla HTML/CSS/JavaScript)

## Development

This project was developed with AI assistance using Claude (Anthropic), which helped design and implement the tag and changelog automation features, comprehensive testing suite, and documentation. The AI provided guidance on best practices for shell scripting, Node.js APIs, and project structure while maintaining the original vision and requirements of the git changelog generator. 