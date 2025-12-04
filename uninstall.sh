#!/bin/bash
#
# NV-Stats - Uninstallation Script
#
# NVIDIA Statistics Monitor for Cinnamon
# This script removes the applet from the Cinnamon applets directory
# and can be run multiple times safely (idempotent)
#

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Applet information
APPLET_UUID="NV-Stats@Chesterbait88"
APPLET_DIR="$HOME/.local/share/cinnamon/applets/$APPLET_UUID"

echo "========================================="
echo "NV-Stats Uninstaller"
echo "NVIDIA Statistics Monitor for Cinnamon"
echo "========================================="
echo ""

# Check if applet is installed
if [ ! -d "$APPLET_DIR" ]; then
    echo -e "${YELLOW}Applet is not installed.${NC}"
    echo "Nothing to uninstall."
    exit 0
fi

# Confirm directory before deletion
echo "Applet directory: $APPLET_DIR"
echo ""

# Remove applet directory
echo "Removing applet directory..."
rm -rf "$APPLET_DIR"

# Verify removal
if [ ! -d "$APPLET_DIR" ]; then
    echo ""
    echo -e "${GREEN}✓ Uninstallation successful!${NC}"
    echo ""
    echo "The applet has been removed from your system."
    echo ""
    echo "If the applet is currently in your panel:"
    echo "1. Right-click the applet"
    echo "2. Select 'Remove from panel'"
    echo ""
    echo "Or restart Cinnamon: Ctrl+Alt+Esc"
else
    echo -e "${RED}✗ Uninstallation failed!${NC}"
    echo "Could not remove directory: $APPLET_DIR"
    exit 1
fi
