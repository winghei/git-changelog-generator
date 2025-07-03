# Git Changelog Generator Makefile

.PHONY: help changelog changelog-week changelog-month changelog-markdown clean install npm-pack npm-publish npm-test npm-prepare test test-api test-shell test-python test-bin release release-patch release-minor release-major tag-and-changelog parser

# Default target
help:
	@echo "Git Changelog Generator"
	@echo "======================="
	@echo ""
	@echo "Available targets:"
	@echo "  help              Show this help message"
	@echo "  changelog         Generate simple changelog for last 10 commits"
	@echo "  changelog-week    Generate changelog for last week"
	@echo "  changelog-month   Generate changelog for last month"
	@echo "  install           Make scripts executable"
	@echo "  clean             Remove generated changelog files"
	@echo "  release           Create tag with auto-increment (patch) and changelog"
	@echo "  release-patch     Create patch release (X.Y.Z+1)"
	@echo "  release-minor     Create minor release (X.Y+1.0)"
	@echo "  release-major     Create major release (X+1.0.0)"
	@echo "  tag-and-changelog Create custom tag and changelog (requires VERSION=x.y.z)"
	@echo "  parser            Open the web parser in your browser"
	@echo "  npm-prepare       Prepare package for npm publishing"
	@echo "  npm-pack          Create npm package locally"
	@echo "  npm-test          Test npm package installation"
	@echo "  npm-publish       Publish to npm registry"
	@echo "  test              Run all unit tests"
	@echo "  test-api          Run API tests only"
	@echo "  test-shell        Run shell script tests only"
	@echo "  test-python       Run Python script tests only"
	@echo "  test-bin          Run binary wrapper tests only"
	@echo ""
	@echo "Manual usage examples:"
	@echo "  ./git_changelog.sh --since '1 week ago' --format markdown"
	@echo "  python3 git_changelog.py --since '2023-01-01' --output CHANGELOG.md"
	@echo "  ./git_tag_changelog.sh 1.2.3                    # Create tag v1.2.3 with changelog"
	@echo "  ./git_tag_changelog.sh --auto-increment patch   # Auto-increment and tag"
	@echo "  make release-minor                               # Create minor release"
	@echo "  make parser                                      # Open web parser in browser"

# Make scripts executable
install:
	chmod +x git_changelog.sh
	chmod +x git_changelog.py
	chmod +x git_tag_changelog.sh
	@echo "Scripts made executable"

# Generate simple changelog for last 10 commits
changelog:
	./git_changelog.sh --max-count 10 --output changelog.json

# Generate changelog for last week
changelog-week:
	bash git_changelog.sh --since "1 week ago" --output changelog_week.json
	@echo "Weekly changelog saved to changelog_week.MD"

# Generate changelog for last month
changelog-month:
	bash git_changelog.sh --since "2025-06-20"  --include-time --output changelog_month.json
	@echo "Monthly changelog saved to changelog_month.json"

# Clean generated files
clean:
	rm -f changelog_*.md CHANGELOG.md *.tgz
	@echo "Cleaned generated changelog files"

# NPM Package targets
npm-prepare:
	chmod +x git_changelog.sh git_changelog.py
	chmod +x bin/*.js
	@echo "Package prepared for npm publishing"

npm-pack:
	npm pack
	@echo "NPM package created locally"

npm-publish:
	npm publish
	@echo "Package published to npm registry"

npm-test:
	npm pack
	npm install -g ./git-changelog-generator-*.tgz
	@echo "Testing all global commands..."
	git-changelog --help
	git-changelog-sh --help
	git-changelog-py --help
	git-tag-changelog --help
	git-changelog-parser --help
	@echo "Testing basic functionality..."
	git-changelog --since "1 week ago" --format json > test-output.json
	git-tag-changelog --auto-increment patch --dry-run
	@echo "NPM package test completed"
	npm uninstall -g git-changelog-generator
	rm -f test-output.json *.tgz

# Test targets
test:
	npm test

test-api:
	npm run test:api

test-shell:
	npm run test:shell

test-python:
	npm run test:python

test-bin:
	npm run test:bin

# Release targets - create tags and changelogs
release: release-patch

release-patch:
	./git_tag_changelog.sh --auto-increment patch --push

release-minor:
	./git_tag_changelog.sh --auto-increment minor --push

release-major:
	./git_tag_changelog.sh --auto-increment major --push

# Custom tag and changelog (requires VERSION=x.y.z)
tag-and-changelog:
ifndef VERSION
	$(error VERSION is not set. Usage: make tag-and-changelog VERSION=1.2.3)
endif
	./git_tag_changelog.sh $(VERSION)

# Open the web parser in browser
parser:
	@echo "Opening Git Changelog Parser..."
	@if command -v node >/dev/null 2>&1; then \
		node bin/git-changelog-parser.js; \
	else \
		echo "Node.js not found. Opening parser manually..."; \
		if [ "$(shell uname)" = "Darwin" ]; then \
			open parser/index.html; \
		elif [ "$(shell uname)" = "Linux" ]; then \
			xdg-open parser/index.html; \
		else \
			echo "Please manually open parser/index.html in your browser"; \
		fi \
	fi