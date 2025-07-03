#!/usr/bin/env python3

"""
Git Changelog Generator

A utility tool to create formatted lists of changes from git log.
Supports various output formats and filtering options.
"""

import argparse
import subprocess
import sys
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional


class GitChangelogGenerator:
    def __init__(self):
        self.commit_types = {
            'feat': 'Features',
            'fix': 'Bug Fixes',
            'docs': 'Documentation',
            'style': 'Styles',
            'refactor': 'Code Refactoring',
            'perf': 'Performance Improvements',
            'test': 'Tests',
            'chore': 'Chores',
            'ci': 'CI/CD',
            'build': 'Build System',
            'revert': 'Reverts'
        }

    def run_git_command(self, command: List[str]) -> str:
        """Run a git command and return the output."""
        try:
            result = subprocess.run(
                ['git'] + command,
                capture_output=True,
                text=True,
                check=True
            )
            return result.stdout.strip()
        except subprocess.CalledProcessError as e:
            print(f"Error running git command: {e}", file=sys.stderr)
            sys.exit(1)

    def get_commits(self, since: Optional[str] = None, until: Optional[str] = None, 
                   branch: str = 'HEAD', max_count: Optional[int] = None) -> List[Dict]:
        """Get commits from git log with specified filters."""
        cmd = ['log', '--pretty=format:%H|%s|%an|%ad|%b', '--date=short']
        
        if since:
            cmd.extend(['--since', since])
        if until:
            cmd.extend(['--until', until])
        if max_count:
            cmd.extend(['-n', str(max_count)])
        
        cmd.append(branch)
        
        output = self.run_git_command(cmd)
        commits = []
        
        current_commit = None
        for line in output.split('\n'):
            if '|' in line and len(line.split('|')) >= 4:
                if current_commit:
                    commits.append(current_commit)
                
                parts = line.split('|', 4)
                current_commit = {
                    'hash': parts[0],
                    'subject': parts[1],
                    'author': parts[2],
                    'date': parts[3],
                    'body': parts[4] if len(parts) > 4 else ''
                }
            elif current_commit and line.strip():
                current_commit['body'] += '\n' + line
        
        if current_commit:
            commits.append(current_commit)
            
        return commits

    def categorize_commit(self, commit: Dict) -> str:
        """Categorize a commit based on conventional commits or keywords."""
        subject = commit['subject'].lower()
        
        # Check for conventional commits format
        match = re.match(r'^(\w+)(\(.+\))?\s*:\s*(.+)', subject)
        if match:
            commit_type = match.group(1)
            if commit_type in self.commit_types:
                return commit_type
        
        # Fallback to keyword detection
        if any(keyword in subject for keyword in ['fix', 'bug', 'patch']):
            return 'fix'
        elif any(keyword in subject for keyword in ['feat', 'add', 'implement']):
            return 'feat'
        elif any(keyword in subject for keyword in ['doc', 'readme']):
            return 'docs'
        elif any(keyword in subject for keyword in ['test', 'spec']):
            return 'test'
        elif any(keyword in subject for keyword in ['refactor', 'restructure']):
            return 'refactor'
        elif any(keyword in subject for keyword in ['style', 'format']):
            return 'style'
        elif any(keyword in subject for keyword in ['perf', 'optimize']):
            return 'perf'
        elif any(keyword in subject for keyword in ['chore', 'update', 'bump']):
            return 'chore'
        else:
            return 'other'

    def generate_markdown(self, commits: List[Dict], title: str = "Changelog") -> str:
        """Generate a markdown changelog."""
        categorized = {}
        
        for commit in commits:
            category = self.categorize_commit(commit)
            if category not in categorized:
                categorized[category] = []
            categorized[category].append(commit)
        
        markdown = f"# {title}\n\n"
        markdown += f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        
        # Order categories by importance
        category_order = ['feat', 'fix', 'perf', 'refactor', 'docs', 'style', 'test', 'chore', 'ci', 'build', 'revert', 'other']
        
        for category in category_order:
            if category in categorized:
                category_name = self.commit_types.get(category, category.title())
                markdown += f"## {category_name}\n\n"
                
                for commit in categorized[category]:
                    # Clean up the subject
                    subject = commit['subject']
                    if ':' in subject:
                        subject = subject.split(':', 1)[1].strip()
                    
                    markdown += f"- {subject} ([{commit['hash'][:8]}](../../commit/{commit['hash']}))\n"
                    if commit['body'].strip():
                        # Add body as indented text if it exists
                        body_lines = [line.strip() for line in commit['body'].split('\n') if line.strip()]
                        if body_lines:
                            markdown += f"  *{body_lines[0]}*\n"
                
                markdown += "\n"
        
        return markdown

    def generate_simple_list(self, commits: List[Dict]) -> str:
        """Generate a simple text list of changes."""
        output = f"Changes ({len(commits)} commits)\n"
        output += "=" * 50 + "\n\n"
        
        for commit in commits:
            output += f"• {commit['subject']}\n"
            output += f"  Author: {commit['author']} | Date: {commit['date']} | Hash: {commit['hash'][:8]}\n"
            if commit['body'].strip():
                body_lines = [line.strip() for line in commit['body'].split('\n') if line.strip()]
                if body_lines:
                    output += f"  {body_lines[0]}\n"
            output += "\n"
        
        return output

    def generate_json(self, commits: List[Dict]) -> str:
        """Generate JSON output of commits."""
        import json
        return json.dumps(commits, indent=2)


def main():
    parser = argparse.ArgumentParser(description='Generate changelog from git log')
    parser.add_argument('--since', help='Show commits since date (e.g., "2023-01-01" or "1 week ago")')
    parser.add_argument('--until', help='Show commits until date')
    parser.add_argument('--branch', default='HEAD', help='Branch to analyze (default: HEAD)')
    parser.add_argument('--max-count', type=int, help='Maximum number of commits to include')
    parser.add_argument('--format', choices=['markdown', 'simple', 'json'], default='markdown',
                       help='Output format (default: markdown)')
    parser.add_argument('--title', default='Changelog', help='Title for the changelog')
    parser.add_argument('--output', help='Output file (default: stdout)')
    
    args = parser.parse_args()
    
    generator = GitChangelogGenerator()
    
    # Get commits
    commits = generator.get_commits(
        since=args.since,
        until=args.until,
        branch=args.branch,
        max_count=args.max_count
    )
    
    if not commits:
        print("No commits found matching the criteria.", file=sys.stderr)
        sys.exit(1)
    
    # Generate output
    if args.format == 'markdown':
        output = generator.generate_markdown(commits, args.title)
    elif args.format == 'simple':
        output = generator.generate_simple_list(commits)
    elif args.format == 'json':
        output = generator.generate_json(commits)
    
    # Write output
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            f.write(output)
        print(f"Changelog written to {args.output}")
    else:
        print(output)


if __name__ == '__main__':
    main()