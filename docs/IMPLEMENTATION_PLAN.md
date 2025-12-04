# GPU Monitor Applet - Implementation Plan

## How to Use This Plan

**For LLM Agents:**
1. Read this document completely before starting
2. Execute phases sequentially (Phase 0 → Phase 5)
3. Complete ALL tasks in a phase before moving to the next
4. Run tests after each phase
5. Make git commit after each phase completion
6. Refer to companion documents:
   - `LLM_AGENT_GUIDE.md` - Development guidelines for AI agents
   - `TESTING_STRATEGY.md` - How to test each component
   - `GIT_WORKFLOW.md` - Commit message standards and workflow

**Checklist for Each Phase:**
- [ ] Read phase objectives and requirements
- [ ] Review files to create/modify
- [ ] Implement all tasks in order
- [ ] Run phase-specific tests
- [ ] Verify success criteria met
- [ ] Make git commit with phase completion message
- [ ] Update CHANGELOG.md
- [ ] Move to next phase

## Project Overview

**Goal:** Create a Cinnamon taskbar applet displaying NVIDIA GPU statistics

**Features:**
- Two layout modes: 1-row (horizontal) and 2x2 (vertical)
- Display: GPU%, Memory%, Temperature, Fan Speed
- Right-click context menu: layout selector, refresh interval
- No hover/left-click actions
- Automated testing
- Full documentation

**Technology Stack:**
- JavaScript (GJS)
- Cinnamon Desktop APIs
- nvidia-smi command-line tool
- Git for version control

## Phase 0: Project Initialization

**Objective:** Set up project structure, git repository, and documentation framework

**Tasks:**

1. Create directory structure:
```
gpu-monitor@snatch/
├── applet.js                 # Main applet code
├── metadata.json             # Applet metadata
├── settings-schema.json      # Settings configuration
├── stylesheet.css            # Custom styles
├── README.md                 # User documentation
├── CHANGELOG.md              # Version history
├── DEVELOPMENT.md            # Developer guide
├── tests/                    # Test files
│   ├── test-runner.sh       # Main test script
│   ├── test-parser.js       # Unit tests for parsing
│   └── mock-nvidia-smi.sh   # Mock nvidia-smi for testing
├── docs/                     # Additional documentation
│   └── ARCHITECTURE.md      # System architecture
└── .gitignore               # Git ignore patterns
```

2. Initialize git repository
3. Create initial documentation files
4. Create .gitignore

**Success Criteria:**
- [ ] All directories created
- [ ] Git repository initialized
- [ ] Initial commit made: "chore: initialize project structure"
- [ ] All documentation templates present

**Estimated Time:** 15 minutes

---

## Phase 1: Basic Applet Structure

**Objective:** Create minimal working applet that appears in Cinnamon panel

**Tasks:**

1. Create `metadata.json`:
   - UUID: `gpu-monitor@snatch`
   - Name, description, icon
   - Max instances: 1

2. Create basic `applet.js`:
   - Import required Cinnamon modules
   - Define `MyApplet` class extending `Applets.TextApplet`
   - Implement `main()` function
   - Display static text: "GPU Monitor"
   - Implement lifecycle methods: `on_applet_added_to_panel()`, `on_applet_removed_from_panel()`

3. Create installation script: `install.sh`

4. Create uninstall script: `uninstall.sh`

**Files to Create:**
- `metadata.json`
- `applet.js` (basic structure)
- `install.sh`
- `uninstall.sh`

**Success Criteria:**
- [ ] Applet installs without errors
- [ ] Applet appears in "Add applets to panel" menu
- [ ] Applet displays "GPU Monitor" text in panel
- [ ] No errors in `.xsession-errors`
- [ ] Can be removed from panel cleanly

**Git Commit:** `feat: add basic applet structure with static text display`

**Testing:**
```bash
./install.sh
# Manually add to panel via Cinnamon UI
# Verify text displays
./uninstall.sh
```

**Estimated Time:** 30 minutes

---

## Phase 2: NVIDIA SMI Integration

**Objective:** Integrate nvidia-smi data collection and parsing

**Tasks:**

1. Create `NvidiaSMI` class in `applet.js`:
   - Method: `getUtilization()` - returns {gpu, mem, temp, fan}
   - Execute: `nvidia-smi dmon -s pum -c 1`
   - Execute: `nvidia-smi --query-gpu=fan.speed --format=csv,noheader,nounits`
   - Parse output into structured data
   - Handle errors gracefully

2. Create parsing functions:
   - `parseDmonOutput(stdout)` - extract gpu, mem, temp from dmon
   - `parseFanSpeed(stdout)` - extract fan percentage
   - Return object with all values or null on error

3. Add error handling:
   - Command not found
   - Permission denied
   - Invalid output format
   - Timeout handling

4. Update applet to display real data:
   - Call NvidiaSMI every 2 seconds
   - Display: "GPU: X% | MEM: Y% | TEMP: Z°C | FAN: W%"

**Files to Modify:**
- `applet.js` (add NvidiaSMI class and parsing)

**Files to Create:**
- `tests/test-parser.js` (unit tests for parsing functions)
- `tests/mock-nvidia-smi.sh` (mock nvidia-smi output)

**Success Criteria:**
- [ ] Real GPU stats displayed in panel
- [ ] Updates every 2 seconds
- [ ] No crashes if nvidia-smi fails
- [ ] Error message shown if nvidia-smi unavailable
- [ ] Parser tests pass with mock data

**Git Commit:** `feat: integrate nvidia-smi data collection and parsing`

**Testing:**
```bash
# Unit tests
node tests/test-parser.js

# Integration test
./install.sh
# Verify real stats appear
# Test with nvidia-smi available
# Test error handling (rename nvidia-smi temporarily)
```

**Estimated Time:** 1 hour

---

## Phase 3: Layout System (1-Row & 2x2)

**Objective:** Implement two display layouts with dynamic switching

**Tasks:**

1. Create `LayoutManager` class:
   - Method: `formatSingleRow(data)` → "GPU: X% | MEM: Y% | TEMP: Z°C | FAN: W%"
   - Method: `formatTwoRow(data)` → Two-line format
   - Method: `setLayout(mode)` - switch between modes
   - Store current layout preference

2. Modify applet label handling:
   - Switch from `TextApplet` to `Applet` if needed
   - Add `St.Label` or dual labels for 2-row mode
   - Update `_refreshUI()` to use LayoutManager

3. 2x2 Layout format:
```
GPU: XX% MEM: YY%
TEMP: ZZ°C FAN: WW%
```

4. Add layout persistence:
   - Store layout preference in settings
   - Restore on applet reload

**Files to Modify:**
- `applet.js` (add LayoutManager, modify display logic)

**Files to Create:**
- `settings-schema.json` (add layout preference)

**Success Criteria:**
- [ ] Both layouts display correctly
- [ ] Can switch between layouts programmatically
- [ ] Layout persists across Cinnamon restarts
- [ ] Text alignment correct in both modes
- [ ] No visual glitches during switch

**Git Commit:** `feat: add 1-row and 2x2 layout modes with persistence`

**Testing:**
```bash
# Visual verification
./install.sh
# Test 1-row display
# Switch to 2-row (via code temporarily)
# Verify formatting
# Restart Cinnamon, verify persistence
```

**Estimated Time:** 1 hour

---

## Phase 4: Context Menu (Right-Click)

**Objective:** Add right-click menu with layout selector and refresh interval

**Tasks:**

1. Create context menu structure:
   - Use `Applet.AppletPopupMenu`
   - Add "Layout" submenu
   - Add "Refresh Interval" submenu

2. Layout submenu items:
   - Radio button: "Single Row"
   - Radio button: "Two Rows (2x2)"
   - Check current selection

3. Refresh interval submenu items:
   - Radio buttons: 1s, 2s, 5s, 10s
   - Default: 2s
   - Update timer when changed

4. Implement menu callbacks:
   - `onLayoutChanged(newLayout)` - switch layout, save preference
   - `onRefreshIntervalChanged(interval)` - update timer

5. Update timer system:
   - Cancel old timer when interval changes
   - Start new timer with new interval
   - Persist refresh interval preference

**Files to Modify:**
- `applet.js` (add menu, callbacks, timer management)
- `settings-schema.json` (add refresh interval preference)

**Success Criteria:**
- [ ] Right-click opens menu
- [ ] Layout selection works
- [ ] Refresh interval changes apply immediately
- [ ] Current selections shown (checkmarks)
- [ ] Preferences persist across restarts
- [ ] No memory leaks from old timers

**Git Commit:** `feat: add right-click context menu with layout and refresh controls`

**Testing:**
```bash
./install.sh
# Right-click applet
# Test each layout option
# Test each refresh interval
# Verify immediate updates
# Restart Cinnamon, verify persistence
```

**Estimated Time:** 1.5 hours

---

## Phase 5: Styling & Polish

**Objective:** Add professional styling and visual enhancements

**Tasks:**

1. Create `stylesheet.css`:
   - Font styling for readability
   - Color coding for temperature:
     - < 70°C: default theme color
     - 70-85°C: yellow/warning
     - > 85°C: red/critical
   - Padding and spacing
   - Menu styling

2. Implement color coding logic:
   - Method: `getTemperatureColor(temp)` - returns color class
   - Apply CSS classes dynamically
   - Update on each refresh

3. Add visual feedback:
   - Subtle highlight on menu item hover
   - Selected item indication
   - Smooth transitions

4. Handle edge cases:
   - Very long GPU names (truncate)
   - Missing data (show "--")
   - Stale data (dim text)

5. Accessibility:
   - Sufficient contrast ratios
   - Readable font sizes
   - Clear visual hierarchy

**Files to Create:**
- `stylesheet.css`

**Files to Modify:**
- `applet.js` (add color coding logic)

**Success Criteria:**
- [ ] Text easily readable
- [ ] Temperature color coding works
- [ ] Styling consistent with Cinnamon theme
- [ ] No visual glitches
- [ ] Handles missing data gracefully

**Git Commit:** `style: add stylesheet with temperature color coding`

**Testing:**
```bash
./install.sh
# Visual inspection of both layouts
# Test color coding (simulate high temps in code)
# Test with missing data
# Test on different Cinnamon themes
```

**Estimated Time:** 1 hour

---

## Phase 6: Documentation & Testing

**Objective:** Complete all documentation and automated tests

**Tasks:**

1. Complete `README.md`:
   - Installation instructions
   - Features overview
   - Screenshots (text-based mockups)
   - Configuration guide
   - Troubleshooting section

2. Complete `DEVELOPMENT.md`:
   - Development setup
   - Code structure overview
   - How to modify/extend
   - Testing instructions

3. Complete `CHANGELOG.md`:
   - Document all phases as versions
   - List all features
   - Note any breaking changes

4. Create `docs/ARCHITECTURE.md`:
   - System diagram (text-based)
   - Component breakdown
   - Data flow
   - API documentation

5. Create automated test suite:
   - `tests/test-runner.sh` - runs all tests
   - `tests/test-parser.js` - unit tests for parsing
   - `tests/test-integration.sh` - integration tests
   - Add test for layout switching
   - Add test for error handling

6. Create `tests/mock-nvidia-smi.sh`:
   - Simulate nvidia-smi output
   - Different scenarios (normal, high temp, errors)

**Files to Complete:**
- `README.md`
- `DEVELOPMENT.md`
- `CHANGELOG.md`
- `docs/ARCHITECTURE.md`
- `tests/test-runner.sh`
- `tests/test-parser.js`
- `tests/test-integration.sh`
- `tests/mock-nvidia-smi.sh`

**Success Criteria:**
- [ ] All documentation complete and accurate
- [ ] All tests pass
- [ ] Test coverage > 80%
- [ ] Installation instructions work for fresh user
- [ ] Architecture clearly documented

**Git Commit:** `docs: complete documentation and automated test suite`

**Testing:**
```bash
# Run all tests
cd tests
./test-runner.sh

# Verify documentation
# Follow README installation steps on fresh system
```

**Estimated Time:** 2 hours

---

## Phase 7: Release Preparation

**Objective:** Finalize for distribution and production use

**Tasks:**

1. Code review and cleanup:
   - Remove debug logging
   - Remove commented code
   - Ensure consistent code style
   - Add JSDoc comments to all functions

2. Performance optimization:
   - Profile memory usage
   - Check for memory leaks
   - Optimize parsing functions
   - Verify async operations don't block UI

3. Create release assets:
   - `LICENSE` file (choose appropriate license)
   - `CONTRIBUTING.md` (for future contributors)
   - Package as `.zip` for distribution

4. Final testing:
   - Fresh install test
   - Multi-GPU test (if available)
   - Long-running stability test (24 hours)
   - Different Cinnamon versions

5. Version tagging:
   - Set version to `1.0.0` in metadata.json
   - Create git tag `v1.0.0`
   - Update CHANGELOG with release date

**Files to Create:**
- `LICENSE`
- `CONTRIBUTING.md`

**Files to Modify:**
- `metadata.json` (set version 1.0.0)
- All `.js` files (add JSDoc comments)

**Success Criteria:**
- [ ] No memory leaks in 24-hour test
- [ ] All code documented with JSDoc
- [ ] Clean git history
- [ ] Version 1.0.0 tagged
- [ ] Ready for distribution

**Git Commits:**
- `refactor: add JSDoc comments to all functions`
- `perf: optimize parsing and reduce memory usage`
- `chore: prepare v1.0.0 release`

**Testing:**
```bash
# Memory leak test
./install.sh
# Monitor for 24 hours
# Check memory usage periodically

# Fresh install
./uninstall.sh
rm -rf ~/.local/share/cinnamon/applets/gpu-monitor@snatch
./install.sh
# Verify works on clean slate
```

**Estimated Time:** 2 hours

---

## Summary Timeline

| Phase | Description | Time | Cumulative |
|-------|-------------|------|------------|
| 0 | Project Init | 15m | 15m |
| 1 | Basic Applet | 30m | 45m |
| 2 | NVIDIA SMI | 1h | 1h 45m |
| 3 | Layout System | 1h | 2h 45m |
| 4 | Context Menu | 1.5h | 4h 15m |
| 5 | Styling | 1h | 5h 15m |
| 6 | Documentation | 2h | 7h 15m |
| 7 | Release Prep | 2h | 9h 15m |

**Total Estimated Time:** 9-10 hours

## Success Metrics

**Functional:**
- [ ] Displays real GPU stats
- [ ] Both layouts work correctly
- [ ] Context menu fully functional
- [ ] Settings persist across restarts
- [ ] No crashes or errors

**Quality:**
- [ ] All tests pass
- [ ] Test coverage > 80%
- [ ] No memory leaks
- [ ] Professional styling
- [ ] Complete documentation

**User Experience:**
- [ ] Easy to install
- [ ] Intuitive to use
- [ ] Clear error messages
- [ ] Responsive (no UI blocking)

## Notes for LLM Agents

1. **Sequential Execution:** Do not skip phases. Each builds on previous work.

2. **Testing is Mandatory:** Run tests after EVERY phase. Failing tests = phase incomplete.

3. **Git Commits:** Make detailed commits. Future LLM agents will read git history to understand changes.

4. **Documentation First:** When in doubt, over-document. Code will be maintained by AI agents.

5. **Error Handling:** Always handle errors. Never assume commands succeed.

6. **Self-Testing:** Use automated tests. Manual testing is unreliable for AI agents.

7. **Idempotency:** Installation/uninstallation scripts must be idempotent (safe to run multiple times).

8. **Logging:** Use structured logging that can be parsed programmatically.

## Next Steps

After completing Phase 7:
1. Read `LLM_AGENT_GUIDE.md` for ongoing maintenance
2. See `TESTING_STRATEGY.md` for continuous testing
3. Follow `GIT_WORKFLOW.md` for future commits

---

**Document Version:** 1.0
**Last Updated:** 2025-12-04
**Status:** Ready for Implementation
