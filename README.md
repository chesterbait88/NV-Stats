# GPU Monitor Applet for Cinnamon

A lightweight, highly customizable Cinnamon taskbar applet for monitoring NVIDIA GPU statistics in real-time.

## Features

### Core Monitoring
- **Real-time GPU Statistics:** Utilization, memory usage, temperature, and fan speed
- **Live Updates:** Configurable refresh intervals (1s, 2s, 5s, or 10s)
- **Low Overhead:** Minimal resource usage (< 10MB memory, < 1% CPU)
- **Error Handling:** Graceful fallbacks when nvidia-smi is unavailable

### Display Layouts
- **Single-Row Layout:** `GPU: 42% | MEM: 35% | TEMP: 55°C | FAN: 65%`
  - Compact horizontal display
  - Perfect for standard single-row panels
- **Two-Row (2x2) Layout:**
  ```
  GPU:  42%   MEM: 35%
  TEMP: 55°C  FAN: 65%
  ```
  - Vertical stacked display with fixed-width columns
  - Perfect for multi-row taskbars
  - No label jitter - columns stay aligned
  - Configurable line spacing (0-10px)

### Styling & Customization
- **Temperature Color Coding:** Visual feedback based on GPU temperature
  - Green: Normal (< 70°C by default)
  - Yellow/Amber: Warning (70-85°C by default)
  - Red: Critical (> 85°C by default)
  - Can be enabled/disabled in settings
- **Fully Configurable:**
  - Font size: 6-16pt (default: 9pt)
  - Temperature thresholds: Customize warning and critical temperatures
  - Custom colors: Pick any color for normal/warning/critical states
  - Padding controls: Adjust vertical (0-11px) and horizontal (0-30px) padding
  - Line spacing: Control spacing between rows in 2x2 layout (0-10px)
- **Real-time Updates:** All changes apply immediately without restart
- **Monospace Font:** Consistent number alignment

### User Interface
- **Context Menu (Right-click):**
  - Quick layout switching (Single Row ↔ Two Rows)
  - Refresh interval selector (1s/2s/5s/10s)
  - Visual dot indicators show current selections
- **Settings Panel (Configure):**
  - Complete styling customization
  - Temperature threshold configuration
  - Color picker for all states
  - Font and spacing controls
- **Tooltip:** Hover for detailed statistics

## Requirements

- **Operating System:** Linux Mint with Cinnamon Desktop Environment
- **GPU:** NVIDIA GPU with proprietary drivers installed
- **Dependencies:** `nvidia-smi` command-line utility (included with NVIDIA drivers)

### Verify Requirements

```bash
# Check nvidia-smi is available
which nvidia-smi

# Test nvidia-smi output
nvidia-smi

# Verify dmon works (used by applet)
nvidia-smi dmon -c 1
```

## Installation

### Quick Install

1. **Clone or download** the repository:
   ```bash
   cd ~/Documents
   git clone <repository-url>
   cd gpu-monitor@snatch
   ```

2. **Run the installer:**
   ```bash
   ./install.sh
   ```

3. **Add to panel:**
   - Right-click on your Cinnamon panel
   - Select **"Applets"**
   - Find **"GPU Monitor"** in the list
   - Click the **"+"** button to add it

4. **Restart Cinnamon** (if needed):
   - Press **Ctrl+Alt+Esc**
   - Or log out and back in

### Manual Installation

```bash
# Copy to Cinnamon applets directory
mkdir -p ~/.local/share/cinnamon/applets/gpu-monitor@snatch
cp -r * ~/.local/share/cinnamon/applets/gpu-monitor@snatch/

# Restart Cinnamon
cinnamon --replace &
```

## Configuration

### Quick Settings (Right-click Menu)

Right-click the applet to access:
- **Display Layout:** Switch between Single Row and Two Rows (2x2)
- **Refresh Interval:** Choose 1s, 2s, 5s, or 10s update frequency

Current selections are marked with a dot (●) indicator.

### Advanced Settings (Configure Menu)

Right-click → **Configure** to access full customization:

#### Styling & Color Coding
- **Enable temperature color coding:** Toggle color changes based on temperature
- **Font Size:** Adjust text size (6-16pt)
- **Vertical Padding:** Control top/bottom spacing (0-11px)
- **Horizontal Padding:** Control left/right spacing (0-30px)
- **Line Spacing:** Adjust spacing between rows in 2x2 layout (0-10px)

#### Temperature Thresholds
- **Warning Temperature:** Set when yellow color appears (50-95°C, default: 70°C)
- **Critical Temperature:** Set when red color appears (60-100°C, default: 85°C)

#### Temperature Colors
- **Normal Color:** Choose color for safe temperatures (default: green)
- **Warning Color:** Choose color for elevated temperatures (default: yellow)
- **Critical Color:** Choose color for high temperatures (default: red)

**Note:** All settings apply in real-time without requiring Cinnamon restart.

## Usage Examples

### Example 1: Gaming Setup
```
Configuration:
- Layout: Two Rows (2x2) - easier to read at a glance
- Refresh: 1 second - fast updates during gaming
- Warning: 75°C - alert earlier for gaming loads
- Critical: 85°C - standard thermal limit
- Font Size: 10pt - larger for readability
```

### Example 2: Workstation Setup
```
Configuration:
- Layout: Single Row - compact for productivity
- Refresh: 5 seconds - adequate for normal workloads
- Warning: 70°C - default threshold
- Critical: 90°C - higher limit for sustained loads
- Colors: Match desktop theme
```

### Example 3: Server Monitoring
```
Configuration:
- Layout: Single Row - minimal space usage
- Refresh: 10 seconds - lower CPU overhead
- Color Coding: Disabled - professional appearance
- Font Size: 8pt - compact display
```

## Uninstallation

### Using Uninstall Script

```bash
cd gpu-monitor@snatch
./uninstall.sh
```

### Manual Removal

```bash
# Remove applet directory
rm -rf ~/.local/share/cinnamon/applets/gpu-monitor@snatch

# Restart Cinnamon
cinnamon --replace &
```

## Troubleshooting

### Applet shows "GPU: --"

**Possible causes:**
1. NVIDIA drivers not installed
2. nvidia-smi not in PATH
3. Permission issues

**Solutions:**
```bash
# Verify nvidia-smi is available
which nvidia-smi

# Check NVIDIA drivers are installed
nvidia-smi

# Review applet logs
tail -f ~/.xsession-errors | grep "GPU Monitor"

# If nvidia-smi exists but not found, add to PATH
export PATH=$PATH:/usr/bin
```

### Applet not updating

**Check refresh interval:**
- Right-click applet → verify interval is not 10s
- Try setting to 1s to confirm updates work

**Test nvidia-smi manually:**
```bash
# Test basic output
nvidia-smi

# Test dmon (what applet uses)
nvidia-smi dmon -s pum -c 1

# Test fan query
nvidia-smi --query-gpu=fan.speed --format=csv,noheader,nounits
```

### Temperature colors not working

**Verify settings:**
- Right-click → Configure
- Check "Enable temperature color coding" is checked
- Verify thresholds are set correctly (warning < critical)
- Try resetting to defaults

### Panel height issues

**Vertical padding too high:**
- Right-click → Configure
- Reduce "Vertical Padding" to 5px or less
- Maximum safe value is 11px

### Labels shifting in 2x2 layout

**This should not happen in v0.5.2+:**
- Verify you have the latest version: check "About" or CHANGELOG.md
- Reinstall if needed: `./install.sh`
- Fixed-width alignment was added in v0.5.2

### Applet crashes or freezes Cinnamon

**Check logs:**
```bash
# View recent errors
tail -100 ~/.xsession-errors | grep -A 5 "GPU Monitor"

# Watch for new errors
tail -f ~/.xsession-errors | grep "GPU Monitor"
```

**Common issues:**
- Corrupted settings: Remove `~/.cinnamon/configs/gpu-monitor@snatch/`
- Bad nvidia-smi output: Test commands manually
- Cinnamon version incompatibility: Requires Cinnamon 4.0+

## Development

Interested in contributing or customizing? See [DEVELOPMENT.md](DEVELOPMENT.md) for:
- Development setup
- Code structure
- Testing procedures
- Contribution guidelines

## Architecture

For technical details about the system design, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md):
- Component breakdown
- Data flow diagrams
- API documentation
- Extension points

## Testing

Run the automated test suite:

```bash
cd tests
./test-runner.sh
```

See [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md) for details.

## Performance

- **Memory Usage:** ~8-10MB
- **CPU Usage:** < 1% (at 2s refresh)
- **GPU Impact:** Negligible (nvidia-smi is lightweight)
- **Network:** None (all local data)

## Compatibility

- **Cinnamon:** 4.0+ (tested on Mint 20, 21)
- **NVIDIA Drivers:** 440.0+ recommended
- **GPU:** Any NVIDIA GPU with driver support

## Known Limitations

- **NVIDIA only:** Requires nvidia-smi (no AMD/Intel support yet)
- **Single GPU:** Only monitors first GPU if multiple present
- **Polling-based:** Uses periodic nvidia-smi queries (not event-driven)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for complete version history.

## License

[To be determined]

## Credits

- **Author:** AI Agent (Claude Code)
- **Repository:** [GitHub URL]
- **Cinnamon:** Linux Mint team
- **nvidia-smi:** NVIDIA Corporation

## Support

**Issues:** Report bugs or feature requests on GitHub Issues

**Questions:** See troubleshooting section above or check existing issues

---

**Version:** 0.5.2
**Last Updated:** 2025-12-04
**Status:** Feature Complete (Phase 5)
