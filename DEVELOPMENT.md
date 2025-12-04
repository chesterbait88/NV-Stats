# Development Guide

## For LLM Agents

This codebase is designed for development by AI agents. Read these documents first:

1. **[docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)** - Phased implementation roadmap
2. **[docs/LLM_AGENT_GUIDE.md](docs/LLM_AGENT_GUIDE.md)** - Development standards for AI agents
3. **[docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)** - Testing approach and automation
4. **[docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)** - Git commit standards

## Quick Start

### Prerequisites

```bash
# Verify requirements
which nvidia-smi
which gjs
cinnamon --version
```

### Development Setup

```bash
# Clone/navigate to repository
cd gpu-monitor@snatch

# Run tests
./tests/test-runner.sh

# Install for testing
./install.sh

# View logs
tail -f ~/.xsession-errors | grep "GPU Monitor"

# Uninstall
./uninstall.sh
```

### Development Workflow

1. **Read the plan:** Start with docs/IMPLEMENTATION_PLAN.md
2. **Implement phase:** Follow tasks in order
3. **Write tests:** Test as you develop
4. **Run tests:** `./tests/test-runner.sh`
5. **Commit:** Follow docs/GIT_WORKFLOW.md
6. **Next phase:** Move to next phase only after tests pass

## Project Structure

```
gpu-monitor@snatch/
├── applet.js                 # Main applet code (Phase 1+)
├── metadata.json             # Applet metadata (Phase 1)
├── settings-schema.json      # Settings configuration (Phase 3+)
├── stylesheet.css            # Custom styles (Phase 5)
├── install.sh                # Installation script (Phase 1)
├── uninstall.sh              # Uninstallation script (Phase 1)
├── README.md                 # User documentation
├── CHANGELOG.md              # Version history
├── DEVELOPMENT.md            # This file
├── .gitignore                # Git ignore patterns
├── tests/                    # Test files
│   ├── test-runner.sh       # Main test script (Phase 6)
│   ├── test-parser.js       # Parser unit tests (Phase 2)
│   ├── test-formatter.js    # Formatter tests (Phase 3)
│   ├── test-integration.js  # Integration tests (Phase 6)
│   ├── test-e2e.sh          # End-to-end tests (Phase 6)
│   ├── mock-nvidia-smi.sh   # Mock nvidia-smi (Phase 2)
│   └── fixtures/            # Test data files
└── docs/                     # Documentation
    ├── IMPLEMENTATION_PLAN.md
    ├── LLM_AGENT_GUIDE.md
    ├── TESTING_STRATEGY.md
    ├── GIT_WORKFLOW.md
    ├── GPU_MONITOR_BLUEPRINT.md
    └── ARCHITECTURE.md       # System architecture (Phase 6)
```

## Code Standards

### JavaScript Style

- Use semicolons
- 4-space indentation
- camelCase for variables/functions
- PascalCase for classes
- UPPER_SNAKE_CASE for constants
- JSDoc comments for all functions

### Example

```javascript
const REFRESH_INTERVAL_DEFAULT = 2; // seconds

/**
 * Parse nvidia-smi dmon output
 * @param {string} stdout - Command output
 * @returns {Object|null} Parsed data or null on error
 */
function parseDmonOutput(stdout) {
    if (!stdout || stdout.trim() === '') {
        return null;
    }
    // ... implementation
}
```

## Testing

### Running Tests

```bash
# All tests
./tests/test-runner.sh

# Specific test
gjs tests/test-parser.js

# With mock nvidia-smi
export PATH="$PWD/tests:$PATH"
gjs tests/test-integration.js
```

### Writing Tests

See [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md) for detailed testing guidelines.

## Debugging

### View Logs

```bash
# Real-time log monitoring
tail -f ~/.xsession-errors | grep "GPU Monitor"

# Search for errors
grep "GPU Monitor.*ERROR" ~/.xsession-errors

# Last 50 lines
tail -50 ~/.xsession-errors | grep "GPU Monitor"
```

### Cinnamon Looking Glass

```bash
# Open debugger
Alt+F2, type: lg, press Enter

# In Looking Glass, view logs and evaluate code
```

### Enable Debug Mode

Edit `applet.js`:
```javascript
const DEBUG_MODE = true; // Set to true for verbose logging
```

Restart Cinnamon: `Ctrl+Alt+Esc`

## Common Tasks

### Test Changes

```bash
# Uninstall old version
./uninstall.sh

# Install new version
./install.sh

# Restart Cinnamon
Ctrl+Alt+Esc

# Add applet to panel via GUI
```

### Check Syntax

```bash
# JavaScript syntax
gjs -c applet.js

# JSON syntax
python3 -m json.tool metadata.json
```

### Profile Performance

```bash
# Memory usage
ps aux | grep gpu-monitor

# CPU usage
top -p $(pgrep -f gpu-monitor)

# Monitor over time
watch -n 5 'ps aux | grep gpu-monitor'
```

## Git Workflow

### Before Committing

```bash
# Run tests
./tests/test-runner.sh

# Check git status
git status

# Review changes
git diff

# Stage specific files
git add applet.js tests/test-parser.js

# Commit with message
git commit -m "feat(parser): add temperature parsing

- Implement parseDmonOutput()
- Add unit tests
- Handle edge cases"
```

See [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md) for detailed git standards.

## Phase Development

### Current Phase

Check IMPLEMENTATION_PLAN.md to see current phase.

### Phase Checklist

- [ ] Read phase objectives
- [ ] Implement all tasks
- [ ] Write tests for new functionality
- [ ] Run test suite (must pass)
- [ ] Update CHANGELOG.md
- [ ] Commit with phase completion message
- [ ] Move to next phase

## Troubleshooting

### Applet Not Loading

1. Check syntax: `gjs -c applet.js`
2. Check logs: `tail ~/.xsession-errors`
3. Verify files: `ls -la ~/.local/share/cinnamon/applets/gpu-monitor@snatch/`
4. Check permissions: `chmod +x install.sh uninstall.sh`

### Tests Failing

1. Verify prerequisites: `which gjs nvidia-smi`
2. Check mock nvidia-smi: `chmod +x tests/mock-nvidia-smi.sh`
3. Run tests individually to isolate failure
4. Check test fixture data in `tests/fixtures/`

### Git Issues

1. Check status: `git status`
2. View recent commits: `git log -5`
3. If confused, see [docs/GIT_WORKFLOW.md](docs/GIT_WORKFLOW.md)

## Resources

### Cinnamon Development

- Installed examples: `/usr/share/cinnamon/applets/`
- API docs: `/usr/share/cinnamon/`
- Looking Glass debugger: Alt+F2 → `lg`

### GJS (GNOME JavaScript)

- GJS Guide: https://gjs.guide
- GObject reference: Check system docs

### NVIDIA SMI

- Help: `nvidia-smi --help`
- Query options: `nvidia-smi --help-query-gpu`
- Dmon help: `nvidia-smi dmon -h`

## Contributing (Future)

This project is currently in initial development by AI agents. Contribution guidelines will be added post-v1.0.

## Support

For issues:
1. Check logs: `~/.xsession-errors`
2. Run tests: `./tests/test-runner.sh`
3. Review documentation in `docs/`
4. Check git history: `git log --grep="issue-keyword"`

---

**For AI Agents:** Always read IMPLEMENTATION_PLAN.md before making changes.

**Last Updated:** 2025-12-04
