# GPU Monitor Applet for Cinnamon - Project Blueprint

## Project Overview

A lightweight Cinnamon taskbar applet that displays real-time NVIDIA GPU statistics in a compact quad-layout format showing:
- GPU Utilization
- Memory Usage
- Temperature
- Fan Speed

## Visual Design

```
┌──────────────────────────────────────────┐
│  GPU: 29% | MEM: 12% | TEMP: 47°C | FAN: 35% │
└──────────────────────────────────────────┘
```

## Technical Architecture

### 1. Data Collection Strategy

**Approach: nvidia-smi dmon (Recommended)**

We'll use `nvidia-smi dmon` rather than the daemon/replay approach for the following reasons:

**Advantages:**
- Real-time data with configurable refresh intervals (1-10 seconds)
- No persistent storage requirements
- Lower system overhead
- Direct stdout parsing (simpler implementation)
- Better for desktop applet use case

**Command Structure:**
```bash
nvidia-smi dmon -s pum -d 2 -c 0
```

**Flags Explained:**
- `-s pum`: Select metrics (p=power/temp, u=utilization, m=memory)
- `-d 2`: 2-second delay between samples
- `-c 0`: Continuous collection (infinite samples)

**Sample Output:**
```
# gpu    pwr  gtemp  mtemp     sm    mem    enc    dec    jpg    ofa     fb   bar1   ccpm
# Idx      W      C      C      %      %      %      %      %      %     MB     MB     MB
    0    117     45      -     13      6      0      0      0      0   2847     39      0
```

**Data Mapping:**
- GPU Utilization: `sm` column (SM activity %)
- Memory Usage: `mem` column (Memory controller utilization %)
- Temperature: `gtemp` column (GPU temperature in °C)
- Fan Speed: Requires separate query via `nvidia-smi --query-gpu=fan.speed --format=csv,noheader,nounits`

### 2. Cinnamon Applet Structure

**Installation Path:**
```
~/.local/share/cinnamon/applets/gpu-monitor@your-domain/
```

**Required Files:**

1. **metadata.json** - Applet metadata
2. **applet.js** - Main applet logic (JavaScript)
3. **settings-schema.json** - User preferences (optional)
4. **stylesheet.css** - Custom styling (optional)
5. **icon.png** - Applet icon (optional)

### 3. File Structure

```
gpu-monitor@your-domain/
├── metadata.json
├── applet.js
├── settings-schema.json (optional)
├── stylesheet.css (optional)
└── icon.png (optional)
```

## Implementation Plan

### Phase 1: Basic Applet Setup

**metadata.json:**
```json
{
  "uuid": "gpu-monitor@snatch",
  "name": "GPU Monitor",
  "description": "Display NVIDIA GPU stats: utilization, memory, temperature, and fan speed",
  "icon": "video-display",
  "max-instances": 1
}
```

**Key Features:**
- Single instance only (max-instances: 1)
- Unique UUID format: appletname@username
- Uses system icon for GPU/video

### Phase 2: Core Functionality (applet.js)

**Architecture Components:**

1. **Applet Class Extension**
   - Extend `Applets.TextApplet` or `Applets.Applet`
   - Initialize label for displaying stats
   - Set up periodic refresh timer

2. **Data Collection Module**
   - Spawn `nvidia-smi dmon` subprocess
   - Parse stdout using regex/split operations
   - Handle two separate commands:
     - Command 1: `nvidia-smi dmon -s pum -c 1` (single sample)
     - Command 2: `nvidia-smi --query-gpu=fan.speed --format=csv,noheader,nounits`

3. **Data Parser**
   - Extract values from dmon output
   - Parse columns: gpu, sm, mem, gtemp
   - Parse fan speed from separate query
   - Handle error cases (command not found, permission issues)

4. **Display Formatter**
   - Format string: "GPU: %d%% | MEM: %d%% | TEMP: %d°C | FAN: %d%%"
   - Color coding (optional):
     - Normal: < 70°C (white/default)
     - Warning: 70-85°C (yellow)
     - Critical: > 85°C (red)
   - Handle missing data gracefully

5. **Update Timer**
   - Use `Mainloop.timeout_add_seconds()` for periodic updates
   - Default: 2-second refresh interval
   - Cleanup on applet removal

### Phase 3: Advanced Features (Optional)

**Settings Panel (settings-schema.json):**
```json
{
  "refresh-interval": {
    "type": "spinbutton",
    "default": 2,
    "min": 1,
    "max": 10,
    "step": 1,
    "units": "seconds",
    "description": "Refresh interval"
  },
  "show-fan": {
    "type": "checkbox",
    "default": true,
    "description": "Show fan speed"
  },
  "color-warning": {
    "type": "checkbox",
    "default": true,
    "description": "Enable temperature color warnings"
  }
}
```

**Tooltip on Hover:**
- Detailed stats breakdown
- Current power consumption
- Memory usage (MB/GB)
- Clock speeds

**Click Actions:**
- Left-click: Launch nvidia-settings
- Right-click: Context menu with refresh/preferences

### Phase 4: Error Handling & Edge Cases

**Scenarios to Handle:**

1. **NVIDIA Driver Not Installed**
   - Display: "NO GPU"
   - Tooltip: "nvidia-smi not found"

2. **Permission Denied**
   - Display: "GPU: ERR"
   - Tooltip: "Permission denied"

3. **Multiple GPUs**
   - Phase 1: Display GPU 0 only
   - Future: Dropdown to select GPU or average all

4. **Command Timeout**
   - Implement 5-second timeout
   - Display last known values with "(stale)" indicator

## Technology Stack

**Language:** JavaScript (GJS - GNOME JavaScript bindings)

**Dependencies:**
- Cinnamon Desktop Environment
- NVIDIA drivers with nvidia-smi utility
- GLib/GObject libraries (included with Cinnamon)

**Key APIs:**
- `Applets.TextApplet` - Base class for text-based applets
- `GLib.spawn_command_line_sync()` - Execute shell commands
- `Mainloop.timeout_add_seconds()` - Periodic timer
- `PopupMenu` - For click interactions (optional)

## Implementation Steps

1. **Create Project Directory**
   ```bash
   mkdir -p ~/.local/share/cinnamon/applets/gpu-monitor@snatch
   cd ~/.local/share/cinnamon/applets/gpu-monitor@snatch
   ```

2. **Create metadata.json**
   - Define UUID, name, description

3. **Create applet.js**
   - Import required modules
   - Define MyApplet class extending Applets.TextApplet
   - Implement main() function
   - Add _update() method for data collection
   - Add _refreshUI() method for display

4. **Test & Debug**
   - Restart Cinnamon (Ctrl+Alt+Esc)
   - Add applet to panel via "Add applets to panel"
   - Monitor ~/.xsession-errors for debug output

5. **Iterate & Enhance**
   - Add settings panel
   - Implement color coding
   - Add tooltip
   - Create custom icon

## Testing Strategy

**Unit Testing:**
- Test command parsing with sample nvidia-smi output
- Test error handling with invalid data
- Test refresh timer behavior

**Integration Testing:**
- Test on fresh Cinnamon install
- Test with/without NVIDIA drivers
- Test with single/multiple GPUs
- Test panel position changes (top/bottom/left/right)

**Performance Testing:**
- Monitor CPU usage of applet process
- Test memory leaks over 24-hour period
- Ensure no UI blocking during command execution

## Performance Considerations

**Optimization Strategies:**

1. **Asynchronous Command Execution**
   - Use `GLib.spawn_async()` instead of sync version
   - Prevent UI blocking during nvidia-smi calls

2. **Efficient Parsing**
   - Use string split() rather than heavy regex
   - Cache last valid values

3. **Minimal Redraws**
   - Only update label when values change
   - Throttle updates if values unchanged

4. **Resource Cleanup**
   - Cancel timers in on_applet_removed_from_panel()
   - Kill spawned processes properly

## Estimated Resource Usage

- **Memory:** ~5-10 MB
- **CPU:** <1% (during 2-second idle)
- **Disk I/O:** None (no logging)
- **Network:** None

## Future Enhancements

**Version 2.0:**
- Historical graphs (last 60 seconds)
- Click to expand detailed view
- Multi-GPU support with selector
- Export stats to CSV
- Desktop notifications for thermal throttling

**Version 3.0:**
- Support for AMD GPUs (via radeontop)
- GPU process monitor (which app using GPU)
- Power limit adjustment controls
- Integration with system monitor applet

## References & Resources

### Official Documentation
- [Linux Mint Cinnamon Applet Tutorial](https://projects.linuxmint.com/reference/git/cinnamon-tutorials/write-applet.html)
- [Cinnamon Spices Applets Repository](https://github.com/linuxmint/cinnamon-spices-applets)
- [Cinnamon Development Wiki](https://github.com/linuxmint/cinnamon/wiki/Development)

### Community Tutorials
- [Writing a Cinnamon Applet - Nick Durante](https://nickdurante.github.io/development/Writing-a-Cinnamon-Applet/)
- [Writing a Simple Task Applet - Medium](https://medium.com/swlh/writing-a-simple-task-applet-for-cinnamon-desktop-38cc4e499372)
- [Writing Panel Applet for Cinnamon: The Basics](https://billauer.co.il/blog/2018/12/writing-cinnamon-applet/)

### NVIDIA Resources
- `nvidia-smi --help-query-gpu` - Full list of queryable metrics
- `nvidia-smi dmon -h` - Detailed dmon usage
- NVIDIA System Management Interface documentation

## Getting Started

To begin implementation:

1. Review this blueprint thoroughly
2. Set up development environment
3. Create basic metadata.json and applet.js
4. Test basic text display
5. Add nvidia-smi integration
6. Iterate on features

## Questions to Consider Before Implementation

1. **Update Frequency:** 2 seconds vs 5 seconds vs user-configurable?
2. **Display Format:** Fixed width or dynamic based on values?
3. **Multi-GPU:** Support now or defer to v2.0?
4. **Styling:** Use default theme or custom colors?
5. **Click Behavior:** Launch nvidia-settings or show detailed popup?

---

**Project Status:** Blueprint Complete - Ready for Implementation

**Estimated Development Time:** 4-8 hours for MVP (Phase 1-2)

**Difficulty Level:** Intermediate (requires JavaScript/GJS knowledge)

**Maintainability:** High (simple architecture, well-documented APIs)
