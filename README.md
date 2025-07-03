# Git Changelog Generator

A comprehensive collection of tools to generate, format, and visualize changelogs from git commit history. This toolkit includes command-line generators and an advanced web-based parser for analyzing changelog data.

## Components

- `git_changelog.py` - Full-featured Python script with advanced categorization
- `git_changelog.sh` - Lightweight shell script for quick usage  
- `Makefile` - Convenient targets for common operations
- `parser/` - Web-based JSON parser and visualization tool

## Quick Start

1. Make scripts executable:
   ```bash
   make install
   ```

2. Generate a simple changelog:
   ```bash
   ./git_changelog.sh --since "1 week ago"
   ```

3. Generate a JSON changelog and visualize it:
   ```bash
   ./git_changelog.sh --since "1 month ago" --format json --output changelog.json
   # Then open parser/index.html in your browser and load changelog.json
   ```

## Command-Line Tools

### Shell Script (`git_changelog.sh`)

The shell script provides quick changelog generation with JSON and text output formats:

```bash
# Last week's changes
./git_changelog.sh --since "1 week ago"

# Last 20 commits in JSON format
./git_changelog.sh --max-count 20 --format json --output recent_changes.json

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
- `--include-time` - Include commit time in the output

### Python Script (`git_changelog.py`)

The Python script offers additional output formats including markdown:

```bash
# Comprehensive markdown changelog
python3 git_changelog.py --since "1 month ago" --format markdown --title "Release v2.1.0"

# JSON output for web parser
python3 git_changelog.py --since "1 week ago" --format json --output changes.json

# Simple text list
python3 git_changelog.py --max-count 50 --format simple
```

#### Python Script Options

- `--since` - Show commits since date
- `--until` - Show commits until date
- `--branch` - Branch to analyze (default: HEAD)
- `--max-count` - Maximum number of commits
- `--format` - Output format: `markdown`, `simple`, or `json` (default: markdown)
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

1. Open `parser/index.html` in any modern web browser
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
      "date": "2025-06-27 14:03:28 +0200",
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

### Weekly Team Report
```bash
# Generate JSON changelog for the week
./git_changelog.sh --since "last monday" --output weekly.json

# Open parser/index.html and load weekly.json
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