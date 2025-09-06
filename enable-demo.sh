#!/usr/bin/env bash
set -e
grep -q '^DEMO_MODE=' .env.local 2>/dev/null && sed -i '' 's/^DEMO_MODE=.*/DEMO_MODE=true/' .env.local || echo "DEMO_MODE=true" >> .env.local
echo "DEMO_MODE=true (local)"
