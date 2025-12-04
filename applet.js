/**
 * GPU Monitor Applet for Cinnamon
 *
 * Displays real-time NVIDIA GPU statistics in the panel
 *
 * @author AI Agent
 * @version 0.1.0
 */

// Import required Cinnamon modules
const Applet = imports.ui.applet;
const Lang = imports.lang;
const Mainloop = imports.mainloop;

// Debug mode - set to true for verbose logging
const DEBUG_MODE = false;

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

        // Set initial display text
        this.set_applet_label("GPU Monitor");

        // Set tooltip
        this.set_applet_tooltip("NVIDIA GPU Monitor\nClick to configure");

        // Log initialization
        this._log("Applet initialized");
    },

    /**
     * Called when applet is added to the panel
     * This is where we'll start monitoring in future phases
     */
    on_applet_added_to_panel: function() {
        this._log("Applet added to panel");

        // Future: Start timer for GPU monitoring
        // Will be implemented in Phase 2
    },

    /**
     * Called when applet is removed from panel
     * Cleanup any timers or resources here
     */
    on_applet_removed_from_panel: function() {
        this._log("Applet removed from panel");

        // Future: Stop timer and cleanup resources
        // Will be implemented in Phase 2
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
