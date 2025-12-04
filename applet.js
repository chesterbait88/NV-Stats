/**
 * GPU Monitor Applet for Cinnamon
 *
 * Displays real-time NVIDIA GPU statistics in the panel
 *
 * @author AI Agent
 * @version 0.2.0
 */

// Import required Cinnamon modules
const Applet = imports.ui.applet;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;

// Debug mode - set to true for verbose logging
const DEBUG_MODE = false;

// Constants
const REFRESH_INTERVAL_DEFAULT = 2; // seconds

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
 * Main applet class extending TextApplet for text-based display
 */
function MyApplet(metadata, orientation, panel_height, instance_id) {
    this._init(metadata, orientation, panel_height, instance_id);
}

MyApplet.prototype = {
    __proto__: Applet.TextApplet.prototype,

    /**
     * Initialize the applet
     *
     * @param {Object} metadata - Applet metadata from metadata.json
     * @param {Number} orientation - Panel orientation
     * @param {Number} panel_height - Height of the panel
     * @param {Number} instance_id - Unique instance identifier
     */
    _init: function(metadata, orientation, panel_height, instance_id) {
        Applet.TextApplet.prototype._init.call(this, orientation, panel_height, instance_id);

        // Store metadata
        this.metadata = metadata;

        // Initialize NvidiaSMI interface
        this.nvidiaSMI = new NvidiaSMI();

        // Timer state
        this._timerId = null;
        this.refreshInterval = REFRESH_INTERVAL_DEFAULT;

        // Error tracking
        this._errorCount = 0;
        this._consecutiveErrors = 0;

        // Set initial display text
        this.set_applet_label("GPU: --");

        // Set tooltip
        this.set_applet_tooltip("NVIDIA GPU Monitor\nInitializing...");

        // Log initialization
        this._log("Applet initialized");
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
        // Format: "GPU: 42% | MEM: 35% | TEMP: 55°C | FAN: 65%"
        const label = "GPU: " + stats.gpu + "% | " +
                      "MEM: " + stats.mem + "% | " +
                      "TEMP: " + stats.temp + "°C | " +
                      "FAN: " + stats.fan + "%";

        this.set_applet_label(label);
        this._log("Display updated: " + label);
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
            this.set_applet_label("GPU: --");
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
