#!/bin/bash
#
# Mock nvidia-smi for testing
#
# This script simulates nvidia-smi output for testing the applet
# without requiring actual NVIDIA GPU hardware
#
# Usage:
#   export PATH="$PWD/tests:$PATH"
#   nvidia-smi dmon -c 1
#

# Detect command type and respond appropriately
if [[ "$*" == *"dmon"* ]]; then
    # Mock dmon output - normal load
    cat <<'EOF'
# gpu    pwr  gtemp  mtemp     sm    mem    enc    dec    jpg    ofa     fb   bar1   ccpm
# Idx      W      C      C      %      %      %      %      %      %     MB     MB     MB
    0     85     55      -     42     35      0      0      0      0   4096    128      0
EOF

elif [[ "$*" == *"fan.speed"* ]]; then
    # Mock fan speed query
    echo "55"

else
    # Default mock output (standard nvidia-smi)
    cat <<'EOF'
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 535.129.03   Driver Version: 535.129.03   CUDA Version: 12.2   |
|-------------------------------+----------------------+----------------------+
| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|===============================+======================+======================|
|   0  NVIDIA GeForce RTX  On   | 00000000:01:00.0  On |                  N/A |
| 55%   55C    P2    85W / 250W |   4096MiB / 8192MiB |     42%      Default |
+-------------------------------+----------------------+----------------------+
EOF
fi

exit 0
