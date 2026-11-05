#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
node media/scripts/build-media.mjs
