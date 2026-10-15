#!/bin/sh
# Stamps a unique version into sw.js and shared/update.js so every commit triggers a service-worker update in all Dash apps.
set -e
cd "$(git rev-parse --show-toplevel)"
V="$(date -u +%Y.%m.%d-%H%M%S)-$(git rev-parse --short HEAD 2>/dev/null || echo init)"
sed -i.bak "s/^const VERSION='[^']*';/const VERSION='$V';/" sw.js
sed -i.bak "s/^const DASH_VERSION='[^']*';/const DASH_VERSION='$V';/" shared/update.js
rm -f sw.js.bak shared/update.js.bak
git add sw.js shared/update.js
echo "Stamped version $V"
