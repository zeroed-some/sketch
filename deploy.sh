#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
STAMP=$(date +%Y-%m-%d-%H%M%S)
OUT=~/builds/$STAMP
mkdir -p "$OUT"

rsync -az --delete --exclude deploy.sh --exclude .git \
      "$PROJECT_DIR"/ "$OUT"/

rsync -az --delete "$OUT"/ /var/www/sketch.musicsian.com/releases/$STAMP/

sudo ln -nfs /var/www/sketch.musicsian.com/releases/$STAMP \
            /var/www/sketch.musicsian.com/current
sudo restorecon -Rv /var/www/sketch.musicsian.com/releases/$STAMP >/dev/null
sudo systemctl reload nginx
echo "✓ Deployed $STAMP to sketch.musicsian.com"