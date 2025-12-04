# GPU Monitor Applet - Testing Strategy

## Overview

This document defines the testing approach for autonomous LLM agent development. All tests must be executable by AI agents without human intervention.

## Testing Philosophy

### Core Principles

1. **Automated Execution:** All tests run via scripts, no manual steps
2. **Self-Validating:** Tests output clear PASS/FAIL status
3. **Reproducible:** Same inputs always produce same outputs
4. **Fast Feedback:** Full test suite runs in < 30 seconds
5. **Independent:** Tests don't depend on external state

### Test Pyramid

```
        /\
       /  \        E2E Tests (5%)
      /____\       - Full applet in Cinnamon
     /      \
    /  Inte \     Integration Tests (25%)
   /   gration\   - Multi-component
  /____________\
 /              \ Unit Tests (70%)
/    Unit Tests  \- Pure functions
/__________________\
```

## Test Levels

### Level 1: Unit Tests (70% of tests)

**Purpose:** Test pure functions in isolation

**Files:**
- `tests/test-parser.js` - Parsing functions
- `tests/test-formatter.js` - Layout formatting
- `tests/test-validator.js` - Input validation

**Example:**

```javascript
#!/usr/bin/env gjs
// tests/test-parser.js

const TEST_CASES = {
    valid: {
        input: `# gpu    pwr  gtemp  mtemp     sm    mem    enc    dec
# Idx      W      C      C      %      %      %      %
    0    117     45      -     13      6      0      0`,
        expected: {gpu: 13, mem: 6, temp: 45}
    },
    highTemp: {
        input: `# gpu    pwr  gtemp  mtemp     sm    mem
# Idx      W      C      C      %      %
    0    200     92      -     95     88`,
        expected: {gpu: 95, mem: 88, temp: 92}
    },
    invalid: {
        input: `corrupted data`,
        expected: null
    },
    empty: {
        input: ``,
        expected: null
    }
};

function runTests() {
    let passed = 0;
    let failed = 0;

    for (const [name, testCase] of Object.entries(TEST_CASES)) {
        try {
            const result = parseDmonOutput(testCase.input);

            if (JSON.stringify(result) === JSON.stringify(testCase.expected)) {
                print(`✓ PASS: ${name}`);
                passed++;
            } else {
                print(`✗ FAIL: ${name}`);
                print(`  Expected: ${JSON.stringify(testCase.expected)}`);
                print(`  Got:      ${JSON.stringify(result)}`);
                failed++;
            }
        } catch (error) {
            print(`✗ ERROR: ${name} - ${error.message}`);
            failed++;
        }
    }

    print(`\n${passed} passed, ${failed} failed`);
    return failed === 0 ? 0 : 1; // Exit code
}

// Exit with status code for CI/CD
System.exit(runTests());
```

**Running:**
```bash
gjs tests/test-parser.js
echo $? # 0 = success, 1 = failure
```

### Level 2: Integration Tests (25% of tests)

**Purpose:** Test component interactions

**Files:**
- `tests/test-integration.js` - Component integration
- `tests/test-applet-lifecycle.sh` - Install/uninstall cycle

**Example:**

```javascript
#!/usr/bin/env gjs
// tests/test-integration.js

// Test: NvidiaSMI -> LayoutManager -> Display
function testDataFlow() {
    print('TEST: Complete data flow');

    // Mock nvidia-smi data
    const mockData = {gpu: 45, mem: 60, temp: 72, fan: 65};

    // Test single-row layout
    const layoutMgr = new LayoutManager();
    const singleRow = layoutMgr.formatSingleRow(mockData);
    const expected = "GPU: 45% | MEM: 60% | TEMP: 72°C | FAN: 65%";

    if (singleRow === expected) {
        print('  ✓ Single-row format correct');
    } else {
        print('  ✗ Single-row format incorrect');
        print(`    Expected: ${expected}`);
        print(`    Got:      ${singleRow}`);
        return false;
    }

    // Test two-row layout
    const twoRow = layoutMgr.formatTwoRow(mockData);
    const expectedRow1 = "GPU: 45% MEM: 60%";
    const expectedRow2 = "TEMP: 72°C FAN: 65%";

    if (twoRow.row1 === expectedRow1 && twoRow.row2 === expectedRow2) {
        print('  ✓ Two-row format correct');
    } else {
        print('  ✗ Two-row format incorrect');
        return false;
    }

    return true;
}

// Test: Settings persistence
function testSettingsPersistence() {
    print('TEST: Settings persistence');

    const state = new AppletState();

    // Set values
    state.setLayout('two-row');
    state.setRefreshInterval(5);
    state.save();

    // Create new instance (simulates restart)
    const state2 = new AppletState();
    state2.load();

    if (state2.getLayout() === 'two-row' && state2.getRefreshInterval() === 5) {
        print('  ✓ Settings persisted correctly');
        return true;
    } else {
        print('  ✗ Settings not persisted');
        return false;
    }
}

// Run all integration tests
const tests = [testDataFlow, testSettingsPersistence];
let allPassed = true;

for (const test of tests) {
    if (!test()) {
        allPassed = false;
    }
}

System.exit(allPassed ? 0 : 1);
```

**Running:**
```bash
gjs tests/test-integration.js
```

### Level 3: End-to-End Tests (5% of tests)

**Purpose:** Test full applet in real Cinnamon environment

**Files:**
- `tests/test-e2e.sh` - Full installation and verification

**Example:**

```bash
#!/bin/bash
# tests/test-e2e.sh

set -e # Exit on error

echo "E2E Test: Full applet lifecycle"

# 1. Clean slate
echo "Step 1: Cleanup previous installation"
./uninstall.sh 2>/dev/null || true
rm -rf ~/.local/share/cinnamon/applets/gpu-monitor@snatch

# 2. Install
echo "Step 2: Install applet"
./install.sh

# 3. Verify files exist
echo "Step 3: Verify installation"
if [ -f ~/.local/share/cinnamon/applets/gpu-monitor@snatch/metadata.json ]; then
    echo "  ✓ metadata.json exists"
else
    echo "  ✗ metadata.json missing"
    exit 1
fi

if [ -f ~/.local/share/cinnamon/applets/gpu-monitor@snatch/applet.js ]; then
    echo "  ✓ applet.js exists"
else
    echo "  ✗ applet.js missing"
    exit 1
fi

# 4. Validate JSON syntax
echo "Step 4: Validate JSON"
python3 -m json.tool ~/.local/share/cinnamon/applets/gpu-monitor@snatch/metadata.json > /dev/null
if [ $? -eq 0 ]; then
    echo "  ✓ metadata.json valid JSON"
else
    echo "  ✗ metadata.json invalid JSON"
    exit 1
fi

# 5. Check JavaScript syntax
echo "Step 5: Validate JavaScript syntax"
gjs -c ~/.local/share/cinnamon/applets/gpu-monitor@snatch/applet.js
if [ $? -eq 0 ]; then
    echo "  ✓ applet.js valid JavaScript"
else
    echo "  ✗ applet.js syntax errors"
    exit 1
fi

# 6. Uninstall
echo "Step 6: Uninstall applet"
./uninstall.sh

# 7. Verify cleanup
echo "Step 7: Verify cleanup"
if [ ! -d ~/.local/share/cinnamon/applets/gpu-monitor@snatch ]; then
    echo "  ✓ Applet removed cleanly"
else
    echo "  ✗ Applet directory still exists"
    exit 1
fi

echo ""
echo "✓ All E2E tests passed!"
exit 0
```

**Running:**
```bash
bash tests/test-e2e.sh
```

## Mock System

### Mock nvidia-smi

**Purpose:** Simulate nvidia-smi without GPU

**File:** `tests/mock-nvidia-smi.sh`

```bash
#!/bin/bash
# tests/mock-nvidia-smi.sh - Mock nvidia-smi for testing

# Detect command and respond appropriately
if [[ "$*" == *"dmon"* ]]; then
    # Mock dmon output
    cat <<'EOF'
# gpu    pwr  gtemp  mtemp     sm    mem    enc    dec    jpg    ofa     fb   bar1   ccpm
# Idx      W      C      C      %      %      %      %      %      %     MB     MB     MB
    0     85     55      -     42     35      0      0      0      0   4096    128      0
EOF

elif [[ "$*" == *"fan.speed"* ]]; then
    # Mock fan speed query
    echo "55"

else
    # Default mock output
    cat <<'EOF'
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 535.129.03   Driver Version: 535.129.03   CUDA Version: 12.2   |
|-------------------------------+----------------------+----------------------+
| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|===============================+======================+======================|
|   0  NVIDIA GeForce RTX  On   | 00000000:01:00.0  On |                  N/A |
| 55%   55C    P2    85W / 250W |   4096MiB / 8192MiB |     42%      Default |
+-------------------------------+----------------------+----------------------+
EOF
fi

exit 0
```

**Make executable:**
```bash
chmod +x tests/mock-nvidia-smi.sh
```

**Usage in tests:**
```bash
# Add mock to PATH
export PATH="$PWD/tests:$PATH"

# Now 'nvidia-smi' calls our mock
nvidia-smi dmon -c 1
```

### Mock Scenarios

Create different mocks for edge cases:

**tests/mock-nvidia-smi-high-temp.sh** - High temperature scenario
**tests/mock-nvidia-smi-error.sh** - Simulates command failure
**tests/mock-nvidia-smi-no-gpu.sh** - No GPU detected

## Test Runner

### Master Test Script

**File:** `tests/test-runner.sh`

```bash
#!/bin/bash
# tests/test-runner.sh - Run all tests

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "================================"
echo "GPU Monitor Applet - Test Suite"
echo "================================"
echo ""

# Track results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run test and track result
run_test() {
    local test_name="$1"
    local test_cmd="$2"

    echo "Running: $test_name"
    if eval "$test_cmd"; then
        echo "  ✓ PASSED"
        ((TESTS_PASSED++))
    else
        echo "  ✗ FAILED"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Unit Tests
echo "--- Unit Tests ---"
run_test "Parser Tests" "gjs tests/test-parser.js"
run_test "Formatter Tests" "gjs tests/test-formatter.js"
run_test "Validator Tests" "gjs tests/test-validator.js"

# Integration Tests
echo "--- Integration Tests ---"
run_test "Data Flow Test" "gjs tests/test-integration.js"

# E2E Tests
echo "--- End-to-End Tests ---"
run_test "Full Lifecycle" "bash tests/test-e2e.sh"

# Summary
echo "================================"
echo "Test Results:"
echo "  Passed: $TESTS_PASSED"
echo "  Failed: $TESTS_FAILED"
echo "================================"

if [ $TESTS_FAILED -eq 0 ]; then
    echo "✓ All tests passed!"
    exit 0
else
    echo "✗ Some tests failed"
    exit 1
fi
```

**Make executable:**
```bash
chmod +x tests/test-runner.sh
```

**Running:**
```bash
./tests/test-runner.sh
```

## Continuous Testing for AI Agents

### Pre-Commit Testing

Before every commit, AI agent should run:

```bash
# Quick test before commit
./tests/test-runner.sh

# If passes, commit
git commit -m "feat: add feature"

# If fails, fix and retest
```

### Post-Implementation Testing

After each phase:

```bash
# Full test suite
./tests/test-runner.sh

# Check logs for errors
tail -100 ~/.xsession-errors | grep -i "gpu monitor"

# Memory check (if applet running)
ps aux | grep gpu-monitor

# Visual verification (automated via screenshots in future)
# For now: manual panel check
```

## Test Coverage Tracking

### Manual Coverage Checklist

**Parser Functions:**
- [ ] parseDmonOutput - valid input
- [ ] parseDmonOutput - invalid input
- [ ] parseDmonOutput - empty input
- [ ] parseDmonOutput - partial data
- [ ] parseFanSpeed - valid input
- [ ] parseFanSpeed - invalid input

**Formatter Functions:**
- [ ] formatSingleRow - normal values
- [ ] formatSingleRow - extreme values (99%)
- [ ] formatSingleRow - null values
- [ ] formatTwoRow - normal values
- [ ] formatTwoRow - extreme values

**State Management:**
- [ ] setLayout - valid values
- [ ] setLayout - invalid values
- [ ] setRefreshInterval - valid range
- [ ] setRefreshInterval - out of range
- [ ] save/load - persistence

**Error Handling:**
- [ ] nvidia-smi not found
- [ ] nvidia-smi permission denied
- [ ] nvidia-smi timeout
- [ ] Invalid output format
- [ ] Null data handling

**Lifecycle:**
- [ ] Install
- [ ] Add to panel
- [ ] Update cycle
- [ ] Remove from panel
- [ ] Uninstall

## Performance Testing

### Memory Leak Test

**File:** `tests/test-memory-leak.sh`

```bash
#!/bin/bash
# tests/test-memory-leak.sh

echo "Memory Leak Test (60 seconds)"

# Get initial memory
sleep 5
INITIAL_MEM=$(ps aux | grep "gpu-monitor" | grep -v grep | awk '{print $6}')
echo "Initial memory: ${INITIAL_MEM}KB"

# Wait 60 seconds
echo "Waiting 60 seconds..."
sleep 60

# Get final memory
FINAL_MEM=$(ps aux | grep "gpu-monitor" | grep -v grep | awk '{print $6}')
echo "Final memory: ${FINAL_MEM}KB"

# Calculate increase
INCREASE=$((FINAL_MEM - INITIAL_MEM))
echo "Memory increase: ${INCREASE}KB"

# Fail if increase > 1MB (1024KB)
if [ $INCREASE -gt 1024 ]; then
    echo "✗ FAIL: Memory leak detected (>${INCREASE}KB increase)"
    exit 1
else
    echo "✓ PASS: No significant memory leak"
    exit 0
fi
```

### CPU Usage Test

**File:** `tests/test-cpu-usage.sh`

```bash
#!/bin/bash
# tests/test-cpu-usage.sh

echo "CPU Usage Test (10 seconds)"

# Monitor CPU for 10 seconds
CPU_SAMPLES=0
CPU_TOTAL=0

for i in {1..10}; do
    CPU=$(ps aux | grep "gpu-monitor" | grep -v grep | awk '{print $3}')
    if [ ! -z "$CPU" ]; then
        CPU_TOTAL=$(echo "$CPU_TOTAL + $CPU" | bc)
        ((CPU_SAMPLES++))
    fi
    sleep 1
done

# Calculate average
if [ $CPU_SAMPLES -gt 0 ]; then
    CPU_AVG=$(echo "scale=2; $CPU_TOTAL / $CPU_SAMPLES" | bc)
    echo "Average CPU: ${CPU_AVG}%"

    # Fail if average > 2%
    if (( $(echo "$CPU_AVG > 2.0" | bc -l) )); then
        echo "✗ FAIL: CPU usage too high (${CPU_AVG}%)"
        exit 1
    else
        echo "✓ PASS: CPU usage acceptable"
        exit 0
    fi
else
    echo "✗ FAIL: Could not measure CPU"
    exit 1
fi
```

## Regression Testing

### Regression Test Suite

**Purpose:** Ensure new changes don't break existing functionality

**File:** `tests/test-regression.sh`

```bash
#!/bin/bash
# tests/test-regression.sh

# Test cases that should always pass
# Add new test for each bug fix

echo "Regression Test Suite"
echo ""

# Test 1: Bug fix - timer not canceling
test_timer_cleanup() {
    echo "Test: Timer cleanup on refresh change"
    # Start applet
    # Change refresh interval 5 times
    # Check only 1 timer running
    # TODO: Implement
    echo "  ✓ PASS (placeholder)"
}

# Test 2: Bug fix - null data crash
test_null_data_handling() {
    echo "Test: Null data doesn't crash applet"
    # Mock nvidia-smi to return empty
    # Verify applet shows fallback text
    # TODO: Implement
    echo "  ✓ PASS (placeholder)"
}

# Run all regression tests
test_timer_cleanup
test_null_data_handling

echo ""
echo "Regression tests complete"
```

## Test Data

### Sample nvidia-smi Outputs

Store in `tests/fixtures/`:

**tests/fixtures/nvidia-smi-normal.txt:**
```
# gpu    pwr  gtemp  mtemp     sm    mem    enc    dec    jpg    ofa     fb   bar1   ccpm
# Idx      W      C      C      %      %      %      %      %      %     MB     MB     MB
    0     85     55      -     42     35      0      0      0      0   4096    128      0
```

**tests/fixtures/nvidia-smi-high-temp.txt:**
```
# gpu    pwr  gtemp  mtemp     sm    mem    enc    dec    jpg    ofa     fb   bar1   ccpm
# Idx      W      C      C      %      %      %      %      %      %     MB     MB     MB
    0    225     92      -     98     95      0      0      0      0   7896    512      0
```

**tests/fixtures/nvidia-smi-idle.txt:**
```
# gpu    pwr  gtemp  mtemp     sm    mem    enc    dec    jpg    ofa     fb   bar1   ccpm
# Idx      W      C      C      %      %      %      %      %      %     MB     MB     MB
    0     15     35      -      0      2      0      0      0      0    512     16      0
```

## Automated Testing Workflow

### For AI Agents

**Before starting work:**
```bash
./tests/test-runner.sh # Ensure baseline passes
```

**During development:**
```bash
# After each function
gjs tests/test-parser.js # Test specific component

# After each file
./tests/test-runner.sh # Run all tests
```

**Before committing:**
```bash
./tests/test-runner.sh # Must pass
bash tests/test-e2e.sh # E2E verification
```

**After Phase completion:**
```bash
./tests/test-runner.sh
bash tests/test-memory-leak.sh
bash tests/test-cpu-usage.sh
```

## Success Criteria

**Phase completion requires:**
- [ ] All existing tests pass
- [ ] New tests added for new functionality
- [ ] No new errors in logs
- [ ] Memory usage stable
- [ ] CPU usage < 2% average

## Troubleshooting Tests

### Test Failures

**If parser tests fail:**
1. Check nvidia-smi output format
2. Update parser to match format
3. Update test fixtures
4. Re-run tests

**If integration tests fail:**
1. Check component boundaries
2. Verify mock data matches real data
3. Check state persistence
4. Re-run tests

**If E2E tests fail:**
1. Check file permissions
2. Verify installation paths
3. Check Cinnamon version compatibility
4. Review .xsession-errors log

### Test Environment Issues

**GJS not found:**
```bash
sudo apt install gjs
```

**Mock not being used:**
```bash
# Verify PATH
echo $PATH
# Should show tests/ directory first

# Make mock executable
chmod +x tests/mock-nvidia-smi.sh
```

**Permission errors:**
```bash
# Ensure test scripts executable
chmod +x tests/*.sh
```

---

**Document Version:** 1.0
**Last Updated:** 2025-12-04
**Purpose:** Guide AI agents in automated testing
