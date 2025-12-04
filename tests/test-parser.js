#!/usr/bin/env gjs
/**
 * Unit tests for GPU Monitor parsing functions
 *
 * Tests the parseDmonOutput and parseFanSpeed functions
 * Run with: gjs tests/test-parser.js
 */

// Test data fixtures
const TEST_DATA = {
    validDmon: `# gpu    pwr  gtemp  mtemp     sm    mem    enc    dec    jpg    ofa     fb   bar1   ccpm
# Idx      W      C      C      %      %      %      %      %      %     MB     MB     MB
    0    117     45      -     13      6      0      0      0      0   2847     39      0`,

    validDmonHighLoad: `# gpu    pwr  gtemp  mtemp     sm    mem    enc    dec    jpg    ofa     fb   bar1   ccpm
# Idx      W      C      C      %      %      %      %      %      %     MB     MB     MB
    0    225     92      -     98     95      0      0      0      0   7896    512      0`,

    validDmonIdle: `# gpu    pwr  gtemp  mtemp     sm    mem    enc    dec    jpg    ofa     fb   bar1   ccpm
# Idx      W      C      C      %      %      %      %      %      %     MB     MB     MB
    0     15     35      -      0      2      0      0      0      0    512     16      0`,

    invalidDmon: `Random garbage data that is not valid output`,

    emptyDmon: ``,

    headerOnlyDmon: `# gpu    pwr  gtemp  mtemp     sm    mem
# Idx      W      C      C      %      %`,

    partialDmon: `# gpu    pwr  gtemp  mtemp     sm    mem
# Idx      W      C      C      %      %
    0    117`,

    validFan: `55`,

    validFanWithNewline: `55
`,

    validFanWithSpaces: `  65  `,

    invalidFan: `Not a number`,

    emptyFan: ``,

    outOfRangeFan: `150`
};

// Mock parsing functions (copied from applet.js for testing)
function parseDmonOutput(stdout) {
    if (!stdout || stdout.trim() === '') {
        return null;
    }

    const lines = stdout.split('\n').filter(line => !line.startsWith('#') && line.trim() !== '');

    if (lines.length === 0) {
        return null;
    }

    const dataLine = lines[0];
    const values = dataLine.trim().split(/\s+/).filter(v => v !== '');

    if (values.length < 6) {
        return null;
    }

    try {
        const gpu = parseInt(values[4]);
        const mem = parseInt(values[5]);
        const temp = parseInt(values[2]);

        if (isNaN(gpu) || isNaN(mem) || isNaN(temp)) {
            return null;
        }

        return {
            gpu: gpu,
            mem: mem,
            temp: temp
        };

    } catch (error) {
        return null;
    }
}

function parseFanSpeed(stdout) {
    if (!stdout || stdout.trim() === '') {
        return null;
    }

    const trimmed = stdout.trim();
    const match = trimmed.match(/(\d+)/);

    if (!match) {
        return null;
    }

    const fanSpeed = parseInt(match[1]);

    if (isNaN(fanSpeed) || fanSpeed < 0 || fanSpeed > 100) {
        return null;
    }

    return fanSpeed;
}

// Test helper
function assert(condition, message) {
    if (!condition) {
        throw new Error('Assertion failed: ' + message);
    }
}

function assertEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(message + '\n  Expected: ' + JSON.stringify(expected) + '\n  Got: ' + JSON.stringify(actual));
    }
}

// Test suite
let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, testFunc) {
    try {
        testFunc();
        print('✓ PASS: ' + testName);
        testsPassed++;
    } catch (error) {
        print('✗ FAIL: ' + testName);
        print('  ' + error.message);
        testsFailed++;
    }
}

// Tests for parseDmonOutput
runTest('parseDmonOutput with valid data', function() {
    const result = parseDmonOutput(TEST_DATA.validDmon);
    assertEqual(result, {gpu: 13, mem: 6, temp: 45}, 'Should parse valid dmon output');
});

runTest('parseDmonOutput with high load', function() {
    const result = parseDmonOutput(TEST_DATA.validDmonHighLoad);
    assertEqual(result, {gpu: 98, mem: 95, temp: 92}, 'Should parse high load data');
});

runTest('parseDmonOutput with idle GPU', function() {
    const result = parseDmonOutput(TEST_DATA.validDmonIdle);
    assertEqual(result, {gpu: 0, mem: 2, temp: 35}, 'Should parse idle GPU data');
});

runTest('parseDmonOutput with invalid data', function() {
    const result = parseDmonOutput(TEST_DATA.invalidDmon);
    assertEqual(result, null, 'Should return null for invalid data');
});

runTest('parseDmonOutput with empty string', function() {
    const result = parseDmonOutput(TEST_DATA.emptyDmon);
    assertEqual(result, null, 'Should return null for empty string');
});

runTest('parseDmonOutput with header only', function() {
    const result = parseDmonOutput(TEST_DATA.headerOnlyDmon);
    assertEqual(result, null, 'Should return null for header-only data');
});

runTest('parseDmonOutput with partial data', function() {
    const result = parseDmonOutput(TEST_DATA.partialDmon);
    assertEqual(result, null, 'Should return null for incomplete data');
});

// Tests for parseFanSpeed
runTest('parseFanSpeed with valid number', function() {
    const result = parseFanSpeed(TEST_DATA.validFan);
    assertEqual(result, 55, 'Should parse valid fan speed');
});

runTest('parseFanSpeed with newline', function() {
    const result = parseFanSpeed(TEST_DATA.validFanWithNewline);
    assertEqual(result, 55, 'Should parse fan speed with trailing newline');
});

runTest('parseFanSpeed with spaces', function() {
    const result = parseFanSpeed(TEST_DATA.validFanWithSpaces);
    assertEqual(result, 65, 'Should parse fan speed with leading/trailing spaces');
});

runTest('parseFanSpeed with invalid data', function() {
    const result = parseFanSpeed(TEST_DATA.invalidFan);
    assertEqual(result, null, 'Should return null for invalid data');
});

runTest('parseFanSpeed with empty string', function() {
    const result = parseFanSpeed(TEST_DATA.emptyFan);
    assertEqual(result, null, 'Should return null for empty string');
});

runTest('parseFanSpeed with out of range value', function() {
    const result = parseFanSpeed(TEST_DATA.outOfRangeFan);
    assertEqual(result, null, 'Should return null for out-of-range value');
});

// Summary
print('');
print('========================================');
print('Test Results:');
print('  Passed: ' + testsPassed);
print('  Failed: ' + testsFailed);
print('========================================');

if (testsFailed === 0) {
    print('✓ All tests passed!');
} else {
    print('✗ Some tests failed');
}
