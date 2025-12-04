# Changelog

All notable changes to the GPU Monitor Applet will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned Features
- Initial release with real-time GPU monitoring
- Single-row and 2x2 layout modes
- Configurable refresh intervals
- Temperature color coding
- Right-click context menu
- Full test suite

## [0.0.1] - 2025-12-04

### Added
- Project initialization
- Documentation framework
- Development guidelines for LLM agents
- Testing strategy
- Git workflow documentation

## [0.1.0] - 2025-12-04

### Added
- Basic applet structure (Phase 1)
- metadata.json with applet configuration
- applet.js with MyApplet class extending TextApplet
- Static text display: "GPU Monitor"
- Lifecycle methods for panel add/remove
- install.sh installation script (idempotent)
- uninstall.sh uninstallation script (idempotent)
- JSDoc comments for all functions
- Debug logging infrastructure

---

## Version History Guide

### Types of Changes
- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security improvements

### Version Numbering
- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible
