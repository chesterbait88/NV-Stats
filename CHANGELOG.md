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

## [0.2.0] - 2025-12-04

### Added
- Real-time NVIDIA GPU monitoring (Phase 2)
- NvidiaSMI class for command execution and parsing
- GPU utilization, memory usage, temperature, and fan speed display
- Format: "GPU: 35% | MEM: 11% | TEMP: 43°C | FAN: 35%"
- 2-second refresh interval with Mainloop timer
- Detailed tooltip with all GPU statistics
- Error handling for missing/failing nvidia-smi
- Graceful fallback for unavailable GPU data
- Unit tests for parser functions (tests/test-parser.js)
- Mock nvidia-smi for testing without hardware (tests/mock-nvidia-smi.sh)
- Consecutive error tracking to prevent log spam
- Proper timer cleanup to prevent memory leaks

## [0.3.0] - 2025-12-04

### Added
- Dual layout system (Phase 3)
- LayoutManager class for formatting stats in different layouts
- Single-row layout: Horizontal display with pipes
- Two-row (2x2) layout: Vertical display perfect for multi-row taskbars
- Dynamic UI creation based on selected layout
- Settings persistence via settings-schema.json
- Layout switching recreates UI widgets automatically
- St.BoxLayout and St.Label widgets for custom display
- Settings panel: Configure → Display Layout dropdown

### Changed
- Migrated from TextApplet to base Applet for custom widget support
- Updated _updateDisplay() to handle both layout modes
- Updated error handling for multi-label layouts

## [0.4.0] - 2025-12-04

### Added
- Right-click context menu (Phase 4)
- Layout selector in context menu (Single Row / Two Rows)
- Refresh interval selector (1s / 2s / 5s / 10s)
- Visual dot indicators for current selections
- Refresh interval added to settings-schema.json
- PopupMenu integration with built-in context menu
- Menu items persist selections across restarts

### Fixed
- Menu appearing on left-click instead of right-click
- Layout selector not triggering UI changes
- Dot indicators not displaying correctly
- Settings binding not updating layout properly

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
