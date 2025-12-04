# GPU Monitor Applet for Cinnamon

A lightweight Cinnamon taskbar applet displaying real-time NVIDIA GPU statistics.

## Features

- **Real-time Monitoring:** GPU utilization, memory usage, temperature, and fan speed
- **Dual Layout Modes:**
  - Single-row: `GPU: 42% | MEM: 35% | TEMP: 55°C | FAN: 65%`
  - Two-row (2x2): Perfect for dual-row taskbars
- **Configurable Refresh:** Choose between 1s, 2s, 5s, or 10s intervals
- **Temperature Color Coding:** Visual warnings for high temperatures
- **Low Overhead:** < 10MB memory, < 1% CPU usage

## Requirements

- Linux Mint with Cinnamon Desktop Environment
- NVIDIA GPU with drivers installed
- `nvidia-smi` command-line utility

## Installation

```bash
cd gpu-monitor@snatch
./install.sh
```

Then right-click on your Cinnamon panel → "Add applets to panel" → select "GPU Monitor"

## Configuration

Right-click the applet to:
- Switch between single-row and 2x2 layout
- Change refresh interval (1-10 seconds)

## Uninstallation

```bash
cd gpu-monitor@snatch
./uninstall.sh
```

## Troubleshooting

**Applet shows "GPU: --"**
- Verify nvidia-smi is installed: `which nvidia-smi`
- Check NVIDIA drivers: `nvidia-smi`
- Review logs: `tail ~/.xsession-errors | grep "GPU Monitor"`

**Applet not updating**
- Right-click → verify refresh interval is not too high
- Check if nvidia-smi responds: `nvidia-smi dmon -c 1`

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for development setup and contribution guidelines.

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system architecture details.

## Testing

```bash
cd tests
./test-runner.sh
```

## License

[To be determined]

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

**Version:** 0.0.1 (In Development)
**Author:** AI Agent
**Last Updated:** 2025-12-04
