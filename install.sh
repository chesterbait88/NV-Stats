#!/bin/bash
#
# NV-Stats - Installation Script
#
# NVIDIA Statistics Monitor for Cinnamon
# This script installs the applet to the local Cinnamon applets directory
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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "NV-Stats Installer"
echo "NVIDIA Statistics Monitor for Cinnamon"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "$SCRIPT_DIR/metadata.json" ]; then
    echo -e "${RED}Error: metadata.json not found!${NC}"
    echo "Please run this script from the applet directory."
    exit 1
fi

if [ ! -f "$SCRIPT_DIR/applet.js" ]; then
    echo -e "${RED}Error: applet.js not found!${NC}"
    echo "Please run this script from the applet directory."
    exit 1
fi

# Check if Cinnamon applets directory exists
if [ ! -d "$HOME/.local/share/cinnamon/applets" ]; then
    echo -e "${YELLOW}Creating Cinnamon applets directory...${NC}"
    mkdir -p "$HOME/.local/share/cinnamon/applets"
fi

# Remove old installation if exists
if [ -d "$APPLET_DIR" ]; then
    echo -e "${YELLOW}Removing previous installation...${NC}"
    rm -rf "$APPLET_DIR"
fi

# Create applet directory
echo "Creating applet directory..."
mkdir -p "$APPLET_DIR"

# Copy files
echo "Copying applet files..."
cp -v "$SCRIPT_DIR/metadata.json" "$APPLET_DIR/"
cp -v "$SCRIPT_DIR/applet.js" "$APPLET_DIR/"

# Copy optional files if they exist
if [ -f "$SCRIPT_DIR/settings-schema.json" ]; then
    cp -v "$SCRIPT_DIR/settings-schema.json" "$APPLET_DIR/"
fi

if [ -f "$SCRIPT_DIR/stylesheet.css" ]; then
    cp -v "$SCRIPT_DIR/stylesheet.css" "$APPLET_DIR/"
fi

# Set proper permissions
echo "Setting permissions..."
chmod 644 "$APPLET_DIR/metadata.json"
chmod 644 "$APPLET_DIR/applet.js"

if [ -f "$APPLET_DIR/settings-schema.json" ]; then
    chmod 644 "$APPLET_DIR/settings-schema.json"
fi

if [ -f "$APPLET_DIR/stylesheet.css" ]; then
    chmod 644 "$APPLET_DIR/stylesheet.css"
fi

# Verify installation
if [ -f "$APPLET_DIR/metadata.json" ] && [ -f "$APPLET_DIR/applet.js" ]; then
    echo ""
    echo -e "${GREEN}✓ Installation successful!${NC}"
    echo ""
    echo "Applet installed to: $APPLET_DIR"
    echo ""
    echo "To add the applet to your panel:"
    echo "1. Right-click on your Cinnamon panel"
    echo "2. Select 'Applets'"
    echo "3. Find 'NV-Stats' in the list"
    echo "4. Click the '+' button to add it"
    echo ""
    echo "Note: You may need to restart Cinnamon for changes to take effect."
    echo "      Press Ctrl+Alt+Esc to restart Cinnamon."
else
    echo -e "${RED}✗ Installation failed!${NC}"
    echo "Files were not copied correctly."
    exit 1
fi
