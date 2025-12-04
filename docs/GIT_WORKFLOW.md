# Git Workflow for LLM Agents

## Purpose

This document defines git commit standards, branching strategy, and version control practices for AI agents working on this codebase.

## Core Principles

1. **Commit messages are documentation** - Future AI agents read git history
2. **Atomic commits** - One logical change per commit
3. **Tested code only** - Never commit broken code
4. **Descriptive history** - Clear progression of development

## Commit Message Format

### Standard Structure

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Components

**Type** (required):
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring without behavior change
- `style`: Visual/CSS changes
- `docs`: Documentation only
- `test`: Adding or modifying tests
- `chore`: Build, tooling, dependencies
- `perf`: Performance improvement

**Scope** (optional):
- Component or area affected
- Examples: `parser`, `menu`, `layout`, `nvidia`, `ui`

**Subject** (required):
- Imperative mood: "add" not "added" or "adds"
- No period at end
- Max 50 characters
- Lowercase first letter (except proper nouns)

**Body** (optional but recommended):
- Explain WHAT and WHY, not HOW
- Wrap at 72 characters
- Separate from subject with blank line
- Use bullet points for multiple items

**Footer** (optional):
- Reference issues: `Fixes #123`
- Breaking changes: `BREAKING CHANGE: description`
- Related commits: `Relates to: abc1234`

## Commit Message Examples

### Good Commits

```
feat(parser): add GPU temperature parsing from dmon output

- Implement parseDmonOutput() function
- Extract temperature from gtemp column
- Handle missing temperature data (returns null)
- Add unit tests with mock nvidia-smi data

Tested with nvidia-smi version 535.129.03
```

```
fix(menu): prevent memory leak from timer duplication

Cancel existing timer before creating new one when user
changes refresh interval. Previous behavior created
multiple concurrent timers, increasing memory usage.

- Store timer ID in this._timerId
- Check and cancel old timer in _startTimer()
- Add timer cleanup to on_applet_removed_from_panel()

Fixes memory leak observed after 5+ interval changes.
```

```
refactor(layout): extract formatting into LayoutManager class

Separate layout logic from applet logic for better
testability and future extensibility.

- Create LayoutManager class
- Move formatSingleRow() and formatTwoRow() methods
- Update MyApplet to use LayoutManager instance
- Add unit tests for LayoutManager

No functional changes, pure refactor.
```

```
docs: add architecture diagram to ARCHITECTURE.md

Document data flow from nvidia-smi through parser to display.
Includes component responsibilities and error handling paths.
```

```
test: add mock nvidia-smi for integration testing

- Create mock-nvidia-smi.sh with realistic output
- Support dmon and fan.speed query modes
- Add high-temp and error scenarios
- Update test-runner.sh to use mock

Enables testing without GPU hardware.
```

```
chore: initialize project structure

- Create directory layout
- Add .gitignore for JS/Linux
- Initialize empty documentation files
- Set up tests/ directory

Phase 0 complete.
```

### Bad Commits (Don't Do This)

```
❌ update stuff

(No context, no scope, no explanation)
```

```
❌ Fixed the bug

(Which bug? How? What was the root cause?)
```

```
❌ WIP

(Never commit work-in-progress without description)
```

```
❌ added new feature for parsing and also fixed the menu bug and updated docs

(Multiple unrelated changes - should be 3 separate commits)
```

```
❌ feat: Added parsing function.

(Period at end, past tense instead of imperative)
```

## Commit Frequency

### When to Commit

**DO commit after:**
- ✅ Completing a logical unit of work
- ✅ All related tests pass
- ✅ Each phase completion
- ✅ Each bug fix (one commit per bug)
- ✅ Each feature addition
- ✅ Documentation updates (separate from code)

**DON'T commit:**
- ❌ In middle of refactoring (incomplete state)
- ❌ Broken/non-working code
- ❌ Multiple unrelated changes together
- ❌ Generated files (unless necessary)
- ❌ Commented-out code

### Commit Size

**Ideal commit:**
- 1 file changed: 20-100 lines
- Multiple files: < 300 lines total
- Single logical change
- Self-contained (doesn't break build)

**Too small:**
- Single line changes (unless fixing typo)
- Formatting-only changes (batch these)

**Too large:**
- > 500 lines changed
- Multiple features
- Refactor + new feature combined

**Exception:** Initial project setup can be large

## Phase-Based Commits

### Phase Completion Commits

After completing each implementation phase, make a standardized commit:

**Phase 0 - Project Init:**
```
chore: initialize project structure

- Create directory layout (applet/, tests/, docs/)
- Initialize git repository
- Create .gitignore
- Add documentation templates (README, CHANGELOG, etc.)

Phase 0 complete. Ready for Phase 1.
```

**Phase 1 - Basic Applet:**
```
feat: add basic applet structure with static text display

- Create metadata.json with UUID and applet info
- Implement MyApplet class extending TextApplet
- Add main() function for Cinnamon integration
- Create install.sh and uninstall.sh scripts
- Add lifecycle methods for panel add/remove

Applet successfully installs and displays "GPU Monitor"
in Cinnamon panel. No errors in .xsession-errors.

Phase 1 complete. Tested via manual installation.
```

**Phase 2 - NVIDIA SMI:**
```
feat: integrate nvidia-smi data collection and parsing

- Add NvidiaSMI class with command execution
- Implement parseDmonOutput() for GPU/mem/temp extraction
- Implement parseFanSpeed() for fan percentage
- Add error handling for missing nvidia-smi
- Update applet to display real stats every 2 seconds
- Create unit tests for parsing functions
- Add mock nvidia-smi for testing

Displays: "GPU: 42% | MEM: 35% | TEMP: 55°C | FAN: 55%"
All parser tests pass (100% coverage).

Phase 2 complete. Tested with real GPU and mock data.
```

**Phase 3 - Layout System:**
```
feat: add 1-row and 2x2 layout modes with persistence

- Create LayoutManager class
- Implement formatSingleRow() for horizontal layout
- Implement formatTwoRow() for 2x2 grid layout
- Add settings-schema.json for layout preference
- Persist layout choice across Cinnamon restarts
- Update applet to switch between layouts

Both layouts tested and working. Layout persists
after Cinnamon restart. No visual glitches.

Phase 3 complete.
```

## Git Configuration for AI Agents

### Initial Setup

```bash
# Configure git identity (do once per environment)
git config user.name "Claude AI Agent"
git config user.email "claude-agent@anthropic.local"

# Use simple push behavior
git config push.default simple

# Better diff output
git config diff.algorithm histogram

# Auto-correct common typos
git config help.autocorrect 1
```

### Per-Repository Setup

```bash
cd /home/snatch/Documents/smi\ app/

# Initialize repository
git init

# Add all files from Phase 0
git add .

# Initial commit
git commit -m "chore: initialize project structure

- Create directory layout
- Add .gitignore
- Initialize documentation templates

Phase 0 complete."
```

## .gitignore Configuration

**File:** `.gitignore`

```gitignore
# Compiled JavaScript
*.js~
*.swp
*.swo

# Cinnamon applet temporary files
*~

# Test outputs
tests/*.log
tests/test-results.txt

# Local settings (don't commit user-specific settings)
settings.json
local-config.json

# IDE files
.vscode/
.idea/
*.sublime-*

# System files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Temporary files
tmp/
temp/
*.tmp

# Node modules (if using npm for testing)
node_modules/

# Build artifacts (if any)
dist/
build/

# Generated documentation (if using doc generators)
docs/generated/
```

## Branching Strategy

### Single Branch (Initial Development)

For Phases 0-7, work directly on `main`:
```
main: [Phase 0] -> [Phase 1] -> [Phase 2] -> ... -> [Phase 7]
```

**Rationale:**
- Single developer (AI agent)
- Sequential phases
- No parallel work
- Simple history

### Future Multi-Branch (Post v1.0)

After v1.0 release, adopt branch strategy:

```
main (stable releases)
  |
  ├─ develop (integration branch)
  │    ├─ feature/multi-gpu-support
  │    ├─ feature/historical-graphs
  │    └─ fix/high-temp-threshold
  │
  └─ hotfix/critical-crash (emergency fixes)
```

**Branch naming:**
- `feature/description-here` - New features
- `fix/bug-description` - Bug fixes
- `hotfix/critical-issue` - Emergency fixes
- `refactor/component-name` - Refactoring
- `docs/what-updated` - Documentation

## Tagging Versions

### Version Naming

Follow Semantic Versioning (semver): `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking changes (2.0.0)
- **MINOR:** New features, backward compatible (1.1.0)
- **PATCH:** Bug fixes (1.0.1)

### Creating Tags

**After Phase 7 (v1.0.0):**
```bash
# Update version in metadata.json
# Update CHANGELOG.md with release date

git add metadata.json CHANGELOG.md
git commit -m "chore: bump version to 1.0.0"

# Create annotated tag
git tag -a v1.0.0 -m "Release v1.0.0 - Initial stable release

Features:
- Real-time GPU monitoring
- 1-row and 2x2 layout modes
- Configurable refresh interval
- Temperature color coding
- Full test suite

Tested on: Linux Mint 21.3, Cinnamon 6.0"

# View tag
git tag -l -n9 v1.0.0
```

**Future releases:**
```bash
# Bug fix release
git tag -a v1.0.1 -m "Release v1.0.1

Fixes:
- Memory leak in timer management
- High temperature color not applying"

# Feature release
git tag -a v1.1.0 -m "Release v1.1.0

New Features:
- Multi-GPU support
- Click to open nvidia-settings"
```

## Viewing History

### For AI Agents to Understand Changes

```bash
# View commit history
git log --oneline --graph --decorate

# View recent commits with details
git log -5 --pretty=format:"%h - %an, %ar : %s"

# View changes in specific file
git log --follow -p -- applet.js

# View commits by phase
git log --grep="Phase [0-9]" --oneline

# See what changed between versions
git diff v1.0.0..v1.1.0

# View files changed in commit
git show --stat <commit-hash>

# Search commits by message content
git log --all --grep="memory leak"
```

## Commit Checklist for AI Agents

Before every commit, verify:

- [ ] Code works (no syntax errors)
- [ ] Tests pass (`./tests/test-runner.sh`)
- [ ] No debug logging left in code
- [ ] No commented-out code
- [ ] Commit message follows format
- [ ] Changes are logically grouped
- [ ] Documentation updated if needed
- [ ] CHANGELOG.md updated for user-facing changes

## Commit Workflow

### Standard Commit Process

```bash
# 1. Check status
git status

# 2. Review changes
git diff

# 3. Stage specific files (don't use git add .)
git add applet.js
git add tests/test-parser.js

# 4. Review staged changes
git diff --staged

# 5. Commit with message
git commit -m "feat(parser): add temperature extraction

- Parse gtemp column from nvidia-smi dmon
- Handle missing temperature (returns null)
- Add unit tests for edge cases"

# 6. Verify commit
git log -1
```

### Amending Last Commit (Use Sparingly)

```bash
# Fix typo in last commit message (only if not pushed)
git commit --amend -m "Fixed message"

# Add forgotten file to last commit
git add forgotten-file.js
git commit --amend --no-edit

# WARNING: Only amend commits that haven't been pushed
```

## Undoing Changes

### Safe Undo Operations

```bash
# Unstage file (keep changes)
git reset HEAD file.js

# Discard changes in working directory
git checkout -- file.js

# Undo last commit (keep changes staged)
git reset --soft HEAD~1

# Undo last commit (keep changes unstaged)
git reset HEAD~1

# Undo last commit (discard changes) - DANGEROUS
git reset --hard HEAD~1
```

### For AI Agents: When to Undo

**DO undo if:**
- Committed to wrong branch
- Commit message has error
- Forgot to include file
- Tests fail after commit

**DON'T undo if:**
- Commit already pushed
- Other commits built on top
- Uncertain about side effects

**Instead:** Make a new commit that fixes the issue

## Repository Maintenance

### Keeping History Clean

```bash
# View repository size
du -sh .git

# Check for large files
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  awk '/^blob/ {print substr($0,6)}' | \
  sort -n -k2

# If accidentally committed large file
git filter-branch --tree-filter 'rm -f large-file.bin' HEAD
```

### Regular Maintenance

```bash
# Garbage collection (run monthly)
git gc --aggressive

# Verify repository integrity
git fsck

# Optimize repository
git repack -a -d --depth=250 --window=250
```

## Remote Repository (Future)

### When Publishing to GitHub

```bash
# Add remote
git remote add origin https://github.com/username/gpu-monitor-applet.git

# Verify remote
git remote -v

# Push main branch
git push -u origin main

# Push tags
git push --tags
```

### Syncing Changes

```bash
# Fetch updates (doesn't modify working directory)
git fetch origin

# Pull updates (fetch + merge)
git pull origin main

# Push local commits
git push origin main
```

## Troubleshooting for AI Agents

### Common Issues

**"detached HEAD state":**
```bash
# Get back to main branch
git checkout main
```

**"merge conflict" (shouldn't happen with single agent):**
```bash
# View conflicted files
git status

# If unsure, abort
git merge --abort
```

**"working directory not clean":**
```bash
# Stash changes temporarily
git stash

# Do other work

# Restore changes
git stash pop
```

**Large commit by mistake:**
```bash
# Undo commit, keep changes
git reset HEAD~1

# Split into smaller commits
git add file1.js
git commit -m "feat: add feature part 1"

git add file2.js
git commit -m "feat: add feature part 2"
```

## Reading Git History as an AI Agent

### Understanding Previous Work

When taking over or continuing development:

1. **Read recent commits:**
   ```bash
   git log -10 --pretty=format:"%h %s" --abbrev-commit
   ```

2. **Understand phase progression:**
   ```bash
   git log --grep="Phase" --oneline
   ```

3. **See what changed recently:**
   ```bash
   git log --since="1 week ago" --oneline
   ```

4. **Find when a bug was introduced:**
   ```bash
   git log -S "buggy code pattern" --oneline
   ```

5. **See who changed what:**
   ```bash
   git blame applet.js
   ```

## Best Practices Summary

### DOs

✅ Write descriptive commit messages
✅ Commit frequently (after each logical change)
✅ Test before committing
✅ Use conventional commit format
✅ Update CHANGELOG with user-facing changes
✅ Tag releases with semver
✅ Keep commits focused and atomic
✅ Document WHY in commit messages

### DON'Ts

❌ Commit broken code
❌ Use vague messages ("fix stuff", "update")
❌ Commit multiple unrelated changes together
❌ Commit generated files (unless necessary)
❌ Rewrite published history
❌ Use `git add .` blindly
❌ Forget to update documentation
❌ Commit without testing

---

**Document Version:** 1.0
**Last Updated:** 2025-12-04
**Maintained By:** LLM Agents

## Quick Reference

**Initialize:**
```bash
git init
git add .
git commit -m "chore: initialize project"
```

**Daily workflow:**
```bash
git status              # Check what changed
git diff                # Review changes
git add <files>         # Stage specific files
git commit -m "type: message"  # Commit
git log -5              # Verify
```

**Phase completion:**
```bash
./tests/test-runner.sh  # Run tests
git add .
git commit -m "feat: phase X complete with detailed message"
```
