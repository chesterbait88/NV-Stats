/**
 * GPU Monitor Applet for Cinnamon
 *
 * Displays real-time NVIDIA GPU statistics in the panel
 *
 * @author AI Agent
 * @version 0.5.1
 */

// Import required Cinnamon modules
const Applet = imports.ui.applet;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;
const St = imports.gi.St;
const Settings = imports.ui.settings;
const PopupMenu = imports.ui.popupMenu;

// Debug mode - set to true for verbose logging
const DEBUG_MODE = false;

// Constants
const REFRESH_INTERVAL_DEFAULT = 2; // seconds
const REFRESH_INTERVALS = [1, 2, 5, 10]; // Available refresh intervals in seconds

// Layout modes
const LAYOUT_SINGLE_ROW = 'single-row';
const LAYOUT_TWO_ROW = 'two-row';

/**
 * NVIDIA SMI interface class
 * Handles command execution and data parsing
 */
function NvidiaSMI() {
    this._init();
}

NvidiaSMI.prototype = {
    /**
     * Initialize the NvidiaSMI interface
     */
    _init: function() {
        this._log("NvidiaSMI interface initialized");
    },

    /**
     * Get GPU statistics
     * @returns {Object|null} {gpu: number, mem: number, temp: number, fan: number} or null on error
     */
    getStats: function() {
        try {
            // Get GPU, memory, and temperature from dmon
            const dmonData = this._executeDmon();
            if (!dmonData) {
                return null;
            }

            // Get fan speed separately
            const fanSpeed = this._executeFanQuery();
            if (fanSpeed === null) {
                // Fan speed query failed, but we have other data
                // Use 0 as fallback
                dmonData.fan = 0;
            } else {
                dmonData.fan = fanSpeed;
            }

            this._log("Stats retrieved: " + JSON.stringify(dmonData));
            return dmonData;

        } catch (error) {
            this._logError("Failed to get stats: " + error);
            return null;
        }
    },

    /**
     * Execute nvidia-smi dmon command
     * @returns {Object|null} {gpu: number, mem: number, temp: number} or null
     */
    _executeDmon: function() {
        try {
            const [ok, stdout, stderr, exit_code] = GLib.spawn_command_line_sync(
                'nvidia-smi dmon -s pum -c 1'
            );

            if (!ok || exit_code !== 0) {
                this._logError("nvidia-smi dmon command failed");
                return null;
            }

            const output = stdout.toString();
            return this._parseDmonOutput(output);

        } catch (error) {
            this._logError("Failed to execute nvidia-smi dmon: " + error);
            return null;
        }
    },

    /**
     * Execute nvidia-smi fan speed query
     * @returns {number|null} Fan speed percentage or null
     */
    _executeFanQuery: function() {
        try {
            const [ok, stdout, stderr, exit_code] = GLib.spawn_command_line_sync(
                'nvidia-smi --query-gpu=fan.speed --format=csv,noheader,nounits'
            );

            if (!ok || exit_code !== 0) {
                this._logError("nvidia-smi fan query failed");
                return null;
            }

            const output = stdout.toString();
            return this._parseFanSpeed(output);

        } catch (error) {
            this._logError("Failed to execute nvidia-smi fan query: " + error);
            return null;
        }
    },

    /**
     * Parse nvidia-smi dmon output
     * Expected format:
     * # gpu    pwr  gtemp  mtemp     sm    mem    enc    dec    jpg    ofa     fb   bar1   ccpm
     * # Idx      W      C      C      %      %      %      %      %      %     MB     MB     MB
     *     0    117     45      -     13      6      0      0      0      0   2847     39      0
     *
     * @param {string} stdout - Command output
     * @returns {Object|null} {gpu: number, mem: number, temp: number} or null
     */
    _parseDmonOutput: function(stdout) {
        if (!stdout || stdout.trim() === '') {
            this._logError("Empty dmon output");
            return null;
        }

        // Split into lines and filter out header lines (starting with #)
        const lines = stdout.split('\n').filter(line => !line.startsWith('#') && line.trim() !== '');

        if (lines.length === 0) {
            this._logError("No data lines in dmon output");
            return null;
        }

        // Parse the first data line
        const dataLine = lines[0];

        // Split by whitespace and filter empty strings
        const values = dataLine.trim().split(/\s+/).filter(v => v !== '');

        // Expected format (0-indexed):
        // 0: gpu idx, 1: power, 2: gtemp, 3: mtemp, 4: sm, 5: mem, ...
        if (values.length < 6) {
            this._logError("Insufficient values in dmon output: " + dataLine);
            return null;
        }

        try {
            const gpu = parseInt(values[4]);   // sm (GPU utilization %)
            const mem = parseInt(values[5]);   // mem (Memory utilization %)
            const temp = parseInt(values[2]);  // gtemp (GPU temperature °C)

            // Validate parsed values
            if (isNaN(gpu) || isNaN(mem) || isNaN(temp)) {
                this._logError("Failed to parse numeric values from: " + dataLine);
                return null;
            }

            return {
                gpu: gpu,
                mem: mem,
                temp: temp
            };

        } catch (error) {
            this._logError("Parse error: " + error);
            return null;
        }
    },

    /**
     * Parse fan speed output
     * Expected format: "55\n" or "55"
     *
     * @param {string} stdout - Command output
     * @returns {number|null} Fan speed percentage or null
     */
    _parseFanSpeed: function(stdout) {
        if (!stdout || stdout.trim() === '') {
            this._logError("Empty fan speed output");
            return null;
        }

        const trimmed = stdout.trim();
        const match = trimmed.match(/(\d+)/);

        if (!match) {
            this._logError("No numeric value found in fan speed output: " + trimmed);
            return null;
        }

        const fanSpeed = parseInt(match[1]);

        if (isNaN(fanSpeed) || fanSpeed < 0 || fanSpeed > 100) {
            this._logError("Invalid fan speed value: " + fanSpeed);
            return null;
        }

        return fanSpeed;
    },

    /**
     * Logging helper
     * @param {string} message - Message to log
     */
    _log: function(message) {
        if (DEBUG_MODE) {
            global.log("[GPU Monitor] [NvidiaSMI] " + message);
        }
    },

    /**
     * Error logging helper
     * @param {string} message - Error message
     */
    _logError: function(message) {
        global.logError("[GPU Monitor] [NvidiaSMI] ERROR: " + message);
    }
};

/**
 * Layout Manager class
 * Handles formatting GPU stats for different layout modes
 */
function LayoutManager() {
    this._init();
}

LayoutManager.prototype = {
    /**
     * Initialize the LayoutManager
     */
    _init: function() {
        this.currentLayout = LAYOUT_SINGLE_ROW;
        this._log("LayoutManager initialized with layout: " + this.currentLayout);
    },

    /**
     * Set the current layout mode
     * @param {string} layout - Layout mode (LAYOUT_SINGLE_ROW or LAYOUT_TWO_ROW)
     */
    setLayout: function(layout) {
        if (layout !== LAYOUT_SINGLE_ROW && layout !== LAYOUT_TWO_ROW) {
            this._logError("Invalid layout mode: " + layout);
            return;
        }
        this.currentLayout = layout;
        this._log("Layout changed to: " + layout);
    },

    /**
     * Get the current layout mode
     * @returns {string} Current layout mode
     */
    getLayout: function() {
        return this.currentLayout;
    },

    /**
     * Format stats for single-row display
     * @param {Object} stats - {gpu: number, mem: number, temp: number, fan: number}
     * @returns {string} Formatted string
     */
    formatSingleRow: function(stats) {
        return "GPU: " + stats.gpu + "% | " +
               "MEM: " + stats.mem + "% | " +
               "TEMP: " + stats.temp + "°C | " +
               "FAN: " + stats.fan + "%";
    },

    /**
     * Format stats for two-row (2x2) display
     * @param {Object} stats - {gpu: number, mem: number, temp: number, fan: number}
     * @returns {Object} {row1: string, row2: string}
     */
    formatTwoRow: function(stats) {
        return {
            row1: "GPU: " + stats.gpu + "% MEM: " + stats.mem + "%",
            row2: "TEMP: " + stats.temp + "°C FAN: " + stats.fan + "%"
        };
    },

    /**
     * Format stats according to current layout
     * @param {Object} stats - GPU statistics
     * @returns {Object|string} Formatted output (string for single-row, object for two-row)
     */
    format: function(stats) {
        if (this.currentLayout === LAYOUT_TWO_ROW) {
            return this.formatTwoRow(stats);
        } else {
            return this.formatSingleRow(stats);
        }
    },

    /**
     * Logging helper
     * @param {string} message - Message to log
     */
    _log: function(message) {
        if (DEBUG_MODE) {
            global.log("[GPU Monitor] [LayoutManager] " + message);
        }
    },

    /**
     * Error logging helper
     * @param {string} message - Error message
     */
    _logError: function(message) {
        global.logError("[GPU Monitor] [LayoutManager] ERROR: " + message);
    }
};

/**
 * Main applet class
 * Now extends base Applet (not TextApplet) to support custom widgets
 */
function MyApplet(metadata, orientation, panel_height, instance_id) {
    this._init(metadata, orientation, panel_height, instance_id);
}

MyApplet.prototype = {
    __proto__: Applet.Applet.prototype,

    /**
     * Initialize the applet
     *
     * @param {Object} metadata - Applet metadata from metadata.json
     * @param {Number} orientation - Panel orientation
     * @param {Number} panel_height - Height of the panel
     * @param {Number} instance_id - Unique instance identifier
     */
    _init: function(metadata, orientation, panel_height, instance_id) {
        Applet.Applet.prototype._init.call(this, orientation, panel_height, instance_id);

        // Store metadata and instance info
        this.metadata = metadata;
        this.instance_id = instance_id;
        this.orientation = orientation;

        // Initialize settings
        try {
            this.settings = new Settings.AppletSettings(this, metadata.uuid, instance_id);
            this.settings.bind("layout", "layoutMode", this._onLayoutChanged.bind(this));
            this.settings.bind("refreshInterval", "refreshInterval", this._onRefreshIntervalChanged.bind(this));

            // Styling settings
            this.settings.bind("enableColorCoding", "enableColorCoding", this._onStyleChanged.bind(this));
            this.settings.bind("fontSize", "fontSize", this._onStyleChanged.bind(this));
            this.settings.bind("verticalPadding", "verticalPadding", this._onStyleChanged.bind(this));
            this.settings.bind("horizontalPadding", "horizontalPadding", this._onStyleChanged.bind(this));
            this.settings.bind("lineSpacing", "lineSpacing", this._onStyleChanged.bind(this));
            this.settings.bind("tempWarningThreshold", "tempWarningThreshold", this._onStyleChanged.bind(this));
            this.settings.bind("tempCriticalThreshold", "tempCriticalThreshold", this._onStyleChanged.bind(this));
            this.settings.bind("colorNormal", "colorNormal", this._onStyleChanged.bind(this));
            this.settings.bind("colorWarning", "colorWarning", this._onStyleChanged.bind(this));
            this.settings.bind("colorCritical", "colorCritical", this._onStyleChanged.bind(this));

            this._log("Settings initialized successfully");
        } catch (error) {
            // If settings fail, use defaults
            this.layoutMode = LAYOUT_SINGLE_ROW;
            this.refreshInterval = REFRESH_INTERVAL_DEFAULT;
            this.enableColorCoding = true;
            this.fontSize = 9;
            this.verticalPadding = 2;
            this.horizontalPadding = 8;
            this.lineSpacing = 4;
            this.tempWarningThreshold = 70;
            this.tempCriticalThreshold = 85;
            this.colorNormal = "rgba(74, 222, 128, 1.0)";
            this.colorWarning = "rgba(251, 191, 36, 1.0)";
            this.colorCritical = "rgba(239, 68, 68, 1.0)";
            this._logError("Settings initialization failed, using defaults: " + error);
        }

        // Initialize components
        this.nvidiaSMI = new NvidiaSMI();
        this.layoutManager = new LayoutManager();
        this.layoutManager.setLayout(this.layoutMode || LAYOUT_SINGLE_ROW);

        // Timer state
        this._timerId = null;
        if (!this.refreshInterval) {
            this.refreshInterval = REFRESH_INTERVAL_DEFAULT;
        }

        // Error tracking
        this._errorCount = 0;
        this._consecutiveErrors = 0;

        // Create UI
        this._createUI();

        // Set tooltip
        this.set_applet_tooltip("NVIDIA GPU Monitor\nInitializing...");

        // Ensure actor responds to events properly
        this.actor.set_reactive(true);

        // Create context menu items (will be called after parent is fully initialized)
        // Delay slightly to ensure context menu is ready
        Mainloop.idle_add(() => {
            this._setupContextMenu();
            return false;
        });

        // Log initialization
        this._log("Applet initialized with layout: " + this.layoutMode);
    },

    /**
     * Set up the right-click context menu items
     */
    _setupContextMenu: function() {
        // Add separator before our custom items
        this._applet_context_menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Layout section header
        let layoutHeader = new PopupMenu.PopupMenuItem("Display Layout", { reactive: false });
        this._applet_context_menu.addMenuItem(layoutHeader);

        // Single-row layout option
        this._singleRowItem = new PopupMenu.PopupMenuItem("  Single Row");
        this._singleRowItem.connect('activate', () => {
            this._onMenuLayoutChanged(LAYOUT_SINGLE_ROW);
        });
        this._applet_context_menu.addMenuItem(this._singleRowItem);

        // Two-row layout option
        this._twoRowItem = new PopupMenu.PopupMenuItem("  Two Rows (2x2)");
        this._twoRowItem.connect('activate', () => {
            this._onMenuLayoutChanged(LAYOUT_TWO_ROW);
        });
        this._applet_context_menu.addMenuItem(this._twoRowItem);

        // Refresh interval section
        this._applet_context_menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        let refreshHeader = new PopupMenu.PopupMenuItem("Refresh Interval", { reactive: false });
        this._applet_context_menu.addMenuItem(refreshHeader);

        // Create refresh interval menu items
        this._refreshItems = {};
        for (let interval of REFRESH_INTERVALS) {
            let item = new PopupMenu.PopupMenuItem("  " + interval + " second" + (interval > 1 ? "s" : ""));
            item.connect('activate', () => {
                this._onMenuRefreshChanged(interval);
            });
            this._applet_context_menu.addMenuItem(item);
            this._refreshItems[interval] = item;
        }

        // Update menu to show current selections
        this._updateMenuStates();

        this._log("Context menu items added");
    },

    /**
     * Override to prevent left-click from doing anything
     */
    on_applet_clicked: function(event) {
        // Do nothing on left-click
        return false;
    },

    /**
     * Update menu items to show current selections
     */
    _updateMenuStates: function() {
        // Update layout indicators
        const currentLayout = this.layoutManager.getLayout();
        if (this._singleRowItem && this._twoRowItem) {
            this._singleRowItem.setShowDot(currentLayout === LAYOUT_SINGLE_ROW);
            this._twoRowItem.setShowDot(currentLayout === LAYOUT_TWO_ROW);
        }

        // Update refresh interval indicators
        for (let interval in this._refreshItems) {
            let item = this._refreshItems[interval];
            item.setShowDot(parseInt(interval) === this.refreshInterval);
        }

        this._log("Menu states updated - Layout: " + currentLayout + ", Interval: " + this.refreshInterval);
    },

    /**
     * Handle layout change from context menu
     */
    _onMenuLayoutChanged: function(newLayout) {
        this._log("Menu: Layout changed to " + newLayout);

        // Update layout mode
        this.layoutMode = newLayout;

        // Update layout manager
        this.layoutManager.setLayout(newLayout);

        // Recreate UI with new layout
        this._createUI();

        // Force immediate update
        this._update();

        // Save to settings
        if (this.settings) {
            try {
                this.settings.setValue("layout", newLayout);
            } catch (e) {
                this._logError("Failed to save layout setting: " + e);
            }
        }

        // Update menu dots
        this._updateMenuStates();
    },

    /**
     * Handle refresh interval change from context menu
     */
    _onMenuRefreshChanged: function(newInterval) {
        this._log("Menu: Refresh interval changed to " + newInterval + "s");

        this.refreshInterval = newInterval;

        // Restart timer with new interval
        this._stopTimer();
        this._startTimer();

        // Save to settings if available
        if (this.settings) {
            this.settings.setValue("refreshInterval", newInterval);
        }

        this._updateMenuStates();
    },


    /**
     * Create the applet UI based on current layout
     */
    _createUI: function() {
        // Remove old widgets if they exist
        if (this._mainBox) {
            this._mainBox.destroy();
            this._mainBox = null;
            this._label1 = null;
            this._label2 = null;
        }

        const layout = this.layoutManager.getLayout();

        // Get padding values
        const vPad = (this.verticalPadding !== undefined) ? this.verticalPadding : 2;
        const hPad = (this.horizontalPadding !== undefined) ? this.horizontalPadding : 8;
        const lineSpace = (this.lineSpacing !== undefined) ? this.lineSpacing : 4;

        if (layout === LAYOUT_TWO_ROW) {
            // Create vertical box for two-row layout
            this._mainBox = new St.BoxLayout({
                vertical: true,
                style_class: 'gpu-monitor-box',
                style: 'padding: ' + vPad + 'px ' + hPad + 'px; spacing: ' + lineSpace + 'px;'
            });

            // Create two labels with dynamic font size
            const fontSize = this.fontSize || 9;
            this._label1 = new St.Label({
                text: 'GPU: -- MEM: --',
                style_class: 'gpu-monitor-label',
                style: 'font-size: ' + fontSize + 'pt; font-family: monospace; padding: 1px 0px;'
            });
            this._label2 = new St.Label({
                text: 'TEMP: -- FAN: --',
                style_class: 'gpu-monitor-label',
                style: 'font-size: ' + fontSize + 'pt; font-family: monospace; padding: 1px 0px;'
            });

            this._mainBox.add(this._label1);
            this._mainBox.add(this._label2);
            this.actor.add_actor(this._mainBox);

            this._log("Created two-row UI with font size: " + fontSize + "pt, padding: " + vPad + "px " + hPad + "px, spacing: " + lineSpace + "px");
        } else {
            // Create single label for single-row layout
            this._mainBox = new St.BoxLayout({
                vertical: false,
                style_class: 'gpu-monitor-box',
                style: 'padding: ' + vPad + 'px ' + hPad + 'px;'
            });

            const fontSize = this.fontSize || 9;
            this._label1 = new St.Label({
                text: 'GPU: --',
                style_class: 'gpu-monitor-label',
                style: 'font-size: ' + fontSize + 'pt; font-family: monospace;'
            });

            this._mainBox.add(this._label1);
            this.actor.add_actor(this._mainBox);

            // Clear second label reference
            this._label2 = null;

            this._log("Created single-row UI with font size: " + fontSize + "pt, padding: " + vPad + "px " + hPad + "px");
        }
    },

    /**
     * Called when layout setting changes
     */
    _onLayoutChanged: function() {
        this._log("Layout changed to: " + this.layoutMode);
        this.layoutManager.setLayout(this.layoutMode);
        this._createUI();
        // Force immediate update with current layout
        this._update();
        // Update menu if it exists
        if (this._applet_context_menu) {
            this._updateMenuStates();
        }
    },

    /**
     * Called when refresh interval setting changes
     */
    _onRefreshIntervalChanged: function() {
        this._log("Refresh interval changed to: " + this.refreshInterval + "s");
        // Restart timer with new interval
        if (this._timerId) {
            this._stopTimer();
            this._startTimer();
        }
        // Update menu if it exists
        if (this._applet_context_menu) {
            this._updateMenuStates();
        }
    },

    /**
     * Called when any styling setting changes
     */
    _onStyleChanged: function() {
        this._log("Styling settings changed - updating display");
        // Recreate UI to apply font size changes
        this._createUI();
        // Force immediate update to apply new colors/thresholds
        this._update();
    },

    /**
     * Called when applet is added to the panel
     * Start GPU monitoring timer
     */
    on_applet_added_to_panel: function() {
        this._log("Applet added to panel");

        // Do initial update immediately
        this._update();

        // Start periodic timer
        this._startTimer();
    },

    /**
     * Called when applet is removed from panel
     * Cleanup any timers or resources here
     */
    on_applet_removed_from_panel: function() {
        this._log("Applet removed from panel");

        // Stop and cleanup timer
        this._stopTimer();
    },

    /**
     * Start the periodic update timer
     */
    _startTimer: function() {
        // Cancel existing timer if any
        if (this._timerId) {
            Mainloop.source_remove(this._timerId);
            this._timerId = null;
        }

        // Start new timer
        this._timerId = Mainloop.timeout_add_seconds(this.refreshInterval, () => {
            this._update();
            return true; // Continue timer
        });

        this._log("Timer started with interval: " + this.refreshInterval + "s");
    },

    /**
     * Stop the periodic update timer
     */
    _stopTimer: function() {
        if (this._timerId) {
            Mainloop.source_remove(this._timerId);
            this._timerId = null;
            this._log("Timer stopped");
        }
    },

    /**
     * Update GPU statistics and display
     */
    _update: function() {
        try {
            // Get stats from nvidia-smi
            const stats = this.nvidiaSMI.getStats();

            if (stats === null) {
                // Error getting stats
                this._handleError("Failed to get GPU stats");
                return;
            }

            // Reset error counter on success
            this._consecutiveErrors = 0;

            // Update display
            this._updateDisplay(stats);

            // Update tooltip
            this._updateTooltip(stats);

        } catch (error) {
            this._logError("Update error: " + error);
            this._handleError("Update exception: " + error);
        }
    },

    /**
     * Update the applet display with GPU stats
     *
     * @param {Object} stats - {gpu: number, mem: number, temp: number, fan: number}
     */
    _updateDisplay: function(stats) {
        const layout = this.layoutManager.getLayout();
        const formatted = this.layoutManager.format(stats);

        if (layout === LAYOUT_TWO_ROW) {
            // Two-row layout
            if (this._label1 && this._label2) {
                this._label1.set_text(formatted.row1);
                this._label2.set_text(formatted.row2);
                // Apply temperature styling to both rows
                this._applyTemperatureStyle(this._label1, stats.temp);
                this._applyTemperatureStyle(this._label2, stats.temp);
                this._log("Display updated (2-row): " + formatted.row1 + " / " + formatted.row2);
            }
        } else {
            // Single-row layout
            if (this._label1) {
                this._label1.set_text(formatted);
                // Apply temperature styling to the label
                this._applyTemperatureStyle(this._label1, stats.temp);
                this._log("Display updated (1-row): " + formatted);
            }
        }
    },

    /**
     * Update the tooltip with detailed information
     *
     * @param {Object} stats - GPU statistics
     */
    _updateTooltip: function(stats) {
        const tooltip = "NVIDIA GPU Monitor\n\n" +
                       "GPU Utilization: " + stats.gpu + "%\n" +
                       "Memory Usage: " + stats.mem + "%\n" +
                       "Temperature: " + stats.temp + "°C\n" +
                       "Fan Speed: " + stats.fan + "%\n\n" +
                       "Refresh: " + this.refreshInterval + "s";

        this.set_applet_tooltip(tooltip);
    },

    /**
     * Get temperature-based color for color coding
     *
     * @param {number} temp - Temperature in Celsius
     * @returns {string} Color string (rgba format) for temperature
     */
    getTemperatureColor: function(temp) {
        // Get thresholds from settings (with defaults)
        const warningThreshold = this.tempWarningThreshold || 70;
        const criticalThreshold = this.tempCriticalThreshold || 85;

        if (temp < warningThreshold) {
            return this.colorNormal || "rgba(74, 222, 128, 1.0)";
        } else if (temp >= warningThreshold && temp < criticalThreshold) {
            return this.colorWarning || "rgba(251, 191, 36, 1.0)";
        } else {
            return this.colorCritical || "rgba(239, 68, 68, 1.0)";
        }
    },

    /**
     * Apply temperature-based styling to label
     *
     * @param {St.Label} label - Label to style
     * @param {number} temp - Current temperature
     */
    _applyTemperatureStyle: function(label, temp) {
        if (!label) return;

        // Check if color coding is enabled
        const colorCodingEnabled = (this.enableColorCoding !== undefined) ? this.enableColorCoding : true;

        if (!colorCodingEnabled) {
            // Reset to default color (white)
            const fontSize = this.fontSize || 9;
            label.set_style('font-size: ' + fontSize + 'pt; font-family: monospace; color: #ffffff;');
            this._log("Color coding disabled - using default color");
            return;
        }

        // Get temperature color from settings
        const tempColor = this.getTemperatureColor(temp);
        const fontSize = this.fontSize || 9;

        // Apply inline style with color
        label.set_style('font-size: ' + fontSize + 'pt; font-family: monospace; color: ' + tempColor + ';');

        this._log("Applied temperature color: " + tempColor + " for " + temp + "°C");
    },

    /**
     * Handle errors gracefully
     *
     * @param {string} reason - Error reason
     */
    _handleError: function(reason) {
        this._consecutiveErrors++;

        // Only log first error and every 10th error to avoid spam
        if (this._consecutiveErrors === 1 || this._consecutiveErrors % 10 === 0) {
            this._logError(reason + " (consecutive errors: " + this._consecutiveErrors + ")");
        }

        // Update display to show error state
        if (this._consecutiveErrors === 1) {
            const layout = this.layoutManager.getLayout();

            if (layout === LAYOUT_TWO_ROW) {
                if (this._label1 && this._label2) {
                    this._label1.set_text("GPU: -- MEM: --");
                    this._label2.set_text("TEMP: -- FAN: --");
                }
            } else {
                if (this._label1) {
                    this._label1.set_text("GPU: --");
                }
            }

            this.set_applet_tooltip("NVIDIA GPU Monitor\n\nError: " + reason + "\n\n" +
                                   "Check that:\n" +
                                   "- NVIDIA drivers are installed\n" +
                                   "- nvidia-smi command is available\n" +
                                   "- You have permission to access GPU");
        }
    },

    /**
     * Logging helper for debugging
     *
     * @param {String} message - Message to log
     */
    _log: function(message) {
        if (DEBUG_MODE) {
            global.log("[GPU Monitor] " + message);
        }
    },

    /**
     * Error logging helper
     *
     * @param {String} message - Error message to log
     */
    _logError: function(message) {
        global.logError("[GPU Monitor] ERROR: " + message);
    }
};

/**
 * Entry point - called by Cinnamon to create applet instance
 *
 * @param {Object} metadata - Applet metadata
 * @param {Number} orientation - Panel orientation
 * @param {Number} panel_height - Panel height
 * @param {Number} instance_id - Instance ID
 * @returns {MyApplet} Applet instance
 */
function main(metadata, orientation, panel_height, instance_id) {
    return new MyApplet(metadata, orientation, panel_height, instance_id);
}
