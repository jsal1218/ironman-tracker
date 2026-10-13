#!/bin/sh
# Stamps a unique version into sw.js and app.js so every commit triggers a service-worker update.
set -e
cd "$(git rev-parse --show-toplevel)"
V="$(date -u +%Y.%m.%d-%H%M%S)-$(git rev-parse --short HEAD 2>/dev/null || echo init)"
sed -i.bak "s/^const VERSION='[^']*';/const VERSION='$V';/" sw.js
sed -i.bak "s/^const APP_VERSION='[^']*';/const APP_VERSION='$V';/" app.js
rm -f sw.js.bak app.js.bak
git add sw.js app.js
echo "Stamped version $V"
