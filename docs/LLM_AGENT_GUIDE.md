# LLM Agent Development Guide

## Purpose

This document provides guidelines for AI/LLM agents working on this codebase. It ensures consistent development practices, proper testing, and maintainable code that future AI agents can understand and modify.

## Core Principles

### 1. Code is Communication (Agent-to-Agent)

**Principle:** Write code that communicates intent to other AI agents, not just humans.

**Practices:**
- Use descriptive variable names that explain purpose
- Add inline comments explaining "why" not "what"
- Include JSDoc with examples for complex functions
- Document assumptions explicitly
- Note edge cases in comments

**Example:**
```javascript
// GOOD - Clear intent for AI agents
/**
 * Parse nvidia-smi dmon output to extract GPU metrics
 * Assumes format: "# gpu pwr gtemp ... sm mem ..."
 * Returns null if parsing fails (command error, format change, etc.)
 *
 * @param {string} stdout - Raw output from nvidia-smi dmon -s pum -c 1
 * @returns {Object|null} {gpu: number, mem: number, temp: number} or null
 */
function parseDmonOutput(stdout) {
    // Skip header lines starting with #
    const lines = stdout.split('\n').filter(line => !line.startsWith('#'));
    // Expected format: "    0    117     45      -     13      6 ..."
    // ...
}

// BAD - Unclear for AI agents
function parse(s) {
    let l = s.split('\n');
    // parse it
    return data;
}
```

### 2. Testability First

**Principle:** Every function must be testable in isolation.

**Practices:**
- Separate I/O from logic (pure functions where possible)
- Mock external dependencies (nvidia-smi, file system)
- Write tests BEFORE or WITH implementation
- Include test data in comments

**Structure:**
```javascript
// Separate I/O from logic
class NvidiaSMI {
    // I/O operation - hard to test
    executeCommand() {
        return GLib.spawn_command_line_sync('nvidia-smi dmon -s pum -c 1');
    }

    // Pure function - easy to test
    parseOutput(stdout) {
        // parsing logic
        return {gpu: 13, mem: 6, temp: 45};
    }

    // Combines both
    getStats() {
        const [ok, stdout, stderr] = this.executeCommand();
        if (!ok) return null;
        return this.parseOutput(stdout.toString());
    }
}
```

### 3. Fail Explicitly, Never Silently

**Principle:** Errors must be observable and debuggable by AI agents.

**Practices:**
- Log errors with context
- Return null/undefined for expected failures
- Throw exceptions for unexpected failures
- Include error codes for categorization

**Example:**
```javascript
function parseFanSpeed(stdout) {
    if (!stdout || stdout.trim() === '') {
        // Expected failure - nvidia-smi not available
        global.log('[GPU Monitor] nvidia-smi returned empty output');
        return null;
    }

    const match = stdout.match(/(\d+)/);
    if (!match) {
        // Unexpected failure - format changed
        global.logError('[GPU Monitor] Failed to parse fan speed. Output: ' + stdout);
        return null;
    }

    return parseInt(match[1]);
}
```

### 4. State Management Clarity

**Principle:** All state changes must be traceable and predictable.

**Practices:**
- Centralize state in clear structures
- Document state transitions
- Avoid global mutable state
- Use getter/setter with validation

**Example:**
```javascript
class AppletState {
    constructor() {
        // All state in one place
        this._state = {
            layout: 'single-row',      // 'single-row' | 'two-row'
            refreshInterval: 2,         // seconds
            lastData: null,             // {gpu, mem, temp, fan}
            lastUpdate: 0,              // timestamp
            errorCount: 0               // consecutive errors
        };
    }

    // Validated setter
    setLayout(layout) {
        if (!['single-row', 'two-row'].includes(layout)) {
            throw new Error('Invalid layout: ' + layout);
        }
        this._state.layout = layout;
        this.save(); // persist
    }

    // Getter with logging
    getLayout() {
        return this._state.layout;
    }
}
```

## Code Organization

### File Structure

```
applet.js
├── Imports                  (lines 1-20)
├── Constants               (lines 21-40)
├── Utility Functions       (lines 41-100)
├── NvidiaSMI Class        (lines 101-200)
├── LayoutManager Class    (lines 201-300)
├── AppletState Class      (lines 301-400)
├── MyApplet Class         (lines 401-700)
└── main() function        (lines 701-710)
```

### Class Responsibilities

**NvidiaSMI:**
- Execute nvidia-smi commands
- Parse command output
- Handle command errors
- Return structured data

**LayoutManager:**
- Format data for display
- Switch between layouts
- Generate display strings
- Handle text overflow

**AppletState:**
- Store current state
- Persist preferences
- Validate state changes
- Provide state getters

**MyApplet:**
- Cinnamon applet lifecycle
- UI updates
- Context menu
- Timer management

## Naming Conventions

### Classes
- PascalCase: `NvidiaSMI`, `LayoutManager`
- Nouns: describe what it is

### Functions
- camelCase: `parseDmonOutput`, `formatSingleRow`
- Verbs: describe what it does
- Boolean returns: prefix with `is`, `has`, `can`

### Variables
- camelCase: `refreshInterval`, `lastData`
- Descriptive: prefer `temperatureCelsius` over `temp`
- Constants: UPPER_SNAKE_CASE: `MAX_RETRIES`, `DEFAULT_INTERVAL`

### Private Members
- Prefix with underscore: `_state`, `_timer`, `_updateUI`
- Signals "internal use only" to AI agents

## Error Handling Strategy

### Error Categories

1. **Expected Errors** (handle gracefully):
   - nvidia-smi not installed
   - Permission denied
   - Invalid output format
   - Timeout

2. **Unexpected Errors** (log and recover):
   - Null pointer exceptions
   - Type errors
   - Unknown states

3. **Fatal Errors** (fail fast):
   - Cinnamon API unavailable
   - Critical dependency missing

### Handling Pattern

```javascript
function updateStats() {
    try {
        const stats = nvidiaSMI.getStats();

        if (stats === null) {
            // Expected error - show fallback
            this._handleExpectedError('nvidia-smi unavailable');
            return;
        }

        this._updateDisplay(stats);

    } catch (error) {
        // Unexpected error - log details
        global.logError('[GPU Monitor] Unexpected error: ' + error);
        global.logError('[GPU Monitor] Stack: ' + error.stack);
        this._handleUnexpectedError(error);
    }
}

_handleExpectedError(reason) {
    this.set_applet_label('GPU: --');
    // Don't spam logs for expected errors
    this._errorCount++;
    if (this._errorCount === 1) {
        global.log('[GPU Monitor] ' + reason);
    }
}

_handleUnexpectedError(error) {
    this.set_applet_label('GPU: ERR');
    // Always log unexpected errors
    // Consider showing notification to user
}
```

## Testing Guidelines for AI Agents

### Test Structure

Each test file should follow this pattern:

```javascript
#!/usr/bin/env gjs

// test-parser.js - Unit tests for parsing functions

// Import the functions to test
// (In real implementation, export from applet.js)

const TEST_DATA = {
    validDmonOutput: `# gpu    pwr  gtemp  mtemp     sm    mem    enc    dec
# Idx      W      C      C      %      %      %      %
    0    117     45      -     13      6      0      0`,

    invalidDmonOutput: `Random garbage data`,

    emptyDmonOutput: ``
};

function testParseDmonOutput() {
    print('TEST: parseDmonOutput with valid data');
    const result = parseDmonOutput(TEST_DATA.validDmonOutput);

    assert(result !== null, 'Should return object');
    assert(result.gpu === 13, 'GPU should be 13%');
    assert(result.mem === 6, 'Memory should be 6%');
    assert(result.temp === 45, 'Temp should be 45°C');

    print('  ✓ PASSED');
}

function testParseDmonOutputInvalid() {
    print('TEST: parseDmonOutput with invalid data');
    const result = parseDmonOutput(TEST_DATA.invalidDmonOutput);

    assert(result === null, 'Should return null for invalid data');

    print('  ✓ PASSED');
}

function assert(condition, message) {
    if (!condition) {
        throw new Error('Assertion failed: ' + message);
    }
}

// Run all tests
try {
    testParseDmonOutput();
    testParseDmonOutputInvalid();
    print('\nAll tests passed! ✓');
} catch (error) {
    print('\nTest failed! ✗');
    print(error);
}
```

### Running Tests

```bash
# Run all tests
cd tests
./test-runner.sh

# Run specific test
gjs test-parser.js

# Run with mock nvidia-smi
export PATH="$PWD:$PATH"  # Add mock to PATH
gjs test-integration.js
```

### Test Coverage Goals

- **Unit Tests:** All parsing/formatting functions
- **Integration Tests:** Full applet lifecycle
- **Error Tests:** All error paths
- **Edge Cases:** Empty data, extreme values, invalid input

## Git Workflow for AI Agents

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `style`: CSS/visual changes
- `docs`: Documentation only
- `test`: Adding/modifying tests
- `chore`: Build/tooling changes

**Examples:**

```
feat(nvidia): add GPU temperature parsing

- Implement parseDmonOutput() function
- Extract temperature from gtemp column
- Handle missing temperature data (returns null)
- Add unit tests with mock data

Tested with: nvidia-smi 535.129.03
```

```
fix(menu): prevent memory leak in timer

- Cancel old timer before creating new one
- Store timer ID in _timerId
- Clear timer in on_applet_removed_from_panel()

Fixes issue where multiple timers would run after
changing refresh interval multiple times.
```

### When to Commit

**Commit after:**
- Each phase completion
- Each bug fix
- Each feature addition
- Before major refactoring

**Don't commit:**
- Broken code (unless WIP branch)
- Commented-out code
- Debug logging
- Unformatted code

### Branch Strategy (Future)

For now: work on `main` branch

Future enhancements:
- `main`: stable releases
- `develop`: integration branch
- `feature/*`: new features
- `fix/*`: bug fixes

## Debugging for AI Agents

### Logging Strategy

```javascript
// Use structured logging that AI can parse

// INFO level - normal operation
global.log('[GPU Monitor] Starting update cycle');

// DEBUG level - detailed info
if (DEBUG_MODE) {
    global.log('[GPU Monitor] DEBUG: Parsed data: ' + JSON.stringify(data));
}

// ERROR level - problems
global.logError('[GPU Monitor] ERROR: Failed to parse: ' + stdout);

// WARN level - unexpected but handled
global.logWarning('[GPU Monitor] WARN: High temperature: ' + temp + '°C');
```

### Debug Mode

```javascript
const DEBUG_MODE = false; // Set to true for verbose logging

function debugLog(message, data) {
    if (DEBUG_MODE) {
        global.log('[GPU Monitor] DEBUG: ' + message);
        if (data) {
            global.log('[GPU Monitor] DATA: ' + JSON.stringify(data, null, 2));
        }
    }
}
```

### Viewing Logs

```bash
# Real-time log viewing
tail -f ~/.xsession-errors | grep "GPU Monitor"

# Search for errors
grep "GPU Monitor.*ERROR" ~/.xsession-errors

# Count warnings
grep -c "GPU Monitor.*WARN" ~/.xsession-errors
```

## Common Pitfalls for AI Agents

### 1. Asynchronous Operations

**Problem:** Using sync operations blocks UI
**Solution:** Use async variants where available

```javascript
// BAD - Blocks UI thread
const [ok, stdout] = GLib.spawn_command_line_sync('nvidia-smi dmon -c 1');

// GOOD - Non-blocking (for future enhancement)
GLib.spawn_async(..., (pid, status) => {
    // Process result in callback
});
```

### 2. Memory Leaks

**Problem:** Timers/connections not cleaned up
**Solution:** Track and cleanup in destructor

```javascript
class MyApplet {
    constructor() {
        this._timerId = null;
        this._signalIds = [];
    }

    _startTimer() {
        if (this._timerId) {
            Mainloop.source_remove(this._timerId);
        }
        this._timerId = Mainloop.timeout_add_seconds(this.refreshInterval, () => {
            this._update();
            return true; // Continue timer
        });
    }

    on_applet_removed_from_panel() {
        // Cleanup
        if (this._timerId) {
            Mainloop.source_remove(this._timerId);
            this._timerId = null;
        }
        this._signalIds.forEach(id => this.disconnect(id));
    }
}
```

### 3. String Encoding

**Problem:** Buffer to string conversion issues
**Solution:** Always use .toString() explicitly

```javascript
const [ok, stdout, stderr] = GLib.spawn_command_line_sync('nvidia-smi');
// stdout is ByteArray, not string
const output = stdout.toString(); // Explicit conversion
```

### 4. Race Conditions

**Problem:** Timer fires during state change
**Solution:** Guard with state flags

```javascript
_update() {
    if (this._isUpdating) return; // Prevent concurrent updates

    this._isUpdating = true;
    try {
        // Update logic
    } finally {
        this._isUpdating = false;
    }
}
```

## Code Review Checklist for AI Agents

Before committing, verify:

- [ ] All functions have JSDoc comments
- [ ] Error handling for all external calls
- [ ] No hardcoded values (use constants)
- [ ] Timer/connection cleanup in destructor
- [ ] Logging at appropriate levels
- [ ] Tests written and passing
- [ ] No commented-out code
- [ ] Consistent naming conventions
- [ ] State changes are validated
- [ ] Documentation updated

## Performance Considerations

### Memory Usage

**Target:** < 10 MB resident memory

**Practices:**
- Don't store large history
- Clear old data regularly
- Avoid string concatenation in loops
- Use object pooling for frequent allocations

### CPU Usage

**Target:** < 1% average CPU

**Practices:**
- Don't poll faster than needed (2s is plenty)
- Cache formatted strings
- Avoid regex in hot paths
- Use efficient parsing (split > regex)

### Monitoring

```bash
# Check memory usage
ps aux | grep gpu-monitor

# Check CPU usage
top -p $(pgrep -f gpu-monitor)
```

## Maintenance Mode Instructions

### For Future AI Agents

When modifying this codebase:

1. **Read First:**
   - IMPLEMENTATION_PLAN.md
   - ARCHITECTURE.md
   - CHANGELOG.md
   - Recent git commits

2. **Understand Context:**
   - Why was this written this way?
   - What assumptions were made?
   - What are the constraints?

3. **Test Before Changing:**
   - Run existing tests
   - Understand current behavior
   - Document changes

4. **Update Documentation:**
   - CHANGELOG.md with changes
   - README.md if user-facing
   - Code comments if logic changes

5. **Verify:**
   - All tests still pass
   - No new errors in logs
   - Performance unchanged

## Resources for AI Agents

### Cinnamon API Documentation
- Check installed docs: `/usr/share/cinnamon/`
- Online: GitHub cinnamon/cinnamon repository
- Examples: `/usr/share/cinnamon/applets/*/applet.js`

### GJS (GNOME JavaScript)
- GJS Guide: gjs.guide
- GObject Introspection docs
- Example code in system applets

### Testing Tools
- gjs interpreter: run JavaScript outside Cinnamon
- dbus-monitor: debug D-Bus messages
- Looking Glass: Cinnamon's debugger (Alt+F2, 'lg')

## Questions for AI Agents to Ask

When uncertain:

1. **"Does this break existing functionality?"**
   - Run tests before and after

2. **"Is this testable?"**
   - Write test first

3. **"Will future AI agents understand this?"**
   - Add comments

4. **"What are the failure modes?"**
   - Add error handling

5. **"How do I verify this works?"**
   - Document test procedure

---

**Document Version:** 1.0
**Last Updated:** 2025-12-04
**Maintained By:** LLM Agents
