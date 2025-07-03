# Git Changelog Generator Makefile

.PHONY: help changelog changelog-week changelog-month changelog-markdown clean install

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
	@echo ""
	@echo "Manual usage examples:"
	@echo "  ./git_changelog.sh --since '1 week ago' --format markdown"
	@echo "  python3 git_changelog.py --since '2023-01-01' --output CHANGELOG.md"

# Make scripts executable
install:
	chmod +x git_changelog.sh
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
	rm -f changelog_*.md CHANGELOG.md
	@echo "Cleaned generated changelog files"