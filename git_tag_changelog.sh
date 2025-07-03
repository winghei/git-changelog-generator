#!/bin/bash
# Git Tag and Changelog Generator
# Creates git tags and generates changelogs for releases

set -e

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_CHANGELOG_SH="$SCRIPT_DIR/git_changelog.sh"
GIT_CHANGELOG_PY="$SCRIPT_DIR/git_changelog.py"

# Default values
VERSION=""
TAG_PREFIX="v"
MESSAGE=""
CHANGELOG_FORMAT="markdown"
CHANGELOG_FILE=""
AUTO_INCREMENT=""
DRY_RUN=false
FORCE=false
ANNOTATED=true
PUSH_TAG=false
USE_PYTHON=false
SINCE_LAST_TAG=true
CONVENTIONAL_COMMITS=true
CHANGELOG_ARGS=()

# Version increment types (removed associative array for compatibility)

# Function to show help
show_help() {
    cat << EOF
Git Tag and Changelog Generator

USAGE:
    $0 [OPTIONS] [VERSION]

DESCRIPTION:
    Creates git tags and generates changelogs for releases. Can automatically
    increment versions, generate changelogs since last tag, and push to remote.

POSITIONAL ARGUMENTS:
    VERSION               Version to tag (e.g., "1.2.3"). If not provided,
                         use --auto-increment to bump existing version.

OPTIONS:
    -h, --help           Show this help message
    -m, --message MSG    Tag message (default: "Release VERSION")
    -p, --prefix PREFIX  Tag prefix (default: "v")
    -f, --format FORMAT  Changelog format: markdown, json, simple (default: markdown)
    -o, --output FILE    Changelog output file (default: CHANGELOG-VERSION.md)
    --auto-increment TYPE Auto-increment version: major, minor, patch
    --since-last-tag     Generate changelog since last tag (default: true)
    --dry-run           Show what would be done without executing
    --force             Force tag creation (overwrite existing)
    --lightweight       Create lightweight tag instead of annotated
    --push              Push tag to origin after creation
    --python            Use Python script for changelog generation
    --no-conventional   Disable conventional commit parsing
    
EXAMPLES:
    # Create tag v1.2.3 with changelog
    $0 1.2.3
    
    # Auto-increment patch version and create tag
    $0 --auto-increment patch
    
    # Create tag with custom message and push
    $0 2.0.0 --message "Major release with breaking changes" --push
    
    # Generate changelog in JSON format
    $0 1.5.0 --format json --output release-1.5.0.json
    
    # Dry run to see what would happen
    $0 --auto-increment minor --dry-run
    
    # Create lightweight tag and use Python script
    $0 1.1.0 --lightweight --python
    
    # Generate changelog since specific date instead of last tag
    $0 1.3.0 --no-since-last-tag --since "2024-01-01"

WORKFLOW:
    1. Validates git repository and working tree
    2. Determines version (provided or auto-incremented)
    3. Generates changelog since last tag or specified date
    4. Creates git tag (annotated or lightweight)
    5. Optionally pushes tag to remote
    6. Updates package.json version if present

EOF
}

# Function to log messages
log() {
    echo "🏷️  $1" >&2
}

log_error() {
    echo "❌ Error: $1" >&2
}

log_success() {
    echo "✅ $1" >&2
}

log_info() {
    echo "ℹ️  $1" >&2
}

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        log_error "Not in a git repository"
        exit 1
    fi
}

# Function to check if working tree is clean
check_working_tree() {
    if [[ "$FORCE" == "false" ]] && ! git diff-index --quiet HEAD --; then
        log_error "Working tree is not clean. Commit your changes or use --force"
        exit 1
    fi
}

# Function to get the latest tag
get_latest_tag() {
    git describe --tags --abbrev=0 2>/dev/null || echo ""
}

# Function to parse version from tag
parse_version_from_tag() {
    local tag="$1"
    echo "$tag" | sed "s/^$TAG_PREFIX//"
}

# Function to increment version
increment_version() {
    local version="$1"
    local increment_type="$2"
    
    # Split version into parts
    IFS='.' read -ra PARTS <<< "$version"
    local major="${PARTS[0]:-0}"
    local minor="${PARTS[1]:-0}"
    local patch="${PARTS[2]:-0}"
    
    case "$increment_type" in
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "patch")
            patch=$((patch + 1))
            ;;
        *)
            log_error "Invalid increment type: $increment_type"
            exit 1
            ;;
    esac
    
    echo "$major.$minor.$patch"
}

# Function to validate version format
validate_version() {
    local version="$1"
    if ! [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        log_error "Invalid version format: $version (expected: X.Y.Z)"
        exit 1
    fi
}

# Function to check if tag exists
tag_exists() {
    local tag="$1"
    git rev-parse --verify "refs/tags/$tag" >/dev/null 2>&1
}

# Function to determine version
determine_version() {
    if [[ -n "$VERSION" ]]; then
        validate_version "$VERSION"
        echo "$VERSION"
    elif [[ -n "$AUTO_INCREMENT" ]]; then
        local latest_tag=$(get_latest_tag)
        if [[ -z "$latest_tag" ]]; then
            log_info "No existing tags found, starting with 0.0.0"
            latest_tag="0.0.0"
        else
            latest_tag=$(parse_version_from_tag "$latest_tag")
        fi
        
        local new_version=$(increment_version "$latest_tag" "$AUTO_INCREMENT")
        log_info "Auto-incrementing $latest_tag → $new_version ($AUTO_INCREMENT)"
        echo "$new_version"
    else
        log_error "Version required. Provide VERSION or use --auto-increment"
        exit 1
    fi
}

# Function to generate changelog
generate_changelog() {
    local version="$1"
    local output_file="$2"
    
    # Determine changelog range
    local changelog_args=()
    
    if [[ "$SINCE_LAST_TAG" == "true" ]]; then
        local latest_tag=$(get_latest_tag)
        if [[ -n "$latest_tag" ]]; then
            changelog_args+=("--since" "$latest_tag")
            log_info "Generating changelog since last tag: $latest_tag"
        else
            log_info "No previous tags found, generating full history"
        fi
    fi
    
    # Add format and output
    changelog_args+=("--format" "$CHANGELOG_FORMAT")
    if [[ -n "$output_file" ]]; then
        changelog_args+=("--output" "$output_file")
    fi
    
    # Add title
    changelog_args+=("--title" "Release $version")
    
    # Generate changelog
    if [[ "$USE_PYTHON" == "true" ]]; then
        log "Generating changelog using Python script..."
        if [[ "$DRY_RUN" == "false" ]]; then
            python3 "$GIT_CHANGELOG_PY" "${changelog_args[@]}"
        else
            log_info "Would run: python3 $GIT_CHANGELOG_PY ${changelog_args[*]}"
        fi
    else
        log "Generating changelog using shell script..."
        if [[ "$DRY_RUN" == "false" ]]; then
            bash "$GIT_CHANGELOG_SH" "${changelog_args[@]}"
        else
            log_info "Would run: bash $GIT_CHANGELOG_SH ${changelog_args[*]}"
        fi
    fi
}

# Function to create git tag
create_tag() {
    local version="$1"
    local tag_name="${TAG_PREFIX}${version}"
    local tag_message="$MESSAGE"
    
    if [[ -z "$tag_message" ]]; then
        tag_message="Release $version"
    fi
    
    # Check if tag already exists
    if tag_exists "$tag_name" && [[ "$FORCE" == "false" ]]; then
        log_error "Tag $tag_name already exists. Use --force to overwrite"
        exit 1
    fi
    
    # Create tag
    local tag_args=()
    if [[ "$ANNOTATED" == "true" ]]; then
        tag_args+=("-a" "$tag_name" "-m" "$tag_message")
    else
        tag_args+=("$tag_name")
    fi
    
    if [[ "$FORCE" == "true" ]]; then
        tag_args+=("-f")
    fi
    
    log "Creating tag: $tag_name"
    if [[ "$DRY_RUN" == "false" ]]; then
        git tag "${tag_args[@]}"
        log_success "Tag $tag_name created"
    else
        log_info "Would run: git tag ${tag_args[*]}"
    fi
}

# Function to push tag
push_tag() {
    local version="$1"
    local tag_name="${TAG_PREFIX}${version}"
    
    log "Pushing tag to origin..."
    if [[ "$DRY_RUN" == "false" ]]; then
        if git remote get-url origin >/dev/null 2>&1; then
            git push origin "$tag_name"
            log_success "Tag $tag_name pushed to origin"
        else
            log_error "No origin remote found"
            exit 1
        fi
    else
        log_info "Would run: git push origin $tag_name"
    fi
}

# Function to update package.json version
update_package_json() {
    local version="$1"
    local package_file="package.json"
    
    if [[ -f "$package_file" ]]; then
        log "Updating package.json version to $version"
        if [[ "$DRY_RUN" == "false" ]]; then
            # Use a simple sed replacement for version
            if command -v jq >/dev/null 2>&1; then
                # Use jq if available for safer JSON editing
                jq --arg version "$version" '.version = $version' "$package_file" > "${package_file}.tmp" \
                    && mv "${package_file}.tmp" "$package_file"
            else
                # Fallback to sed
                sed -i.bak "s/\"version\": \"[^\"]*\"/\"version\": \"$version\"/" "$package_file" \
                    && rm "${package_file}.bak"
            fi
            log_success "Updated package.json version"
        else
            log_info "Would update package.json version to $version"
        fi
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -m|--message)
            MESSAGE="$2"
            shift 2
            ;;
        -p|--prefix)
            TAG_PREFIX="$2"
            shift 2
            ;;
        -f|--format)
            CHANGELOG_FORMAT="$2"
            shift 2
            ;;
        -o|--output)
            CHANGELOG_FILE="$2"
            shift 2
            ;;
        --auto-increment)
            AUTO_INCREMENT="$2"
            shift 2
            ;;
        --since-last-tag)
            SINCE_LAST_TAG=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --lightweight)
            ANNOTATED=false
            shift
            ;;
        --push)
            PUSH_TAG=true
            shift
            ;;
        --python)
            USE_PYTHON=true
            shift
            ;;
        --no-conventional)
            CONVENTIONAL_COMMITS=false
            shift
            ;;
        --no-since-last-tag)
            SINCE_LAST_TAG=false
            shift
            ;;
        --since)
            # Pass through to changelog generator
            CHANGELOG_ARGS+=("--since" "$2")
            SINCE_LAST_TAG=false
            shift 2
            ;;
        --until)
            # Pass through to changelog generator
            CHANGELOG_ARGS+=("--until" "$2")
            shift 2
            ;;
        --max-count)
            # Pass through to changelog generator
            CHANGELOG_ARGS+=("--max-count" "$2")
            shift 2
            ;;
        -*)
            log_error "Unknown option: $1"
            echo "Run '$0 --help' for usage information."
            exit 1
            ;;
        *)
            if [[ -z "$VERSION" ]]; then
                VERSION="$1"
            else
                log_error "Multiple versions specified: $VERSION and $1"
                exit 1
            fi
            shift
            ;;
    esac
done

# Main execution
main() {
    log "Git Tag and Changelog Generator"
    
    # Pre-flight checks
    check_git_repo
    check_working_tree
    
    # Determine version
    local version=$(determine_version)
    local tag_name="${TAG_PREFIX}${version}"
    
    # Set default changelog file if not specified
    if [[ -z "$CHANGELOG_FILE" ]]; then
        case "$CHANGELOG_FORMAT" in
            "markdown")
                CHANGELOG_FILE="CHANGELOG-${version}.md"
                ;;
            "json")
                CHANGELOG_FILE="changelog-${version}.json"
                ;;
            "simple")
                CHANGELOG_FILE="changelog-${version}.txt"
                ;;
        esac
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "=== DRY RUN MODE ==="
    fi
    
    log_info "Version: $version"
    log_info "Tag: $tag_name"
    log_info "Changelog: $CHANGELOG_FILE ($CHANGELOG_FORMAT format)"
    
    # Generate changelog
    generate_changelog "$version" "$CHANGELOG_FILE"
    
    # Update package.json
    update_package_json "$version"
    
    # Create tag
    create_tag "$version"
    
    # Push tag if requested
    if [[ "$PUSH_TAG" == "true" ]]; then
        push_tag "$version"
    fi
    
    if [[ "$DRY_RUN" == "false" ]]; then
        log_success "Release $version completed!"
        log_info "📝 Changelog: $CHANGELOG_FILE"
        log_info "🏷️  Tag: $tag_name"
        if [[ "$PUSH_TAG" == "true" ]]; then
            log_info "🚀 Tag pushed to origin"
        fi
    else
        log_info "=== END DRY RUN ==="
    fi
}

# Run main function
main "$@" 