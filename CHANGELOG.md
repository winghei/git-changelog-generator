# Changelog

All notable changes to this project will be documented in this file.


## [0.2.0] - 2025-07-22


## 🐛 Bug Fixes

- add support for commit range in changelog generation ([c58cd8c1](../../commit/c58cd8c13b45836f58e48d37003cf9573cc73f51))

  Enhance the get_commits function to accept a range argument for
- add function to get previous tag commit ([5282a119](../../commit/5282a119c3527014d7d4eff7618f3fd10ea5f355))

  Implement get_previous_tag function to retrieve the second most recent
- add function to get latest tag commit hash ([75cc956a](../../commit/75cc956a65e97e88ccf11b6c94304bb2e4303924))

  Implement get_latest_tag_commit function to retrieve the commit hash

## 🔧 Chores

- update README with correct package name ([3e91e1fc](../../commit/3e91e1fc7bb2f126003e828bbd44d573e9b6a821))

  Change references from git-changelog-generator to git-changelog-tool


## [0.1.1] - 2025-07-03


## ✨ Features

- commit changes before creating git tag ([b7b13aa4](../../commit/b7b13aa4192bd3c81de85619a3a70577871f2a97))

  - Add commit_changes function to commit changelog and package.json
- update changelog generation and Makefile ([97d6374b](../../commit/97d6374bd1b444b29a1a00522c5436ab7556bec4))

  Refactor changelog generation to format release titles and append new content correctly. Update Makefile to include new release targets for pushing tags and clarify changelog commands. Change package name and version in package.json for better alignment with project goals.
- enable Python script for changelog generation ([a3b8f8c3](../../commit/a3b8f8c3810a4c93f94f537dd91c2c3875da3951))

  Set USE_PYTHON to true by default and update changelog generation to always use markdown format. Adjust usage examples and
- add git tag and changelog generation tool ([4b5970d1](../../commit/4b5970d1a1756016d77c788c3c6e39620da8693b))

  Introduce a new script for creating git tags and generating changelogs.
- add Git Changelog Generator with Python and shell scripts ([07e0a2a5](../../commit/07e0a2a5b4d0c53ea8a8e1fe53f05df97adcb34a))

  Introduce a comprehensive toolset for generating formatted changelogs from git commit history. Includes a Python script for advanced categorization and a shell script for quick usage, along with a Makefile for common operations and a web-based parser for visualization.

## 🐛 Bug Fixes

- update package name in npm commands ([361dbf04](../../commit/361dbf0486fb86b914f985b976646703bc2ea9ea))

  Change package name from git-changelog-generator to git-changelog-tool in npm install and uninstall commands to ensure correct package management during testing. This improves the accuracy of the Makefile operations.

## ♻️ Code Refactoring

- update body formatting in markdown output ([c73c5b1c](../../commit/c73c5b1c9a0024cf6dd762766ab9c489b8b18e81))

  Change the way commit body is displayed in the generated markdown by removing the asterisk formatting and placing the body text on the second line. This improves readability of the changelog output.

## 💄 Styles

- enhance commit type labels with emojis ([8097c249](../../commit/8097c24918b4523b054e58606c34563342fa35d3))

  Update commit type labels in the changelog generator to include emojis for better visual distinction. This change improves the overall readability and user experience of the generated changelog.

## Other

- Initial commit ([014f3783](../../commit/014f378318726aba1bf2035022f192058905eef4))

