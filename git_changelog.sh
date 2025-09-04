#!/bin/bash

# Git Changelog Generator - Shell Script Version
# Simple tool to create formatted lists of changes from git log

set -e

# Default values
FORMAT="json"
SINCE=""
UNTIL=""
BRANCH="HEAD"
MAX_COUNT=""
OUTPUT=""
TITLE="Changelog"
INCLUDE_TIME=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Utility function to clean and format text for different output formats
clean_text() {
    local text="$1"
    local format="$2"
    
    case "$format" in
        "json")
            # For JSON, escape all special characters including newlines
            echo "$text" | sed 's/\\/\\\\/g; s/"/\\"/g; s/\t/\\t/g; s/\r/\\r/g; s/\n/\\n/g' | tr '\n' ' ' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
            ;;
        *)
            echo "$text"
            ;;
    esac
}

# Help function
show_help() {
    cat << EOF
Git Changelog Generator

Usage: $0 [OPTIONS]

OPTIONS:
    -f, --format FORMAT     Output format: json, text (default: json)
    -s, --since DATE        Show commits since date (e.g., "2023-01-01" or "1 week ago")
    -u, --until DATE        Show commits until date
    -b, --branch BRANCH     Branch to analyze (default: HEAD)
    -n, --max-count NUM     Maximum number of commits to include
    -o, --output FILE       Output file (default: stdout)
    -t, --title TITLE       Title for the changelog (default: Changelog)
    --include-time         Include commit time in the output
    -h, --help             Show this help message

EXAMPLES:
    $0 --since "1 week ago"
    $0 --since "2023-01-01" --output CHANGELOG.json
    $0 --branch develop --max-count 20 --format text
    $0 --since "last monday" --until "last friday" --format text
    $0 --since "1 week ago" --output changelog.json

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--format)
            FORMAT="$2"
            if [[ "$FORMAT" != "json" && "$FORMAT" != "text" ]]; then
                echo "Error: Format must be 'json' or 'text'"
                exit 1
            fi
            shift 2
            ;;
        -s|--since)
            SINCE="$2"
            shift 2
            ;;
        -u|--until)
            UNTIL="$2"
            shift 2
            ;;
        -b|--branch)
            BRANCH="$2"
            shift 2
            ;;
        -n|--max-count)
            MAX_COUNT="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT="$2"
            shift 2
            ;;
        -t|--title)
            TITLE="$2"
            shift 2
            ;;
        --include-time)
            INCLUDE_TIME=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Build git log command to get just the commit hashes first
HASH_CMD="git log --pretty=format:'%h'"

if [[ -n "$SINCE" ]]; then
    HASH_CMD="$HASH_CMD --since='$SINCE'"
fi

if [[ -n "$UNTIL" ]]; then
    HASH_CMD="$HASH_CMD --until='$UNTIL'"
fi

if [[ -n "$MAX_COUNT" ]]; then
    HASH_CMD="$HASH_CMD -n $MAX_COUNT"
fi

HASH_CMD="$HASH_CMD $BRANCH"

# Function to gather commit data (shared between formats)
gather_commit_data() {
    local commit_hashes=$(eval "$HASH_CMD")
    
    # Temporary files to store commits by type
    local temp_dir=$(mktemp -d)
    
    # Process each commit individually
    while IFS= read -r hash; do
        if [[ -n "$hash" ]]; then
            # Get commit details for this specific hash
            local subject=$(git log --format='%s' -n 1 "$hash")
            local author=$(git log --format='%an' -n 1 "$hash")
            local body=$(git log --format='%b' -n 1 "$hash")
            local date=""
            
            if [[ "$INCLUDE_TIME" == "true" ]]; then
                date=$(git log --format='%ad' --date=iso -n 1 "$hash")
            else
                date=$(git log --format='%ad' --date=short -n 1 "$hash")
            fi
            
            if [[ -n "$hash" ]]; then
                # Determine commit type and extract component and clean subject
                local commit_type="other"
                local component=""
                local clean_subject="$subject"
                local subject_lower=$(echo "$subject" | tr '[:upper:]' '[:lower:]')
                
                # Extract component from conventional commit format: type(component): message
                if [[ $subject == *"("*"): "* ]]; then
                    # Extract component using parameter expansion
                    temp_subject="${subject#*\(}"  # Remove everything up to first (
                    component="${temp_subject%%\)*}"  # Remove everything from first ) onwards
                    clean_subject=$(echo "$subject" | sed 's/^[a-zA-Z]*([^)]*): *//')
                else
                    # Clean up subject for non-component commits
                    if [[ $subject =~ ^[a-zA-Z]+:[[:space:]]* ]]; then
                        clean_subject=$(echo "$subject" | sed 's/^[a-zA-Z]*: *//')
                    fi
                fi
                
                if [[ $subject_lower =~ ^feat[:()] ]]; then
                    commit_type="feat"
                elif [[ $subject_lower =~ ^fix[:()] ]] || [[ $subject_lower =~ bug|patch ]]; then
                    commit_type="fix"
                elif [[ $subject_lower =~ ^docs?[:()] ]]; then
                    commit_type="docs"
                elif [[ $subject_lower =~ ^style[:()] ]]; then
                    commit_type="style"
                elif [[ $subject_lower =~ ^refactor[:()] ]]; then
                    commit_type="refactor"
                elif [[ $subject_lower =~ ^perf[:()] ]]; then
                    commit_type="perf"
                elif [[ $subject_lower =~ ^test[:()] ]]; then
                    commit_type="test"
                elif [[ $subject_lower =~ ^chore[:()] ]]; then
                    commit_type="chore"
                fi
                
                # Get branch information for this commit
                local branches=""
                local branch_list=$(git branch -a --contains "$hash" 2>/dev/null | grep -v "^\*" | sed 's/^[[:space:]]*//' | sed 's/remotes\/origin\///g' | grep -v "HEAD" | sort -u | head -5)
                if [[ -n "$branch_list" ]]; then
                    branches=$(echo "$branch_list" | tr '\n' ',' | sed 's/,$//')
                else
                    local branch_name=$(git name-rev --name-only "$hash" 2>/dev/null | sed 's/~.*$//' | sed 's/\^.*$//')
                    if [[ -n "$branch_name" && "$branch_name" != "undefined" ]]; then
                        branches="$branch_name"
                    fi
                fi
                
                # Get list of files changed in this commit
                local changed_files=$(git diff-tree --no-commit-id --name-only -r "$hash" 2>/dev/null | sort | tr '\n' ',' | sed 's/,$//')
                
                # Parse bug mentions
                local bug_types=$(parse_bug_mentions "$subject $body")
                
                # Clean body text for storage (remove newlines and pipes)
                local clean_body=$(echo "$body" | tr '\n' ' ' | sed 's/|/;/g' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                
                # Store commit data in appropriate file
                local commit_data="$hash|$clean_subject|$author|$date|$component|$branches|$changed_files|$bug_types|$clean_body"
                echo "$commit_data" >> "$temp_dir/$commit_type"
            fi
        fi
    done <<< "$commit_hashes"
    
    # Print data for the calling function to process
    for type in feat fix docs style refactor perf test chore other; do
        if [[ -f "$temp_dir/$type" ]]; then
            echo "TYPE:$type"
            cat "$temp_dir/$type"
            echo "ENDTYPE:$type"
        fi
    done
    
    # Clean up temporary files
    rm -rf "$temp_dir"
}

# Function to generate text format
generate_text() {
    local title_with_period="$TITLE"
    if [[ -n "$SINCE" ]]; then
        title_with_period="$TITLE (since $SINCE)"
    fi
    
    echo "$title_with_period"
    echo "Generated on: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    # Get commit data
    local commit_data=$(gather_commit_data)
    
    # Process data by commit type
    local current_type=""
    local in_type_section=false
    
    while IFS= read -r line; do
        if [[ $line =~ ^TYPE: ]]; then
            current_type="${line#TYPE:}"
            in_type_section=true
            
            # Print section header
            case "$current_type" in
                "feat") echo "## 🚀 Features" ;;
                "fix") echo "## 🐛 Bug Fixes" ;;
                "docs") echo "## 📚 Documentation" ;;
                "style") echo "## 💄 Style Changes" ;;
                "refactor") echo "## ♻️ Code Refactoring" ;;
                "perf") echo "## ⚡ Performance Improvements" ;;
                "test") echo "## 🧪 Tests" ;;
                "chore") echo "## 🔧 Chores" ;;
                "other") echo "## 📝 Other Changes" ;;
            esac
            echo ""
        elif [[ $line =~ ^ENDTYPE: ]]; then
            in_type_section=false
            current_type=""
        elif [[ "$in_type_section" == "true" && -n "$line" ]]; then
            # Parse commit data
            IFS='|' read -r hash subject author date component branches files bug_types body <<< "$line"
            
            # Format commit entry
            if [[ -n "$component" ]]; then
                echo "- **$component**: $subject ($hash)"
            else
                echo "- $subject ($hash)"
            fi
            
            # Show body if it exists and is not just whitespace
            if [[ -n "$body" && "$body" != " " && "$body" != "" ]]; then
                echo ""
                echo "  📝 $body"
            fi
            
            echo ""
        fi
    done <<< "$commit_data"
}

# Function to generate JSON format
generate_json() {
    local title_with_period="$TITLE"
    if [[ -n "$SINCE" ]]; then
        title_with_period="$TITLE (since $SINCE)"
    fi
    
    # Start JSON structure
    echo "{"
    echo "  \"title\": \"$title_with_period\","
    echo "  \"generated_on\": \"$(date '+%Y-%m-%d %H:%M:%S')\","
    echo "  \"commits\": ["
    
    local first_commit=true
    
    # Get list of commit hashes first
    local commit_hashes=$(eval "$HASH_CMD")
    
    # Process each commit individually
    while IFS= read -r hash; do
        if [[ -n "$hash" ]]; then
            # Get commit details for this specific hash
            local subject=$(git log --format='%s' -n 1 "$hash")
            local author=$(git log --format='%an' -n 1 "$hash")
            local body=$(git log --format='%b' -n 1 "$hash")
            local date=""
            local timestamp=""
            
            date=$(git log --format='%ad' --date=short -n 1 "$hash")
            if [[ "$INCLUDE_TIME" == "true" ]]; then
                timestamp=$(git log --format='%at' -n 1 "$hash")
            fi
            
            if [[ -n "$hash" ]]; then
                # Add comma separator for all but first commit
                if [[ "$first_commit" == "false" ]]; then
                    echo ","
                fi
                first_commit=false
                
                # Determine commit type and extract component and clean subject
                local commit_type="other"
                local component=""
                local clean_subject="$subject"
                local subject_lower=$(echo "$subject" | tr '[:upper:]' '[:lower:]')
                
                # Extract component from conventional commit format: type(component): message
                if [[ $subject == *"("*"): "* ]]; then
                    # Extract component using parameter expansion
                    temp_subject="${subject#*\(}"  # Remove everything up to first (
                    component="${temp_subject%%\)*}"  # Remove everything from first ) onwards
                    clean_subject=$(echo "$subject" | sed 's/^[a-zA-Z]*([^)]*): *//')
                else
                    # Clean up subject for non-component commits
                    if [[ $subject =~ ^[a-zA-Z]+:[[:space:]]* ]]; then
                        clean_subject=$(echo "$subject" | sed 's/^[a-zA-Z]*: *//')
                    fi
                fi
                
                if [[ $subject_lower =~ ^feat[:()] ]]; then
                    commit_type="feat"
                elif [[ $subject_lower =~ ^fix[:()] ]] || [[ $subject_lower =~ bug|patch ]]; then
                    commit_type="fix"
                elif [[ $subject_lower =~ ^docs?[:()] ]]; then
                    commit_type="docs"
                elif [[ $subject_lower =~ ^style[:()] ]]; then
                    commit_type="style"
                elif [[ $subject_lower =~ ^refactor[:()] ]]; then
                    commit_type="refactor"
                elif [[ $subject_lower =~ ^perf[:()] ]]; then
                    commit_type="perf"
                elif [[ $subject_lower =~ ^test[:()] ]]; then
                    commit_type="test"
                elif [[ $subject_lower =~ ^chore[:()] ]]; then
                    commit_type="chore"
                fi
                
                # Get branch information for this commit
                local branches=""
                # Try to get branches that contain this commit
                local branch_list=$(git branch -a --contains "$hash" 2>/dev/null | grep -v "^\*" | sed 's/^[[:space:]]*//' | sed 's/remotes\/origin\///g' | grep -v "HEAD" | sort -u | head -5)
                if [[ -n "$branch_list" ]]; then
                    branches=$(echo "$branch_list" | tr '\n' ',' | sed 's/,$//')
                else
                    # Fallback: try to get the branch from git name-rev
                    local branch_name=$(git name-rev --name-only "$hash" 2>/dev/null | sed 's/~.*$//' | sed 's/\^.*$//')
                    if [[ -n "$branch_name" && "$branch_name" != "undefined" ]]; then
                        branches="$branch_name"
                    fi
                fi
                
                # Get list of files changed in this commit
                local changed_files=$(git diff-tree --no-commit-id --name-only -r "$hash" 2>/dev/null | sort)
                local files_array=$(convert_files_to_json_array "$changed_files")
                
                # Clean text for JSON format
                local escaped_subject=$(clean_text "$clean_subject" "json")
                local escaped_author=$(clean_text "$author" "json")
                local escaped_component=$(clean_text "$component" "json")
                local escaped_body=$(clean_text "$body" "json")
                
                echo -n "    {"
                echo -n "\"type\": \"$commit_type\", "
                if [[ -n "$component" ]]; then
                    echo -n "\"component\": \"$escaped_component\", "
                fi
                echo -n "\"commit_log\": \"$escaped_subject\", "
                echo -n "\"commit_hash\": \"$hash\", "
                echo -n "\"date\": \"$date\", "
                if [[ "$INCLUDE_TIME" == "true" && -n "$timestamp" ]]; then
                    echo -n "\"timestamp\": $timestamp, "
                fi
                echo -n "\"author\": \"$escaped_author\""
                local branches_array=$(convert_branches_to_json_array "$branches")
                if [[ -n "$branches_array" ]]; then
                    echo -n ", \"branches\": $branches_array"
                fi
                # Add changed files array
                if [[ -n "$files_array" ]]; then
                    echo -n ", \"files\": $files_array"
                fi
                # Parse mention tags from commit message and body
                local bug_types=$(parse_bug_mentions "$subject $body")
                if [[ -n "$bug_types" ]]; then
                    echo -n ", \"bug\": $bug_types"
                fi
                if [[ -n "$escaped_body" && "$escaped_body" != " " ]]; then
                    echo -n ", \"body\": \"$escaped_body\""
                fi
                echo -n "}"
            fi
        fi
    done <<< "$commit_hashes"
    
    echo ""
    echo "  ]"
    echo "}"
}

# Function to convert comma-separated branches to JSON array
convert_branches_to_json_array() {
    local branches="$1"
    local branches_array=""
    if [[ -n "$branches" ]]; then
        # Convert comma-separated string to JSON array
        local branch_json=""
        IFS=',' read -ra BRANCH_ARRAY <<< "$branches"
        for branch in "${BRANCH_ARRAY[@]}"; do
            # Trim whitespace and clean text for JSON
            branch=$(echo "$branch" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
            local escaped_branch=$(clean_text "$branch" "json")
            if [[ -z "$branch_json" ]]; then
                branch_json="\"$escaped_branch\""
            else
                branch_json="$branch_json, \"$escaped_branch\""
            fi
        done
        if [[ -n "$branch_json" ]]; then
            branches_array="[$branch_json]"
        fi
    fi
    echo "$branches_array"
}

# Function to convert newline-separated files to JSON array
convert_files_to_json_array() {
    local files="$1"
    local files_array=""
    if [[ -n "$files" ]]; then
        # Convert newline-separated string to JSON array
        local file_json=""
        while IFS= read -r file; do
            if [[ -n "$file" ]]; then
                # Trim whitespace and escape for JSON
                file=$(echo "$file" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
                local escaped_file=$(clean_text "$file" "json")
                if [[ -z "$file_json" ]]; then
                    file_json="\"$escaped_file\""
                else
                    file_json="$file_json, \"$escaped_file\""
                fi
            fi
        done <<< "$files"
        if [[ -n "$file_json" ]]; then
            files_array="[$file_json]"
        fi
    fi
    echo "$files_array"
}

# Function to parse bug mention tags
parse_bug_mentions() {
    local message="$1"
    local bug_types=""
    # Look for @bug:type patterns where type is one of: fn, log, flow, unit, bound, security, perf
    local bug_mentions=$(echo "$message" | grep -oE '@bug:(fn|functional|log|logical|flow|workflow|unit|unit-test|bound|boundary|security|perf|performance)' | sed 's/@bug://' | sort -u)
        if [[ -n "$bug_mentions" ]]; then
        # Convert to JSON array format
        local bug_array=""
        while IFS= read -r bug_type; do
            if [[ -n "$bug_type" ]]; then
                case $bug_type in
                    "fn") bug_name="functional" ;;
                    "log") bug_name="logical" ;;
                    "flow") bug_name="workflow" ;;
                    "unit") bug_name="unit-test" ;;
                    "bound") bug_name="boundary" ;;
                    "security") bug_name="security" ;;
                    "perf") bug_name="performance" ;;
                    *) bug_name="$bug_type" ;;
                esac
                if [[ -z "$bug_array" ]]; then
                    bug_array="\"$bug_name\""
                else
                    bug_array="$bug_array, \"$bug_name\""
                fi
            fi
        done <<< "$bug_mentions"
        if [[ -n "$bug_array" ]]; then
            bug_types="[$bug_array]"
        fi
    fi
    echo "$bug_types"
}

# Generate output based on format
if [[ "$FORMAT" == "text" ]]; then
    if [[ -n "$OUTPUT" ]]; then
        generate_text > "$OUTPUT"
        echo -e "${GREEN}Changelog written to $OUTPUT${NC}"
    else
        generate_text
    fi
else
    # Default to JSON format
    if [[ -n "$OUTPUT" ]]; then
        generate_json > "$OUTPUT"
        echo -e "${GREEN}Changelog written to $OUTPUT${NC}"
    else
        generate_json
    fi
fi