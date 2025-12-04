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

## [0.5.0] - 2025-12-04

### Added
- Professional stylesheet with custom CSS (Phase 5)
- Temperature-based color coding system
  - Normal (< 70°C): Green color (#4ade80)
  - Warning (70-85°C): Amber/Yellow color (#fbbf24)
  - Critical (> 85°C): Red color (#ef4444)
- getTemperatureColor() method for dynamic color class selection
- _applyTemperatureStyle() method for applying CSS classes to labels
- Smooth color transitions (0.3s ease-in-out)
- Text shadow for better readability on various backgrounds
- Monospace font styling for consistent number alignment
- Professional padding and spacing in layout boxes
- Accessibility improvements (contrast ratios, font sizes)
- Error state styling with italics and light red color
- Support for missing/stale data display (grayed out text)
- Maximum width constraint with text overflow handling

### Changed
- Updated _updateDisplay() to dynamically apply temperature styling
- Labels now receive temperature-based CSS classes on each refresh
- Version bumped to 0.5.0 in applet.js

## [0.5.1] - 2025-12-04

### Added
- **Fully Configurable Styling System** - All styling parameters now accessible via Settings panel
- Settings panel sections:
  - **Styling & Color Coding**: Enable/disable color coding, font size (6-16pt), padding controls
  - **Temperature Thresholds**: Configurable warning (50-95°C) and critical (60-100°C) thresholds
  - **Temperature Colors**: Color pickers for normal, warning, and critical temperature colors
- New configuration options in settings-schema.json:
  - `enableColorCoding` (checkbox) - Toggle temperature-based colors on/off
  - `fontSize` (spinbutton) - Adjust text size from 6-16pt
  - `verticalPadding` (spinbutton) - Control vertical padding (0-20px)
  - `horizontalPadding` (spinbutton) - Control horizontal padding (0-30px)
  - `tempWarningThreshold` (spinbutton) - Set warning temperature threshold
  - `tempCriticalThreshold` (spinbutton) - Set critical temperature threshold
  - `colorNormal` (colorchooser) - Pick color for normal temperatures
  - `colorWarning` (colorchooser) - Pick color for warning temperatures
  - `colorCritical` (colorchooser) - Pick color for critical temperatures
- _onStyleChanged() callback method for live updates when settings change
- Dynamic inline styling system replacing static CSS classes
- Real-time style updates without requiring Cinnamon restart

### Changed
- getTemperatureColor() now uses configurable thresholds instead of hardcoded values
- _applyTemperatureStyle() now applies inline styles with user-selected colors
- _createUI() now applies user-configured padding and font size to all UI elements
- Settings initialization includes all styling defaults with fallback values
- Version bumped to 0.5.1 in applet.js

### Improved
- Complete user control over all visual aspects through GUI settings
- Live preview of styling changes without reloading
- Better accessibility with customizable font sizes and colors
- Flexible layout customization for different panel configurations

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
